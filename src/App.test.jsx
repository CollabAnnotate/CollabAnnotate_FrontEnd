import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from './store/store';
import App from './App';

test('affiche la page de connexion quand on n\'est pas authentifié', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  expect(screen.getAllByText(/Nom d'utilisateur/i)[0]).toBeInTheDocument();
  expect(screen.getAllByText(/Mot de passe/i)[0]).toBeInTheDocument();
});
