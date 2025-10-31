# Rooms - Real-Time Chat and Video Room Application

A full-stack application for creating and managing real-time chat and video rooms. Built with Django REST Framework backend and React frontend, featuring WebSocket-based real-time messaging and WebRTC video chat capabilities.

## 🚀 Features

- **User Authentication**: JWT-based authentication with email and password
- **Room Management**: Create, view, update, and delete chat/video rooms
- **Real-Time Chat**: WebSocket-based messaging with instant message delivery
- **Video Chat**: WebRTC peer-to-peer video communication
- **Responsive UI**: Modern, mobile-friendly interface built with React and Tailwind CSS
- **RESTful API**: Clean, well-documented REST API endpoints
- **Comprehensive Logging**: Request tracking and logging throughout the application

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [WebSocket API](#websocket-api)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🛠 Tech Stack

### Backend
- **Django 5.2.7**: Web framework
- **Django REST Framework**: REST API
- **Django Channels**: WebSocket support for real-time features
- **Redis**: Channel layer for WebSocket communication
- **djangorestframework-simplejwt**: JWT authentication
- **SQLite**: Database (easily configurable for PostgreSQL/MySQL)
- **daphne**: ASGI server for Django Channels

### Frontend
- **React 19**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Tailwind CSS**: Utility-first CSS framework
- **WebRTC**: Peer-to-peer video communication
- **Vitest**: Testing framework

## 📁 Project Structure

```
rooms/
├── backend/                 # Django backend
│   ├── apps/
│   │   ├── common/          # Shared utilities (logging, middleware)
│   │   ├── users/           # User management app
│   │   ├── rooms/           # Room management app
│   │   └── chat/            # Chat and WebSocket app
│   ├── config/              # Django settings
│   │   ├── settings.py      # Main settings
│   │   ├── urls.py          # URL routing
│   │   ├── asgi.py          # ASGI configuration
│   │   └── wsgi.py          # WSGI configuration
│   ├── manage.py
│   ├── requirements.txt     # Python dependencies
│   └── db.sqlite3           # SQLite database
│
└── frontend/                # React frontend
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   ├── services/        # API and WebSocket services
    │   ├── context/         # React context (auth)
    │   └── App.jsx          # Main app component
    ├── package.json
    └── vite.config.js
```

## 📦 Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **Redis** (for WebSocket channel layer)
- **Git**

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rooms
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create a superuser (optional, for admin access)
python manage.py createsuperuser
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

### 4. Redis Setup

Redis is required for WebSocket functionality. Install Redis based on your operating system:

**Windows:**
- Download and install from [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
- Or use WSL2 with Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Logging
LOG_LEVEL=DEBUG
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🚀 Running the Application

### Start Redis

Make sure Redis is running before starting the backend:

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

### Start Backend Server

```bash
# From backend directory
cd backend
# Activate virtual environment if not already activated
python manage.py runserver
# Or use daphne for WebSocket support
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

The backend will be available at `http://localhost:8000`

### Start Frontend Development Server

```bash
# From frontend directory
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Access Admin Panel

Visit `http://localhost:8000/admin` and login with your superuser credentials.

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "date_joined": "2024-01-01T00:00:00Z"
}
```

#### Login
```http
POST /auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Refresh Token
```http
POST /auth/token/refresh/
Content-Type: application/json

{
  "refresh": "your-refresh-token"
}
```

#### Get User Profile
```http
GET /auth/profile/
Authorization: Bearer <access-token>
```

#### Update User Profile
```http
PATCH /auth/profile/
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Logout
```http
POST /auth/logout/
Authorization: Bearer <access-token>
```

### Room Endpoints

All room endpoints require authentication (JWT token).

#### List Rooms
```http
GET /api/rooms/
Authorization: Bearer <access-token>
```

**Response:**
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
  }
]
```

#### Create Room
```http
POST /api/rooms/
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "New Room",
  "description": "Room description",
  "room_type": "chat"  // or "video"
}
```

#### Get Room Details
```http
GET /api/rooms/{id}/
Authorization: Bearer <access-token>
```

#### Update Room
```http
PATCH /api/rooms/{id}/
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Room Name",
  "description": "Updated description"
}
```

#### Delete Room (Soft Delete)
```http
DELETE /api/rooms/{id}/
Authorization: Bearer <access-token>
```

#### Get Room Messages
```http
GET /api/rooms/{room_id}/messages/
Authorization: Bearer <access-token>
```

**Response:**
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
  }
]
```

## 🔌 WebSocket API

### Connection

Connect to a room's WebSocket:

```
ws://localhost:8000/ws/chat/{room_id}/
```

**Headers:**
```
Authorization: Bearer <access-token>
```

### Message Types

#### Send Chat Message
```json
{
  "type": "chat",
  "content": "Hello, everyone!"
}
```

#### Receive Chat Message
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

#### WebRTC Signaling

**Send Offer:**
```json
{
  "type": "webrtc-offer",
  "offer": {
    "type": "offer",
    "sdp": "..."
  }
}
```

**Send Answer:**
```json
{
  "type": "webrtc-answer",
  "answer": {
    "type": "answer",
    "sdp": "..."
  }
}
```

**Send ICE Candidate:**
```json
{
  "type": "webrtc-ice-candidate",
  "candidate": {
    "candidate": "...",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
  }
}
```

**Hang Up:**
```json
{
  "type": "webrtc-hangup"
}
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

Run specific app tests:
```bash
python manage.py test apps.users
python manage.py test apps.rooms
python manage.py test apps.chat
```

### Frontend Tests

```bash
cd frontend
npm test                 # Run tests once
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

## 🚢 Deployment

### Production Considerations

1. **Environment Variables**: Set all environment variables in production
2. **SECRET_KEY**: Generate a strong secret key for production
3. **DEBUG**: Set `DEBUG=False` in production
4. **Database**: Switch from SQLite to PostgreSQL or MySQL
5. **Static Files**: Configure proper static file serving
6. **HTTPS**: Use HTTPS for WebSocket connections (WSS)
7. **Redis**: Use Redis Cloud or managed Redis service
8. **CORS**: Configure CORS properly for production domain
9. **WebRTC**: Consider using a TURN server for video chat (WebRTC needs STUN/TURN for NAT traversal)

### Example Production Settings

```python
# backend/config/settings.py (production overrides)
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com']
CORS_ALLOWED_ORIGINS = ['https://yourdomain.com']

# Use PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### WebSocket Connection Issues

- Ensure Redis is running: `redis-cli ping`
- Check CORS settings in Django settings
- Verify the WebSocket URL format: `ws://localhost:8000/ws/chat/{room_id}/`
- Check authentication token is valid

### Database Issues

- Run migrations: `python manage.py migrate`
- Create superuser: `python manage.py createsuperuser`

### Frontend Build Issues

- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## 📧 Support

For support, please open an issue on the GitHub repository.

## 🙏 Acknowledgments

- Django and Django Channels communities
- React and Vite teams
- All contributors and users of this project

