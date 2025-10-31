from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with password confirmation"""
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
        }
    
    def validate_email(self, value):
        """Check email uniqueness (provides better error message than DB constraint)"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        """Validate password match and strength"""
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': "Passwords do not match."
            })
        
        if len(password) < 8:
            raise serializers.ValidationError({
                'password': "Password must be at least 8 characters long."
            })
        
        return attrs

    def create(self, validated_data):
        """Create user"""
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that uses email instead of username"""
    username_field = 'email'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Replace username field with email field
        self.fields.pop('username', None)
        self.fields['email'] = serializers.EmailField(required=True, label='Email')
    
    def validate(self, attrs):
        """Validate and authenticate user with email"""
        
        email = attrs.pop('email', None)
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')
        
        user = authenticate(request=self.context.get('request'), username=email, password=password)
        
        if not user:
            raise AuthenticationFailed(
                'No active account found with the given credentials.'
            )
        
        if not user.is_active:
            raise AuthenticationFailed('User account is disabled.')
        
        # Map email to the field expected by parent (username_field = 'email')
        attrs[self.username_field] = email
        
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    """User profile serializer"""
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'is_active', 'is_staff', 'is_superuser', 
                  'last_login', 'date_joined']
        read_only_fields = ['id', 'last_login', 'date_joined']