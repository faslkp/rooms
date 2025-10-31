# Architecture Documentation

This document describes the architecture and design decisions of the Rooms application.

## Overview

The Rooms application is a full-stack real-time communication platform built with:
- **Backend**: Django 5.2.7 with Django Channels for WebSocket support
- **Frontend**: React 19 with Vite build tool
- **Database**: SQLite (configurable for PostgreSQL/MySQL)
- **Cache/Message Queue**: Redis for Django Channels
- **Authentication**: JWT (JSON Web Tokens)
- **Video Communication**: WebRTC (peer-to-peer)

## System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │────────▶│   React     │────────▶│  Django     │
│  (Client)   │◀────────│  Frontend   │◀────────│  Backend    │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      │                  WebSocket                     │
      │                        │                        │
      │                        ▼                        │
      │                  ┌──────────┐                 │
      │                  │  Redis   │                 │
      │                  │ Channels │                 │
      │                  └──────────┘                 │
      │                                                 │
      │                                                 │
      │           WebRTC (P2P)                         │
      │                                                 │
      └─────────────────────────────────────────────────┘
```

## Backend Architecture

### Django Application Structure

```
backend/
├── config/                 # Django project settings
│   ├── settings.py         # Main configuration
│   ├── urls.py            # URL routing
│   ├── asgi.py            # ASGI app (WebSocket support)
│   └── wsgi.py            # WSGI app (HTTP only)
│
└── apps/                   # Django applications
    ├── common/             # Shared utilities
    │   ├── middleware.py   # Custom middleware
    │   └── logging_utils.py # Logging utilities
    │
    ├── users/              # User management
    │   ├── models.py      # User model
    │   ├── api/
    │   │   ├── views.py   # API views
    │   │   └── serializers.py # Data serialization
    │   └── urls.py        # URL patterns
    │
    ├── rooms/              # Room management
    │   ├── models.py      # Room model
    │   ├── api/
    │   │   ├── views.py   # API views (ViewSet)
    │   │   └── serializers.py # Room serializers
    │   └── urls.py        # URL patterns
    │
    └── chat/               # Chat and WebSocket
        ├── models.py      # Message model
        ├── consumers.py   # WebSocket consumers
        ├── routing.py     # WebSocket routing
        ├── middleware.py  # WebSocket auth middleware
        └── api/
            └── views.py   # Message API views
```

### Key Components

#### 1. Django Channels

Django Channels enables WebSocket support by:
- Using ASGI (Asynchronous Server Gateway Interface) instead of WSGI
- Channel layers for message routing between WebSocket connections
- Redis as the channel layer backend for scalability

**Flow:**
```
Client → WebSocket → ASGI → Consumer → Channel Layer → Redis → Other Consumers
```

#### 2. Custom User Model

The application uses a custom User model with:
- Email as the username (no username field)
- Name field for display
- JWT authentication instead of session-based

#### 3. Room Model

Rooms support two types:
- **Chat**: Text messaging only
- **Video**: Text messaging + video chat

#### 4. Message Model

Messages are stored in the database for persistence and linked to:
- Room (many-to-one relationship)
- User (many-to-one relationship)

### Authentication Flow

```
1. User registers/logs in → JWT tokens issued
2. Access token included in HTTP requests (Authorization header)
3. Access token included in WebSocket connection (via middleware)
4. Token validated → User authenticated
5. Refresh token used to get new access token when expired
```

### WebSocket Flow

```
1. Client connects: ws://host/ws/chat/{room_id}/
2. Middleware extracts JWT token from connection
3. Token validated → User authenticated
4. Consumer checks if room exists and is active
5. Connection accepted → Added to channel group
6. Messages broadcast via channel layer (Redis)
7. All connected clients in room receive messages
```

### API Design

- **RESTful**: Follows REST principles
- **ViewSets**: Used for rooms (CRUD operations)
- **Generic Views**: Used for authentication endpoints
- **Serializers**: Handle data validation and transformation
- **Permissions**: JWT authentication required for most endpoints
- **Pagination**: Not implemented (can be added)
- **Filtering**: Not implemented (can be added)

## Frontend Architecture

### React Application Structure

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Navbar.jsx     # Navigation bar
│   │   ├── ChatRoom.jsx   # Chat room component
│   │   ├── VideoChat.jsx  # Video chat component
│   │   ├── PrivateRoute.jsx # Protected route wrapper
│   │   └── PublicRoute.jsx  # Public route wrapper
│   │
│   ├── pages/             # Page components
│   │   ├── Login.jsx      # Login page
│   │   ├── Register.jsx   # Registration page
│   │   ├── Rooms.jsx      # Rooms list page
│   │   └── RoomDetail.jsx # Room detail page
│   │
│   ├── services/          # API and WebSocket services
│   │   ├── api.js         # REST API client
│   │   ├── auth.js        # Authentication service
│   │   ├── ws.js          # WebSocket service
│   │   └── webrtc.js      # WebRTC utilities
│   │
│   ├── context/           # React context
│   │   └── AuthContext.jsx # Authentication context
│   │
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
│
└── vite.config.js         # Vite configuration
```

### Key Components

#### 1. Authentication Context

Provides authentication state and methods to:
- Login/logout
- Register
- Access current user
- Check authentication status

#### 2. Route Protection

- **PrivateRoute**: Redirects unauthenticated users to login
- **PublicRoute**: Redirects authenticated users to rooms

#### 3. API Service

Axios instance configured with:
- Base URL from environment
- JWT token interceptor
- Error handling

#### 4. WebSocket Service

