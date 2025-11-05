from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.rooms.models import Room

User = get_user_model()


class RoomViewSetTest(TestCase):
    """Test RoomViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='pass123'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='pass123'
        )
        self.room = Room.objects.create(
            name='Test Room',
            description='Test Description',
            creator=self.user,
            room_type='chat'
        )
        self.inactive_room = Room.objects.create(
            name='Inactive Room',
            creator=self.user,
            is_active=False
        )
    
    def test_list_rooms_success(self):
        """Test listing active rooms"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/rooms/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        room_ids = [room['id'] for room in response.data]
        self.assertIn(self.room.id, room_ids)
        self.assertNotIn(self.inactive_room.id, room_ids)
    
    def test_list_rooms_unauthorized(self):
        """Test listing rooms without authentication"""
        response = self.client.get('/api/rooms/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_room_success(self):
        """Test creating a room"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'New Room',
            'description': 'Room Description',
            'room_type': 'video'
        }
        response = self.client.post('/api/rooms/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Room')
        self.assertEqual(response.data['room_type'], 'video')
        if 'creator' in response.data:
            self.assertEqual(response.data['creator']['id'], self.user.id)
        created_room = Room.objects.get(name='New Room')
        self.assertEqual(created_room.creator.id, self.user.id)
    
    def test_create_room_unauthorized(self):
        """Test creating room without authentication"""
        data = {
            'name': 'New Room',
            'room_type': 'chat'
        }
        response = self.client.post('/api/rooms/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_room_invalid_data(self):
        """Test creating room with invalid data"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': '',
            'room_type': 'invalid'
        }
        response = self.client.post('/api/rooms/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_retrieve_room_success(self):
        """Test retrieving room details"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/rooms/{self.room.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.room.id)
        self.assertEqual(response.data['name'], 'Test Room')
    
    def test_retrieve_inactive_room_404(self):
        """Test retrieving inactive room returns 404"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/rooms/{self.inactive_room.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_room_success(self):
        """Test updating room (creator can update)"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Updated Room',
            'description': 'Updated Description',
            'room_type': 'video'
        }
        response = self.client.put(f'/api/rooms/{self.room.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Room')
        self.room.refresh_from_db()
        self.assertEqual(self.room.name, 'Updated Room')
    
    def test_update_room_partial(self):
        """Test partial update of room"""
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Partially Updated Room'}
        response = self.client.patch(f'/api/rooms/{self.room.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Partially Updated Room')
    
    def test_update_room_unauthorized(self):
        """Test updating room without authentication"""
        data = {'name': 'Updated Room'}
        response = self.client.put(f'/api/rooms/{self.room.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_room_success(self):
        """Test deleting room (soft delete - is_active=False)"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/rooms/{self.room.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.room.refresh_from_db()
        self.assertFalse(self.room.is_active)
    
    def test_delete_room_only_creator(self):
        """Test only creator can delete room"""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(f'/api/rooms/{self.room.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.room.refresh_from_db()
        self.assertTrue(self.room.is_active)
    
    def test_delete_room_unauthorized(self):
        """Test deleting room without authentication"""
        response = self.client.delete(f'/api/rooms/{self.room.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

