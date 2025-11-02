import os

from django.core.asgi import get_asgi_application


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()


from django.conf import settings

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

from apps.chat.routing import websocket_urlpatterns
from apps.chat.middleware import TokenAuthMiddlewareStack


_ws_app = TokenAuthMiddlewareStack(URLRouter(websocket_urlpatterns))

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": (_ws_app if getattr(settings, 'DEBUG', False) else AllowedHostsOriginValidator(_ws_app)),
})
