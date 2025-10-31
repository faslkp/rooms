# Contributing Guide

Thank you for your interest in contributing to the Rooms application! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Report inappropriate behavior

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Python version, Node version)
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear title and description
   - Use case and motivation
   - Proposed solution
   - Potential impact

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write or update tests
5. Update documentation if needed
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Development Workflow

### 1. Set Up Development Environment

Follow the setup guide in `docs/SETUP.md`

### 2. Branch Naming

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

### 3. Code Style

#### Python (Backend)

- Follow PEP 8 style guide
- Use Black for formatting (recommended)
- Maximum line length: 88 characters
- Use type hints where appropriate

**Example:**
```python
from typing import Optional

def create_room(name: str, description: Optional[str] = None) -> Room:
    """Create a new room.
    
    Args:
        name: Room name
        description: Optional room description
        
    Returns:
        Created Room instance
    """
    return Room.objects.create(name=name, description=description)
```

#### JavaScript/React (Frontend)

- Use ESLint rules (already configured)
- Follow React best practices
- Use functional components with hooks
- Prefer named exports

**Example:**
```javascript
import { useState, useEffect } from 'react';

export function RoomList() {
  const [rooms, setRooms] = useState([]);
  
  useEffect(() => {
    // Fetch rooms
  }, []);
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### 4. Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(rooms): add room search functionality

fix(chat): resolve WebSocket reconnection issue

docs(api): update authentication documentation

refactor(users): simplify user authentication flow
```

### 5. Testing

#### Backend Tests

- Write tests for new features
- Maintain or improve test coverage
- Run tests before committing:

```bash
cd backend
python manage.py test
```

#### Frontend Tests

- Write tests for new components
- Run tests before committing:

```bash
cd frontend
npm test
```

### 6. Documentation

- Update README.md for user-facing changes
- Update API.md for API changes
- Add docstrings for new functions/classes
- Update inline comments if needed

## Project Structure

Understanding the project structure helps with contributions:

```
rooms/
├── backend/              # Django backend
│   ├── apps/
│   │   ├── common/       # Shared utilities
│   │   ├── users/        # User management
│   │   ├── rooms/        # Room management
│   │   └── chat/         # Chat and WebSocket
│   ├── config/           # Django settings
│   └── tests/            # Backend tests
│
└── frontend/             # React frontend
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── services/     # API services
    │   └── context/      # React context
    └── __tests__/        # Frontend tests
```

## Areas for Contribution

### High Priority

- [ ] Add pagination for rooms and messages lists
- [ ] Implement room search and filtering
- [ ] Add rate limiting for API endpoints
- [ ] Improve error handling and user feedback
- [ ] Add comprehensive test coverage
- [ ] Set up CI/CD pipeline

### Medium Priority

- [ ] Add message reactions/emojis
- [ ] Implement private rooms
- [ ] Add file/image sharing in chat
- [ ] Improve video chat quality and reliability
- [ ] Add user presence indicators (online/offline)
- [ ] Implement message read receipts

### Low Priority

- [ ] Add dark mode
- [ ] Implement room categories/tags
- [ ] Add user avatars/profile pictures
- [ ] Add message editing and deletion
- [ ] Implement notification system

## Review Process

1. Pull requests will be reviewed by maintainers
2. Address any requested changes
3. All tests must pass
4. Code must follow style guidelines
5. Documentation must be updated

## Questions?

- Open an issue for questions
- Check existing issues and discussions
- Review the documentation

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

Thank you for contributing! 🎉

