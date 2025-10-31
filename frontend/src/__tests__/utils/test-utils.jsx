import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContextProvider } from '../../context/AuthContext';

export function renderWithProviders(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        <AuthContextProvider>
          {children}
        </AuthContextProvider>
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: Wrapper });
}

