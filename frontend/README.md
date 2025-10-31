# Rooms Frontend

React frontend for the Rooms real-time chat and video room application.

This is part of the Rooms application. For complete documentation, see the [main README](../README.md).

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Page components
│   ├── services/        # API and WebSocket services
│   ├── context/         # React context (auth)
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Static assets
├── package.json
└── vite.config.js      # Vite configuration
```

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Technologies

- **React 19**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Tailwind CSS**: Utility-first CSS framework
- **WebRTC**: Peer-to-peer video communication
- **Vitest**: Testing framework

## Documentation

- [Main README](../README.md) - Complete project documentation
- [API Documentation](../docs/API.md) - API reference
- [Setup Guide](../docs/SETUP.md) - Installation instructions
- [Architecture](../docs/ARCHITECTURE.md) - System architecture

## Development

The frontend communicates with the Django backend via:
- **REST API**: HTTP requests for CRUD operations
- **WebSocket**: Real-time messaging and WebRTC signaling

Make sure the backend is running before starting the frontend development server.
