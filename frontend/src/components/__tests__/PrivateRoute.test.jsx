import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../PrivateRoute';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('PrivateRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockClear();
  });

  it('redirects to /login when unauthenticated', () => {
    mockUseAuth.mockReturnValue({
      access: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/test"
            element={
              <PrivateRoute>
                <div>Protected Content</div>
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/test');

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      access: 'token123',
      loading: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/test"
            element={
              <PrivateRoute>
                <div>Protected Content</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/test');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
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
            path="/test"
            element={
              <PrivateRoute>
                <div>Protected Content</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    window.history.pushState({}, '', '/test');
    expect(container.firstChild).toBeNull();
  });
});

