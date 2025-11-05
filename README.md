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


