import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );

  it('initializes with null values when no auth in localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.access).toBeNull();
    expect(result.current.refresh).toBeNull();
  });

  it('hydrates from localStorage on mount', async () => {
    const mockAuth = {
      user: { id: 1, email: 'test@example.com', name: 'Test User' },
      access: 'access-token',
      refresh: 'refresh-token',
    };
    localStorage.setItem('auth', JSON.stringify(mockAuth));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockAuth.user);
    expect(result.current.access).toBe(mockAuth.access);
    expect(result.current.refresh).toBe(mockAuth.refresh);
  });

  it('updates axios headers when access token changes', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test through login which internally calls saveAuth
    const mockTokens = { access: 'new-access-token', refresh: 'refresh-token' };
    const mockProfile = { id: 1, email: 'test@example.com', name: 'Test User' };
    api.post.mockResolvedValueOnce({ data: mockTokens });
    api.get.mockResolvedValueOnce({ data: mockProfile });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'pass123',
      });
    });

    expect(api.defaults.headers.common.Authorization).toBe('Bearer new-access-token');
  });

  it('removes axios headers when access token is cleared', async () => {
    const mockAuth = {
      user: { id: 1, email: 'test@example.com' },
      access: 'access-token',
      refresh: 'refresh-token',
    };
    localStorage.setItem('auth', JSON.stringify(mockAuth));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.logout();
    });

    expect(api.defaults.headers.common.Authorization).toBeUndefined();
  });

  it('register calls API and returns response', async () => {
    const mockResponse = { data: { id: 1, email: 'test@example.com' } };
    api.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let registerResult;
    await act(async () => {
      registerResult = await result.current.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        confirmPassword: 'pass123',
      });
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/register/', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'pass123',
      confirm_password: 'pass123',
    });
    expect(registerResult).toEqual(mockResponse.data);
  });

  it('login saves tokens and fetches user profile', async () => {
    const mockTokens = { access: 'access-token', refresh: 'refresh-token' };
    const mockProfile = { id: 1, email: 'test@example.com', name: 'Test User' };
    api.post.mockResolvedValueOnce({ data: mockTokens });
    api.get.mockResolvedValueOnce({ data: mockProfile });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login({
        email: 'test@example.com',
        password: 'pass123',
      });
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/login/', {
      email: 'test@example.com',
      password: 'pass123',
    });
    expect(api.get).toHaveBeenCalledWith('/api/auth/profile/');
    expect(result.current.user).toEqual(mockProfile);
    expect(result.current.access).toBe(mockTokens.access);
    expect(result.current.refresh).toBe(mockTokens.refresh);
    expect(loginResult).toEqual(mockProfile);
  });

  it('logout clears state and localStorage', async () => {
    const mockAuth = {
      user: { id: 1, email: 'test@example.com' },
      access: 'access-token',
      refresh: 'refresh-token',
    };
    localStorage.setItem('auth', JSON.stringify(mockAuth));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.access).toBeNull();
    expect(result.current.refresh).toBeNull();
    expect(localStorage.getItem('auth')).toBeNull();
  });
});

