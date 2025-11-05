export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  is_active: true,
};

export const mockAccessToken = 'mock-access-token';
export const mockRefreshToken = 'mock-refresh-token';

export const mockRoom = {
  id: 1,
  name: 'Test Room',
  description: 'Test Description',
  creator: mockUser,
  creator_name: 'Test User',
  room_type: 'chat',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
};

export const mockRooms = [mockRoom];

export const mockMessage = {
  id: 1,
  user: mockUser,
  content: 'Test message',
  created_at: '2025-01-01T00:00:00Z',
};

export const mockMessages = [mockMessage];

