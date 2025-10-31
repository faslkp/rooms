# Setup Guide

This guide provides step-by-step instructions for setting up the Rooms application on your local machine or server.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** and npm: [Download Node.js](https://nodejs.org/)
- **Redis**: See installation instructions below
- **Git**: [Download Git](https://git-scm.com/downloads)

### Redis Installation

Redis is required for WebSocket functionality (Django Channels).

#### Windows

1. Download Redis from [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
2. Or use WSL2 with Redis installed
3. Or use Docker: `docker run -d -p 6379:6379 redis`

#### macOS

Using Homebrew:
```bash
brew install redis
brew services start redis
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Verify Redis Installation

```bash
redis-cli ping
# Should return: PONG
```

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rooms
```

### 2. Backend Setup

#### Step 1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2: Create Virtual Environment

```bash
# Windows
python -m venv venv

# macOS/Linux
python3 -m venv venv
```

#### Step 3: Activate Virtual Environment

```bash
# Windows (PowerShell)
venv\Scripts\Activate.ps1

# Windows (Command Prompt)
venv\Scripts\activate.bat

# macOS/Linux
source venv/bin/activate
```

#### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

If you encounter issues, you may need to upgrade pip:
```bash
pip install --upgrade pip
```

#### Step 5: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Logging
LOG_LEVEL=DEBUG
```

**Generate a secure SECRET_KEY:**
```python
# Python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

#### Step 6: Run Database Migrations

```bash
python manage.py migrate
```

#### Step 7: Create Superuser (Optional)

Create an admin user to access the Django admin panel:

```bash
python manage.py createsuperuser
```

Follow the prompts to enter email, name, and password.

#### Step 8: Collect Static Files (Optional for Development)

```bash
python manage.py collectstatic --noinput
```

### 3. Frontend Setup

#### Step 1: Navigate to Frontend Directory

From the project root:
```bash
cd frontend
```

#### Step 2: Install Dependencies

```bash
npm install
```

If you encounter issues:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Step 3: Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Start the Application

#### Start Redis

Make sure Redis is running:

```bash
# Check if Redis is running
redis-cli ping

# If not running, start it:
# Windows: Start Redis service or run redis-server.exe
# macOS: brew services start redis
# Linux: sudo systemctl start redis-server
```

#### Start Backend Server

In a terminal, navigate to the backend directory and run:

```bash
cd backend
source venv/bin/activate  # Activate virtual environment if not already active

# Option 1: Using Django's development server (HTTP only)
python manage.py runserver

# Option 2: Using Daphne (supports WebSockets)
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

The backend will be available at `http://localhost:8000`

#### Start Frontend Development Server

In a new terminal, navigate to the frontend directory and run:

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 5. Verify Installation

1. **Backend**: Visit `http://localhost:8000/admin` and login with your superuser credentials
2. **Frontend**: Visit `http://localhost:5173` - you should see the login page
3. **API**: Test the API at `http://localhost:8000/api/rooms/` (requires authentication)

## Production Setup

### Environment Variables

Create production `.env` files with secure values:

**Backend `.env`:**
```env
SECRET_KEY=<strong-random-secret-key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
REDIS_HOST=<redis-host>
REDIS_PORT=6379
LOG_LEVEL=INFO
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Database Configuration

For production, use PostgreSQL or MySQL instead of SQLite:

**PostgreSQL (recommended):**
```python
# backend/config/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

Install PostgreSQL adapter:
```bash
pip install psycopg2-binary
```

### Static Files and Media

Configure static file serving for production:

```python
# backend/config/settings.py
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

Collect static files:
```bash
python manage.py collectstatic --noinput
```

### HTTPS and WSS

- Use a reverse proxy (nginx, Apache) with SSL certificates
- Configure WebSocket to use WSS (secure WebSocket)
- Update CORS settings to allow your production domain

### CORS Configuration

Update CORS settings for production:

```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
]
CORS_ALLOW_CREDENTIALS = True
```

### Redis Configuration

For production, use:
- Redis Cloud
- AWS ElastiCache
- Managed Redis service
- Or self-hosted Redis with proper security

### WebRTC TURN Server

For production video chat, set up TURN servers for users behind restrictive NATs:

```javascript
// frontend/src/services/webrtc.js
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ]
});
```

## Docker Setup (Optional)

### Backend Dockerfile Example

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
```

### Frontend Dockerfile Example

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
```

### Docker Compose Example

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: rooms
      POSTGRES_USER: roomsuser
      POSTGRES_PASSWORD: roomspassword
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - REDIS_HOST=redis
      - DB_HOST=db
    depends_on:
      - redis
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Troubleshooting

### Common Issues

#### Redis Connection Error

**Error**: `Error connecting to Redis: ...`

**Solution**:
1. Ensure Redis is running: `redis-cli ping`
2. Check Redis host and port in `.env`
3. Check firewall settings

#### Migration Errors

**Error**: `django.db.utils.OperationalError: ...`

**Solution**:
```bash
# Reset database (WARNING: Deletes all data)
rm db.sqlite3
python manage.py migrate
```

#### Port Already in Use

**Error**: `Address already in use`

**Solution**:
```bash
# Find process using the port
# Windows
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000

# Kill the process or use a different port
```

#### Module Not Found

**Error**: `ModuleNotFoundError: No module named '...'`

**Solution**:
```bash
# Ensure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt
```

#### Node Modules Issues

**Error**: Various npm/node errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### CORS Errors

**Error**: CORS policy blocking requests

**Solution**:
1. Check CORS settings in `backend/config/settings.py`
2. Ensure frontend URL is in `CORS_ALLOWED_ORIGINS`
3. In development, `CORS_ALLOW_ALL_ORIGINS = True` is set when `DEBUG=True`

#### WebSocket Connection Failed

**Error**: WebSocket connection errors

**Solution**:
1. Ensure Redis is running
2. Check authentication token is valid
3. Verify WebSocket URL format
4. Check CORS settings
5. In production, ensure WSS is used (not WS)

## Next Steps

After setup, you can:

1. Create test users and rooms
2. Test WebSocket connections
3. Test video chat functionality
4. Review API documentation in `docs/API.md`
5. Customize the application for your needs

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review error logs in `backend/logs/`
3. Check browser console for frontend errors
4. Open an issue on the GitHub repository

