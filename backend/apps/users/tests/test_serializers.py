from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers

from apps.users.api.serializers import (
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer
)

User = get_user_model()


class UserRegistrationSerializerTest(TestCase):
    """Test UserRegistrationSerializer"""
    
    def setUp(self):
        self.valid_data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'testpass123',
            'confirm_password': 'testpass123'
        }
    
    def test_valid_serializer_creates_user(self):
        """Test serializer creates user with valid data"""
        serializer = UserRegistrationSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertIsInstance(user, User)
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test User')
        self.assertTrue(user.check_password('testpass123'))
    
    def test_serializer_validates_email_uniqueness(self):
        """Test serializer validates email uniqueness"""
        User.objects.create_user(
            email='test@example.com',
            name='Existing User',
            password='pass123'
        )
        serializer = UserRegistrationSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_serializer_validates_password_match(self):
        """Test serializer validates password confirmation"""
        data = self.valid_data.copy()
        data['confirm_password'] = 'differentpass123'
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('confirm_password', serializer.errors)
    
    def test_serializer_validates_password_length(self):
        """Test serializer validates minimum password length"""
        data = self.valid_data.copy()
        data['password'] = 'short'
        data['confirm_password'] = 'short'
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_serializer_removes_confirm_password_on_create(self):
        """Test serializer removes confirm_password in create() method"""
        serializer = UserRegistrationSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertIsInstance(user, User)
        self.assertEqual(user.email, 'test@example.com')


class CustomTokenObtainPairSerializerTest(TestCase):
    """Test CustomTokenObtainPairSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
    
    def test_valid_credentials_return_tokens(self):
        """Test valid credentials return access and refresh tokens"""
        serializer = CustomTokenObtainPairSerializer(data={
            'email': 'test@example.com',
            'password': 'testpass123'
        }, context={'request': None})
        self.assertTrue(serializer.is_valid())
        data = serializer.validated_data
        self.assertIn('access', data)
        self.assertIn('refresh', data)
    
    def test_invalid_email_raises_error(self):
        """Test invalid email raises AuthenticationFailed"""
        serializer = CustomTokenObtainPairSerializer(data={
            'email': 'wrong@example.com',
            'password': 'testpass123'
        }, context={'request': None})
        with self.assertRaises(AuthenticationFailed):
            serializer.validate({
                'email': 'wrong@example.com',
                'password': 'testpass123'
            })
    
    def test_invalid_password_raises_error(self):
        """Test invalid password raises AuthenticationFailed"""
        serializer = CustomTokenObtainPairSerializer(data={
            'email': 'test@example.com',
            'password': 'wrongpass'
        }, context={'request': None})
        with self.assertRaises(AuthenticationFailed):
            serializer.validate({
                'email': 'test@example.com',
                'password': 'wrongpass'
            })
    
    def test_inactive_user_raises_error(self):
        """Test inactive user raises AuthenticationFailed"""
        self.user.is_active = False
        self.user.save()
        serializer = CustomTokenObtainPairSerializer(data={
            'email': 'test@example.com',
            'password': 'testpass123'
        }, context={'request': None})
        with self.assertRaises(AuthenticationFailed):
            serializer.validate({
                'email': 'test@example.com',
                'password': 'testpass123'
            })
    
    def test_missing_email_or_password_raises_error(self):
        """Test missing email or password raises ValidationError"""
        serializer = CustomTokenObtainPairSerializer(data={}, context={'request': None})
        with self.assertRaises(serializers.ValidationError):
            serializer.validate({})


class UserSerializerTest(TestCase):
    """Test UserSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
    
    def test_serializer_returns_correct_fields(self):
        """Test serializer returns all user fields"""
        serializer = UserSerializer(self.user)
        data = serializer.data
        self.assertIn('id', data)
        self.assertIn('name', data)
        self.assertIn('email', data)
        self.assertIn('is_active', data)
        self.assertIn('date_joined', data)
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['name'], 'Test User')
    
    def test_serializer_read_only_fields(self):
        """Test read-only fields cannot be updated"""
        serializer = UserSerializer(
            self.user,
            data={'id': 999, 'name': 'Updated Name'},
            partial=True
        )
        self.assertTrue(serializer.is_valid())
        serializer.save()
        self.assertEqual(self.user.id, self.user.id)
        self.assertEqual(self.user.name, 'Updated Name')

