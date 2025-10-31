# API Documentation

This document provides detailed information about the Rooms application REST API and WebSocket API.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: (Configure based on your deployment)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access-token>
```

Tokens expire after 24 hours. Use the refresh endpoint to get a new access token.

## REST API Endpoints

### Authentication

#### Register User

Create a new user account.

```http
POST /auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "date_joined": "2024-01-01T00:00:00Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "email": ["A user with this email already exists."],
  "password": ["This password is too common."]
}
```

#### Login

Authenticate and receive JWT tokens.

```http
POST /auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Error Response** (401 Unauthorized):
```json
{
  "detail": "No active account found with the given credentials"
}
```

#### Refresh Token

Get a new access token using a refresh token.

```http
POST /auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Get User Profile

Retrieve the authenticated user's profile.

```http
GET /auth/profile/
Authorization: Bearer <access-token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "date_joined": "2024-01-01T00:00:00Z"
}
```

#### Update User Profile

Update the authenticated user's profile.

```http
PATCH /auth/profile/
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Updated Name",
  "date_joined": "2024-01-01T00:00:00Z"
}
```

#### Delete User Profile

Delete the authenticated user's account.

```http
DELETE /auth/profile/
Authorization: Bearer <access-token>
```

**Response** (204 No Content)

#### Logout

Logout endpoint (frontend should delete token from storage).

```http
POST /auth/logout/
Authorization: Bearer <access-token>
```

**Response** (200 OK):
```json
{
  "message": "Successfully logged out"
}
```

### Rooms

All room endpoints require authentication.

#### List Rooms

Get a list of all active rooms.

```http
GET /api/rooms/
Authorization: Bearer <access-token>
```

**Query Parameters**:
- No query parameters currently supported

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "General Chat",
    "description": "Main chat room",
    "creator": {
      "id": 1,
      "email": "creator@example.com",
      "name": "Creator Name"
    },
    "room_type": "chat",
    "created_at": "2024-01-01T00:00:00Z",
    "is_active": true
  },
  {
    "id": 2,
    "name": "Video Conference",
    "description": "Video chat room",
    "creator": {
      "id": 1,
      "email": "creator@example.com",
      "name": "Creator Name"
    },
    "room_type": "video",
    "created_at": "2024-01-02T00:00:00Z",
    "is_active": true
  }
]
```

#### Create Room

Create a new room.

```http
POST /api/rooms/
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "New Room",
  "description": "Room description",
  "room_type": "chat"
}
```

**Request Body**:
- `name` (string, required): Room name (max 100 characters)
- `description` (string, optional): Room description
- `room_type` (string, required): Either `"chat"` or `"video"`

**Response** (201 Created):
```json
{
  "id": 3,
  "name": "New Room",
  "description": "Room description",
  "creator": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  },
  "room_type": "chat",
  "created_at": "2024-01-03T00:00:00Z",
  "is_active": true
}
```

#### Get Room Details

Retrieve details of a specific room.

```http
GET /api/rooms/{id}/
Authorization: Bearer <access-token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "General Chat",
  "description": "Main chat room",
  "creator": {
    "id": 1,
    "email": "creator@example.com",
    "name": "Creator Name"
  },
  "room_type": "chat",
  "created_at": "2024-01-01T00:00:00Z",
  "is_active": true
}
```

**Error Response** (404 Not Found):
```json
{
  "detail": "Not found."
}
```

#### Update Room

Update a room (only the creator can update).

```http
PATCH /api/rooms/{id}/
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Room Name",
  "description": "Updated description"
}
```

