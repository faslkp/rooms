from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

User = get_user_model()


class UserManagerTest(TestCase):
    """Test UserManager methods"""
    
    def test_create_user_success(self):
        """Test creating a user with email and name"""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test User')
        self.assertTrue(user.check_password('testpass123'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    def test_create_user_missing_email(self):
        """Test creating user without email raises ValueError"""
        with self.assertRaises(ValueError) as cm:
            User.objects.create_user(
                email='',
                name='Test User',
                password='testpass123'
            )
        self.assertIn('Email', str(cm.exception))
    
    def test_create_user_missing_name(self):
        """Test creating user without name raises ValueError"""
        with self.assertRaises(ValueError) as cm:
            User.objects.create_user(
                email='test@example.com',
                name='',
                password='testpass123'
            )
        self.assertIn('Name', str(cm.exception))
    
    def test_create_user_normalizes_email(self):
        """Test email normalization"""
        user = User.objects.create_user(
            email='TEST@EXAMPLE.COM',
            name='Test User',
            password='testpass123'
        )
        self.assertEqual(user.email, 'TEST@example.com')
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        superuser = User.objects.create_superuser(
            email='admin@example.com',
            name='Admin User',
            password='adminpass123'
        )
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertEqual(superuser.email, 'admin@example.com')
    
    def test_create_superuser_must_have_is_staff(self):
        """Test superuser creation requires is_staff=True"""
        with self.assertRaises(ValueError) as cm:
            User.objects.create_superuser(
                email='admin@example.com',
                name='Admin User',
                password='adminpass123',
                is_staff=False
            )
        self.assertIn('is_staff', str(cm.exception))
    
    def test_create_superuser_must_have_is_superuser(self):
        """Test superuser creation requires is_superuser=True"""
        with self.assertRaises(ValueError) as cm:
            User.objects.create_superuser(
                email='admin@example.com',
                name='Admin User',
                password='adminpass123',
                is_superuser=False
            )
        self.assertIn('is_superuser', str(cm.exception))


class UserModelTest(TestCase):
    """Test User model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
    
    def test_user_str(self):
        """Test User.__str__ returns email"""
        self.assertEqual(str(self.user), 'test@example.com')
    
    def test_user_get_full_name(self):
        """Test User.get_full_name returns name"""
        self.assertEqual(self.user.get_full_name(), 'Test User')
    
    def test_user_get_short_name(self):
        """Test User.get_short_name returns name"""
        self.assertEqual(self.user.get_short_name(), 'Test User')
    
    def test_email_uniqueness(self):
        """Test email must be unique"""
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='test@example.com',
                name='Another User',
                password='testpass123'
            )
    
    def test_username_field_is_email(self):
        """Test USERNAME_FIELD is email"""
        self.assertEqual(User.USERNAME_FIELD, 'email')
    
    def test_required_fields_includes_name(self):
        """Test REQUIRED_FIELDS includes name"""
        self.assertIn('name', User.REQUIRED_FIELDS)