Manages WebSocket connections:
- Connection management
- Message sending/receiving
- Reconnection logic
- WebRTC signaling

#### 5. WebRTC Service

Utilities for peer-to-peer video:
- Peer connection creation
- Offer/answer handling
- ICE candidate handling
- Stream management

### State Management

- **Context API**: For global authentication state
- **Local State**: React hooks for component state
- **No Redux**: Simple enough that Redux is not needed

### Routing

React Router handles:
- Login/Register pages (public)
- Rooms list and detail (protected)
- Automatic redirects based on auth status

## Database Schema

### Users Table

```
User
├── id (PK)
├── email (unique)
├── name
├── password (hashed)
├── is_staff
├── is_superuser
├── is_active
├── date_joined
└── last_login
```

### Rooms Table

```
Room
├── id (PK)
├── name
├── description
├── creator_id (FK → User)
├── room_type (chat | video)
├── is_active
└── created_at
```

### Messages Table

```
Message
├── id (PK)
├── room_id (FK → Room)
├── user_id (FK → User)
├── content
└── created_at
```

## Data Flow

### Chat Message Flow

```
1. User types message → Frontend
2. Frontend sends via WebSocket → Backend
3. Backend validates → Saves to database
4. Backend broadcasts via Channel Layer → Redis
5. Redis distributes to all consumers → Backend
6. All consumers send to clients → Frontend
7. All clients display message → UI
```

### Video Call Flow

```
1. User A initiates call → Creates offer
2. Offer sent via WebSocket → Backend
3. Backend broadcasts to room → Other users
4. User B receives offer → Creates answer
5. Answer sent via WebSocket → Backend
6. Backend broadcasts answer → User A
7. Users exchange ICE candidates → Via WebSocket
8. Peer-to-peer connection established → Direct video/audio
```

## Security Considerations

### Backend

1. **JWT Authentication**: Secure token-based auth
2. **CORS**: Configured to allow only trusted origins
3. **Input Validation**: All input validated via serializers
4. **SQL Injection**: Prevented by Django ORM
5. **Password Hashing**: Django's default password hasher
6. **HTTPS**: Recommended for production

### Frontend

1. **XSS Prevention**: React automatically escapes content
2. **Token Storage**: Stored in localStorage (consider httpOnly cookies for production)
3. **Input Validation**: Client-side validation (backend also validates)
4. **HTTPS**: Required for WebRTC in production

### WebSocket

1. **Authentication**: JWT token validated on connection
2. **Authorization**: Room access checked
3. **Message Validation**: All messages validated
4. **Rate Limiting**: Not implemented (can be added)

## Scalability

### Current Limitations

1. **Single Server**: Designed for single server deployment
2. **Redis Required**: WebSocket functionality requires Redis
3. **No Load Balancing**: Not configured for multiple backend instances

### Scaling Considerations

1. **Multiple Backend Instances**: 
   - Shared Redis instance for channel layers
   - Shared database
   - Load balancer for HTTP/WebSocket

2. **Database**:
   - Use PostgreSQL or MySQL for better performance
   - Connection pooling
   - Read replicas for reads

3. **Redis**:
   - Redis Cluster for high availability
   - Separate Redis for caching (optional)

4. **Static Files**:
   - CDN for static files
   - Object storage for media files

5. **WebRTC**:
   - TURN servers for NAT traversal
   - Media servers for better quality (optional)

## Performance

### Backend

- **Database Queries**: Use select_related/prefetch_related
- **Caching**: Not implemented (can add Redis caching)
- **Pagination**: Not implemented (can cause issues with large datasets)

### Frontend

- **Code Splitting**: Not implemented (can add with React.lazy)
- **Image Optimization**: Not implemented
- **Bundle Size**: Monitor and optimize

## Testing Strategy

### Backend

- Unit tests for models
- Unit tests for serializers
- Unit tests for views
- Integration tests for API endpoints
- WebSocket consumer tests

### Frontend

- Component tests with React Testing Library
- Service tests (mocked API)
- Integration tests for user flows

## Deployment Architecture

### Recommended Production Setup

```
                    ┌─────────────┐
                    │    Nginx    │
                    │ (Reverse    │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
    ┌───────▼───────┐            ┌───────▼───────┐
    │  Django 1     │            │  Django 2     │
    │  (Daphne)     │            │  (Daphne)     │
    └───────┬───────┘            └───────┬───────┘
            │                             │
            └─────────────┬───────────────┘
                          │
                  ┌───────▼───────┐
                  │   PostgreSQL   │
                  │   Database     │
                  └───────┬───────┘
                          │
                  ┌───────▼───────┐
                  │     Redis     │
                  │  (Channels)   │
                  └───────────────┘
```

### Docker Deployment

- Multi-stage builds for optimization
- Docker Compose for orchestration
- Health checks for services
- Volume mounts for persistent data

## Monitoring and Logging

### Logging

- Structured logging with request context
- Separate log files for HTTP and WebSocket
- Log rotation configured
- Different log levels for development/production

### Monitoring (Future)

- Application performance monitoring (APM)
- Error tracking (Sentry)
- Uptime monitoring
- Database query monitoring
- Redis monitoring

## Future Improvements

1. **Microservices**: Split into separate services if needed
2. **Message Queue**: Use RabbitMQ/Kafka for better message handling
3. **CDN**: For static assets and media
4. **Media Server**: For better video quality (SFU/MCU)
5. **Mobile Apps**: Native mobile applications
6. **Notifications**: Push notifications for messages
7. **Analytics**: User behavior and performance analytics

