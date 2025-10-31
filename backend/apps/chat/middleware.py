import logging
from urllib.parse import parse_qs

from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections

from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from channels.auth import AuthMiddlewareStack
from asgiref.sync import sync_to_async

logger = logging.getLogger('apps.chat')


class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner
        self.jwt_auth = JWTAuthentication()

    def _validate_and_get_user(self, raw_token):
        # Synchronous helper: validate JWT and fetch user
        UntypedToken(raw_token)
        validated = self.jwt_auth.get_validated_token(raw_token)
        user = self.jwt_auth.get_user(validated)
        return user

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token_list = params.get('token', [])

        scope['user'] = AnonymousUser()

        if token_list:
            raw_token = token_list[0]
            try:
                logger.debug("WS AUTH: validating token present")
                user = await sync_to_async(self._validate_and_get_user, thread_sensitive=True)(raw_token)
                scope['user'] = user
                logger.info(f"WS AUTH: success user_id={getattr(user, 'id', None)}")
            except Exception as e:
                logger.warning(f"WS AUTH: failed token validation: {e}")
                scope['user'] = AnonymousUser()
            finally:
                await sync_to_async(close_old_connections, thread_sensitive=True)()
        else:
            logger.warning("WS AUTH: no token provided in query string")

        return await self.inner(scope, receive, send)


def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(AuthMiddlewareStack(inner))
