from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.rooms.api.views import RoomViewSet
from apps.chat.api.views import RoomMessagesListView

router = DefaultRouter()
router.register(r'', RoomViewSet, basename='room')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:room_id>/messages/', RoomMessagesListView.as_view(), name='room-messages'),
]

