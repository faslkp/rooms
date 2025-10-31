from django.db import models
from django.conf import settings


class Room(models.Model):
    """Room model for chat and video rooms"""
    
    ROOM_TYPE_CHOICES = [
        ('chat', 'Chat'),
        ('video', 'Video'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    room_type = models.CharField(
        max_length=10,
        choices=ROOM_TYPE_CHOICES,
        default='chat'
    )
    
    class Meta:
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_room_type_display()})"
