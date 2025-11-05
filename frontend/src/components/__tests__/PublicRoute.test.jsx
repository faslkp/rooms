import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicRoute from '../PublicRoute';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('PublicRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockClear();
  });

  it('redirects to /rooms when authenticated', () => {
    mockUseAuth.mockReturnValue({
      access: 'token123',
      loading: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div>Login Page</div>
              </PublicRoute>
            }
          />
          <Route path="/rooms" element={<div>Rooms Page</div>} />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/login');
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders children when unauthenticated', () => {
    mockUseAuth.mockReturnValue({
      access: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div>Login Page</div>
              </PublicRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/login');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('returns null during loading state', () => {
    mockUseAuth.mockReturnValue({
      access: null,
      loading: true,
    });

    const { container } = render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div>Login Page</div>
              </PublicRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/login');
    expect(container.firstChild).toBeNull();
  });
});

