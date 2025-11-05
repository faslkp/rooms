from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class UserRegistrationViewTest(TestCase):
    """Test user registration endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/auth/register/'
    
    def test_register_success(self):
        """Test successful user registration"""
        data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'testpass123',
            'confirm_password': 'testpass123'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['name'], 'Test User')
        self.assertTrue(User.objects.filter(email='test@example.com').exists())
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email returns 400"""
        User.objects.create_user(
            email='test@example.com',
            name='Existing User',
            password='pass123'
        )
        data = {
            'name': 'New User',
            'email': 'test@example.com',
            'password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_register_password_mismatch(self):
        """Test registration with mismatched passwords returns 400"""
        data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'testpass123',
            'confirm_password': 'differentpass123'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.data)
    
    def test_register_short_password(self):
        """Test registration with short password returns 400"""
        data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'short',
            'confirm_password': 'short'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)


class UserLoginViewTest(TestCase):
    """Test user login endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.login_url = '/auth/login/'
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
    
    def test_login_success(self):
        """Test successful login returns tokens"""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpass'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_nonexistent_user(self):
        """Test login with nonexistent user returns 401"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_inactive_user(self):
        """Test login with inactive user returns 401"""
        self.user.is_active = False
        self.user.save()
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileViewTest(TestCase):
    """Test user profile endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.profile_url = '/auth/profile/'
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
    
    def test_get_profile_success(self):
        """Test authenticated user can get their profile"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['name'], 'Test User')
    
    def test_get_profile_unauthorized(self):
        """Test unauthenticated user cannot get profile"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_profile_success(self):
        """Test authenticated user can update their profile"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Updated Name',
            'email': self.user.email,
        }
        response = self.client.put(self.profile_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Name')
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, 'Updated Name')
    
    def test_update_profile_unauthorized(self):
        """Test unauthenticated user cannot update profile"""
        data = {'name': 'Updated Name'}
        response = self.client.put(self.profile_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_profile_success(self):
        """Test authenticated user can delete their profile"""
        self.client.force_authenticate(user=self.user)
        user_id = self.user.id
        response = self.client.delete(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=user_id).exists())
    
    def test_delete_profile_unauthorized(self):
        """Test unauthenticated user cannot delete profile"""
        response = self.client.delete(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserLogoutViewTest(TestCase):
    """Test user logout endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.logout_url = '/auth/logout/'
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
    
    def test_logout_success(self):
        """Test authenticated user can logout"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
    
    def test_logout_unauthorized(self):
        """Test unauthenticated user cannot logout"""
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

