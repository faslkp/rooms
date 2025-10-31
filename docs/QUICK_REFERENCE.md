# Quick Reference Guide

Quick reference for common commands, endpoints, and configurations.

## Common Commands

### Backend

```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Run with WebSocket support
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Run tests
python manage.py test

# Collect static files
python manage.py collectstatic --noinput
```

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### Redis

```bash
# Start Redis
redis-server              # macOS/Linux
brew services start redis # macOS (via Homebrew)
sudo systemctl start redis # Linux

# Check if Redis is running
redis-cli ping           # Should return: PONG

# Stop Redis
redis-cli shutdown       # macOS/Linux
brew services stop redis # macOS
sudo systemctl stop redis # Linux
```

## API Endpoints Quick Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register/` | Register new user | No |
| POST | `/auth/login/` | Login and get tokens | No |
| POST | `/auth/token/refresh/` | Refresh access token | No |
| GET | `/auth/profile/` | Get user profile | Yes |
| PATCH | `/auth/profile/` | Update profile | Yes |
| DELETE | `/auth/profile/` | Delete account | Yes |
| POST | `/auth/logout/` | Logout | Yes |

### Rooms

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/rooms/` | List all rooms | Yes |
| POST | `/api/rooms/` | Create room | Yes |
| GET | `/api/rooms/{id}/` | Get room details | Yes |
| PATCH | `/api/rooms/{id}/` | Update room | Yes |
| DELETE | `/api/rooms/{id}/` | Delete room | Yes |
| GET | `/api/rooms/{id}/messages/` | Get room messages | Yes |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/ws/chat/{room_id}/` | Connect to room WebSocket |

## Environment Variables

### Backend `.env`

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
LOG_LEVEL=DEBUG
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8000
```

## WebSocket Message Types

### Client → Server

```json
// Chat message
{"content": "Hello, world!"}

// WebRTC offer
{"type": "webrtc-offer", "offer": {...}}

// WebRTC answer
{"type": "webrtc-answer", "answer": {...}}

// ICE candidate
{"type": "webrtc-ice-candidate", "candidate": {...}}

// Hang up
{"type": "webrtc-hangup"}
```

### Server → Client

```json
// Chat message
{
  "id": 1,
  "user": {"id": 1, "email": "...", "name": "..."},
  "content": "Hello, world!",
  "created_at": "2024-01-01T00:00:00Z"
}

// WebRTC signal
{
  "type": "webrtc-offer",
  "sender_id": 1,
  "offer": {...}
}
```

## Common Issues & Solutions

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server  # or systemctl start redis
```

### Port Already in Use

```bash
# Find process using port 8000
# Windows
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000

# Kill process (replace PID with actual process ID)
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

### Module Not Found (Python)

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### WebSocket Connection Failed

1. Check Redis is running
2. Verify authentication token
3. Check CORS settings
4. Ensure WebSocket URL is correct

### CORS Errors

1. Check `CORS_ALLOWED_ORIGINS` in settings.py
2. In development, `CORS_ALLOW_ALL_ORIGINS = True` when `DEBUG=True`
3. Ensure frontend URL matches configured origins

## Database Commands

### Reset Database (WARNING: Deletes all data)

```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Create Database Backup

```bash
# SQLite
cp db.sqlite3 db.sqlite3.backup

# PostgreSQL
pg_dump -U username -d dbname > backup.sql
```

## Testing

### Backend Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.users
python manage.py test apps.rooms
python manage.py test apps.chat

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Project URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin |
| Redis | localhost:6379 |

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m "feat: add amazing feature"

# Push to remote
git push origin feature/amazing-feature

# Create Pull Request on GitHub
```

## Useful Django Commands

```bash
# Create new app
python manage.py startapp appname

# Create migration
python manage.py makemigrations

# Show SQL for migration
python manage.py sqlmigrate appname 0001

# Django shell
python manage.py shell

# Check project
python manage.py check
```

## Useful npm Commands

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Audit security
npm audit

# Fix vulnerabilities
npm audit fix
```

## Docker Quick Reference

```bash
# Build image
docker build -t rooms-backend ./backend
docker build -t rooms-frontend ./frontend

# Run container
docker run -p 8000:8000 rooms-backend
docker run -p 5173:5173 rooms-frontend

# Docker Compose
docker-compose up -d
docker-compose down
docker-compose logs -f
```

