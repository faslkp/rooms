import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { api as apiInstance } from '../api';

describe('API service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds Authorization header from localStorage', () => {
    const mockAuth = {
      access: 'test-access-token',
      refresh: 'test-refresh-token',
      user: { id: 1, email: 'test@example.com' },
    };
    localStorage.setItem('auth', JSON.stringify(mockAuth));

    // Mock axios request
    const requestConfig = {
      headers: {},
    };

    // Simulate interceptor
    api.interceptors.request.handlers[0].fulfilled(requestConfig);

    expect(requestConfig.headers.Authorization).toBe('Bearer test-access-token');
  });

  it('does not add Authorization header when no token in localStorage', () => {
    localStorage.clear();

    const requestConfig = {
      headers: {},
    };

    api.interceptors.request.handlers[0].fulfilled(requestConfig);

    expect(requestConfig.headers.Authorization).toBeUndefined();
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('auth', 'invalid-json');

    const requestConfig = {
      headers: {},
    };

    // Should not throw error
    expect(() => {
      api.interceptors.request.handlers[0].fulfilled(requestConfig);
    }).not.toThrow();
  });

  it('uses correct base URL', () => {
    expect(apiInstance.defaults.baseURL).toBeDefined();
  });
});

