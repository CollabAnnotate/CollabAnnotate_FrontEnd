// Rend un composant avec tout ce dont il a besoin : store Redux neuf, thème MUI et routeur.
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { makeStore } from '../store/store';
import theme from '../theme';

export function renderWithProviders(
  ui,
  { preloadedState, route = '/', store = makeStore(preloadedState) } = {},
) {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
  return { store, user: userEvent.setup(), ...render(ui, { wrapper: Wrapper }) };
}
