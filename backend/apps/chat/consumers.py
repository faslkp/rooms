import json
import logging

from django.utils import timezone

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from apps.common.logging_utils import set_request_context


logger = logging.getLogger('apps.chat')

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.group_name = f'room_{self.room_id}'

        user = self.scope.get('user')
        set_request_context(user_id=str(getattr(user, 'id', '-')), room_id=str(self.room_id))
        logger.info(f"WS CONNECT room={self.room_id} user={getattr(user, 'id', '-')}")

        if not user or not user.is_authenticated:
            logger.warning("WS REJECT unauthorized")
            await self.close(code=4401)
            return

        room_exists = await self.room_exists(self.room_id)
        if not room_exists:
            logger.warning("WS REJECT room_not_found")
            await self.close(code=4404)
            return

        await self.accept()
        logger.info("WS ACCEPT")
        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            logger.debug(f"WS GROUP_ADD {self.group_name}")
        except Exception as e:
            logger.exception(f"WS GROUP_ADD failed: {e}")
            await self.close(code=1011)
            return

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass
        logger.info(f"WS DISCONNECT code={close_code}")

    async def receive(self, text_data):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            logger.warning("WS DROP message unauthenticated")
            return

        try:
            payload = json.loads(text_data or '{}')
            msg_type = payload.get('type')
            if msg_type in {"webrtc-offer", "webrtc-answer", "webrtc-ice-candidate", "webrtc-hangup"}:
                payload.setdefault('sender_id', user.id)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'webrtc.signal',
                        'payload': payload,
                    }
                )
                logger.debug(f"WS SIGNAL type={msg_type} size={len(text_data)}")
                return

            content = (payload.get('content') or '').strip()
            if not content:
                return
        except Exception as e:
            logger.exception("WS RECEIVE parse_error")
            return

        message = await self.save_message(self.room_id, user.id, content)
        logger.info(f"WS CHAT msg_id={message['id']} len={len(content)}")

        event = {
            'type': 'chat.message',
            'message': {
                'id': message['id'],
                'user': {'id': user.id, 'email': getattr(user, 'email', ''), 'name': getattr(user, 'name', '')},
                'content': message['content'],
                'created_at': message['created_at'],
            }
        }
        await self.channel_layer.group_send(self.group_name, event)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def webrtc_signal(self, event):
        await self.send(text_data=json.dumps(event['payload']))

    @database_sync_to_async
    def room_exists(self, room_id: int) -> bool:
        from apps.rooms.models import Room
        return Room.objects.filter(id=room_id, is_active=True).exists()

    @database_sync_to_async
    def save_message(self, room_id: int, user_id: int, content: str):
        from apps.chat.models import Message
        msg = Message.objects.create(
            room_id=room_id,
            user_id=user_id,
            content=content,
            created_at=timezone.now(),
        )
        return {
            'id': msg.id,
            'content': msg.content,
            'created_at': msg.created_at.isoformat(),
        }
