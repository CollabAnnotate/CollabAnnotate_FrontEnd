import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { AxiosError } from 'axios';
import store from './store/store';
import api from './services/api';
import App from './App';

test("affiche la page de connexion quand on n'est pas authentifié", async () => {
  // Pas de cookie de refresh : la restauration de session échoue
  api.defaults.adapter = (config) =>
    Promise.reject(new AxiosError('HTTP 401', 'ERR_BAD_REQUEST', config, null, {
      status: 401, data: {}, headers: {}, config,
    }));

  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  expect((await screen.findAllByText(/Nom d'utilisateur/i))[0]).toBeInTheDocument();
  expect(screen.getAllByText(/Mot de passe/i)[0]).toBeInTheDocument();
});
