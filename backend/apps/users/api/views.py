import logging

from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.users.api.serializers import (
    UserRegistrationSerializer, 
    UserSerializer,
    CustomTokenObtainPairSerializer
)

logger = logging.getLogger('apps.users')


class UserRegistrationView(CreateAPIView):
    """Register a new user"""
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        logger.debug("AUTH register attempt")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        logger.info(f"AUTH register success user_id={user.id}")
        return Response(user_data, status=status.HTTP_201_CREATED)


class UserLoginView(TokenObtainPairView):
    """Login and get JWT tokens using email"""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class UserProfileView(RetrieveUpdateDestroyAPIView):
    """Get, update, or delete user profile"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        logger.debug(f"AUTH profile update user_id={request.user.id}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        logger.warning(f"AUTH profile delete user_id={request.user.id}")
        return super().destroy(request, *args, **kwargs)


class UserLogoutView(APIView):
    """Logout (frontend should delete token from storage)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logger.info(f"AUTH logout user_id={request.user.id}")
        return Response(
            {'message': 'Successfully logged out'}, 
            status=status.HTTP_200_OK
        )