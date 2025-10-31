from django.contrib import admin
from apps.rooms.models import Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_type', 'creator', 'created_at', 'is_active']
    list_filter = ['room_type', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'creator__email']
    readonly_fields = ['created_at', 'creator']
    
    def get_readonly_fields(self, request, obj=None):
        """Make creator read-only on edit, can't change it"""
        if obj:
            return self.readonly_fields + ['creator']
        return ['created_at']