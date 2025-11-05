import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { AuthContextProvider, useAuth } from '../../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogout = vi.fn();
const mockAuthValue = {
  user: null,
  access: null,
  refresh: null,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: mockLogout,
};

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuthValue,
  };
});

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    mockLogout.mockClear();
  });

  it('renders login and register links when unauthenticated', () => {
    mockAuthValue.user = null;
    mockAuthValue.access = null;
    localStorage.removeItem('auth');

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('renders user email and logout button when authenticated', () => {
    mockAuthValue.user = { id: 1, email: 'test@example.com', name: 'Test User' };
    mockAuthValue.access = 'token123';
    localStorage.setItem('auth', JSON.stringify({
      user: mockAuthValue.user,
      access: mockAuthValue.access,
      refresh: 'refresh123',
    }));

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('calls logout and navigates to login on logout button click', async () => {
    const user = userEvent.setup();
    mockAuthValue.user = { id: 1, email: 'test@example.com', name: 'Test User' };
    mockAuthValue.access = 'token123';
    localStorage.setItem('auth', JSON.stringify({
      user: mockAuthValue.user,
      access: mockAuthValue.access,
      refresh: 'refresh123',
    }));

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});