**Request Body**:
- `name` (string, optional): Room name
- `description` (string, optional): Room description

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Updated Room Name",
  "description": "Updated description",
  "creator": {
    "id": 1,
    "email": "creator@example.com",
    "name": "Creator Name"
  },
  "room_type": "chat",
  "created_at": "2024-01-01T00:00:00Z",
  "is_active": true
}
```

#### Delete Room

Soft delete a room (sets `is_active=False`). Only the creator can delete.

```http
DELETE /api/rooms/{id}/
Authorization: Bearer <access-token>
```

**Response** (204 No Content)

**Error Response** (403 Forbidden):
```json
{
  "detail": "You can only delete rooms you created."
}
```

#### Get Room Messages

Get all messages for a specific room.

```http
GET /api/rooms/{room_id}/messages/
Authorization: Bearer <access-token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    },
    "content": "Hello, world!",
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "user": {
      "id": 2,
      "email": "user2@example.com",
      "name": "Another User"
    },
    "content": "Hi there!",
    "created_at": "2024-01-01T00:05:00Z"
  }
]
```

Messages are ordered by `created_at` in ascending order (oldest first).

## WebSocket API

### Connection

Connect to a room's WebSocket for real-time messaging and WebRTC signaling:

```
ws://localhost:8000/ws/chat/{room_id}/
```

**Connection Headers**:
```
Authorization: Bearer <access-token>
```

**Example**:
```
ws://localhost:8000/ws/chat/1/
```

### Authentication

WebSocket connections are authenticated using JWT tokens. The token is validated via middleware before the connection is accepted.

### Connection States

- **Connecting**: Initial connection attempt
- **Connected**: Successfully connected to the room
- **Disconnected**: Connection closed

### Message Format

All WebSocket messages are JSON strings.

### Client → Server Messages

#### Send Chat Message

```json
{
  "content": "Hello, everyone!"
}
```

**Response**: The message is broadcast to all users in the room (including the sender).

#### WebRTC Offer

Send a WebRTC offer to initiate a video call.

```json
{
  "type": "webrtc-offer",
  "offer": {
    "type": "offer",
    "sdp": "v=0\r\no=- 123456789 2 IN IP4..."
  }
}
```

#### WebRTC Answer

Send a WebRTC answer in response to an offer.

```json
{
  "type": "webrtc-answer",
  "answer": {
    "type": "answer",
    "sdp": "v=0\r\no=- 987654321 2 IN IP4..."
  }
}
```

#### WebRTC ICE Candidate

Send an ICE candidate for NAT traversal.

```json
{
  "type": "webrtc-ice-candidate",
  "candidate": {
    "candidate": "candidate:1 1 UDP 2130706431 192.168.1.1 54321 typ host",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
  }
}
```

#### WebRTC Hang Up

Signal that the video call should end.

```json
{
  "type": "webrtc-hangup"
}
```

### Server → Client Messages

#### Chat Message

Received when a user sends a chat message.

```json
{
  "id": 1,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  },
  "content": "Hello, everyone!",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### WebRTC Signal

Received for WebRTC signaling messages (offer, answer, ICE candidate, hangup).

```json
{
  "type": "webrtc-offer",
  "sender_id": 1,
  "offer": {
    "type": "offer",
    "sdp": "..."
  }
}
```

The `sender_id` is automatically added by the server.

### Error Handling

#### Connection Errors

- **401 Unauthorized**: Invalid or missing authentication token
- **404 Not Found**: Room does not exist or is not active
- **1011 Internal Error**: Channel layer error (e.g., Redis not available)

#### Message Errors

Invalid messages are silently dropped and logged on the server side.

### Example WebSocket Client (JavaScript)

```javascript
const token = 'your-access-token';
const roomId = 1;

const ws = new WebSocket(`ws://localhost:8000/ws/chat/${roomId}/`, [], {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

ws.onopen = () => {
  console.log('Connected to room');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.id) {
    // Chat message
    console.log(`${message.user.name}: ${message.content}`);
  } else if (message.type) {
    // WebRTC signal
    handleWebRTCSignal(message);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from room');
};

// Send a chat message
function sendMessage(content) {
  ws.send(JSON.stringify({ content }));
}

// Send WebRTC offer
function sendOffer(offer) {
  ws.send(JSON.stringify({
    type: 'webrtc-offer',
    offer
  }));
}
```

## Error Responses

All error responses follow a consistent format:

### 400 Bad Request
```json
{
  "field_name": ["Error message"],
  "another_field": ["Another error message"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You can only delete rooms you created."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "A server error occurred."
}
```

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting for production use.

## Pagination

Currently, pagination is not implemented. All list endpoints return all results. Consider adding pagination for rooms and messages lists.

## Filtering and Search

Currently, filtering and search are not implemented. Consider adding:
- Filter rooms by type (chat/video)
- Search rooms by name
- Filter messages by date range
- Search messages by content

## WebRTC Signaling

The application uses WebRTC for peer-to-peer video communication. Signaling is handled through WebSockets, while actual media streaming is peer-to-peer.

### STUN/TURN Servers

Currently, the application uses Google's public STUN server:
```
stun:stun.l.google.com:19302
```

For production, consider setting up your own STUN/TURN servers for better reliability, especially for users behind restrictive NATs.

### WebRTC Flow

1. User A creates an offer and sends it via WebSocket
2. Server broadcasts the offer to all other users in the room
3. User B receives the offer, creates an answer, and sends it back
4. Server broadcasts the answer to all users (or directly to User A)
5. Users exchange ICE candidates for NAT traversal
6. Peer-to-peer connection is established
7. Video/audio streams flow directly between peers

## Security Considerations

1. **JWT Tokens**: Store tokens securely (not in localStorage for production)
2. **HTTPS**: Always use HTTPS in production
3. **WSS**: Use WSS (secure WebSocket) in production
4. **Input Validation**: All user input is validated
5. **SQL Injection**: Django ORM prevents SQL injection
6. **XSS**: React automatically escapes content
7. **CORS**: Configure CORS properly for production

