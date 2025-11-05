from django.test import TestCase
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
import json
import time
import asyncio

from apps.chat.consumers import ChatConsumer
from apps.rooms.models import Room
from apps.chat.models import Message
from config.asgi import application

User = get_user_model()


class ChatConsumerTest(TestCase):
    """Test ChatConsumer"""
    
    def setUp(self):
        """Set up test data synchronously"""
        self.creator = User.objects.create_user(
            email='creator@example.com',
            name='Creator User',
            password='pass123'
        )
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='pass123'
        )
        self.room = Room.objects.create(
            name='Test Room',
            creator=self.creator,
            room_type='chat'
        )
    
    async def get_access_token(self, user):
        """Helper to get JWT token for a user"""
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken.for_user(user)
        return str(token)
    
    async def test_connect_authenticated_user(self):
        """Test WebSocket connection with authenticated user"""
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{self.room.id}/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()
    
    async def test_connect_unauthenticated_user(self):
        """Test WebSocket connection rejects unauthenticated user"""
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{self.room.id}/'
        )
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(communicator.close_code, 4401)
        await communicator.disconnect()
    
    async def test_connect_invalid_room(self):
        """Test WebSocket connection rejects invalid room"""
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/99999/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(communicator.close_code, 4404)
        await communicator.disconnect()
    
    async def test_connect_inactive_room(self):
        """Test WebSocket connection rejects inactive room"""
        inactive_room = await database_sync_to_async(Room.objects.create)(
            name='Inactive Room',
            creator=self.creator,
            is_active=False
        )
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{inactive_room.id}/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(communicator.close_code, 4404)
        await communicator.disconnect()
    
    async def test_send_chat_message(self):
        """Test sending a chat message via WebSocket"""
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{self.room.id}/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        message_data = {
            'type': 'chat-message',
            'content': 'Hello, world!'
        }
        await communicator.send_json_to(message_data)
        
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'chat-message')
        self.assertEqual(response['content'], 'Hello, world!')
        self.assertEqual(response['user']['id'], self.user.id)
        
        message_count = await database_sync_to_async(Message.objects.filter(room=self.room).count)()
        self.assertEqual(message_count, 1)
        
        await communicator.disconnect()
    
    async def test_send_empty_chat_message(self):
        """Test empty chat message is rejected"""
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{self.room.id}/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        message_data = {
            'type': 'chat-message',
            'content': '   '
        }
        await communicator.send_json_to(message_data)
        
        try:
            response = await asyncio.wait_for(communicator.receive_json_from(), timeout=0.5)
            self.fail("Should not receive response for empty message")
        except asyncio.TimeoutError:
            pass
        
        await communicator.disconnect()
    
    async def test_send_webrtc_offer(self):
        """Test sending WebRTC offer signal"""
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{self.room.id}/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        offer_data = {
            'type': 'webrtc-offer',
            'sdp': 'test-sdp-offer'
        }
        await communicator.send_json_to(offer_data)
        
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'webrtc-offer')
        self.assertEqual(response['sdp'], 'test-sdp-offer')
        self.assertEqual(response['sender_id'], self.user.id)
        
        await communicator.disconnect()
    
    async def test_send_webrtc_answer(self):
        """Test sending WebRTC answer signal"""
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{self.room.id}/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        answer_data = {
            'type': 'webrtc-answer',
            'sdp': 'test-sdp-answer'
        }
        await communicator.send_json_to(answer_data)
        
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'webrtc-answer')
        self.assertEqual(response['sdp'], 'test-sdp-answer')
        self.assertEqual(response['sender_id'], self.user.id)
        
        await communicator.disconnect()
    
    async def test_send_webrtc_ice_candidate(self):
        """Test sending WebRTC ICE candidate signal"""
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{self.room.id}/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        ice_data = {
            'type': 'webrtc-ice-candidate',
            'candidate': {'candidate': 'test-candidate'}
        }
        await communicator.send_json_to(ice_data)
        
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'webrtc-ice-candidate')
        self.assertEqual(response['sender_id'], self.user.id)
        
        await communicator.disconnect()
    
    async def test_send_webrtc_hangup(self):
        """Test sending WebRTC hangup signal"""
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{self.room.id}/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        hangup_data = {
            'type': 'webrtc-hangup'
        }
        await communicator.send_json_to(hangup_data)
        
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'webrtc-hangup')
        self.assertEqual(response['sender_id'], self.user.id)
        
        await communicator.disconnect()
    
    async def test_disconnect(self):
        """Test WebSocket disconnect removes user from group"""
        token = await self.get_access_token(self.user)
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{self.room.id}/?token={token}'
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.disconnect()
        self.assertIsNotNone(communicator.close_code)

