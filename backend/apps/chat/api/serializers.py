from rest_framework import serializers
from apps.chat.models import Message


class MessageUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    name = serializers.CharField(allow_blank=True)


class MessageSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'user', 'content', 'created_at']

    def get_user(self, obj):
        user = obj.user
        return {
            'id': user.id,
            'email': getattr(user, 'email', ''),
            'name': getattr(user, 'name', ''),
        }
