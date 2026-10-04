import { configureStore } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import api, { getAccessToken, clearAccessToken } from '../services/api';
import authReducer, { restoreSession, loginUser, logoutUser } from './authSlice';

const respond = (config, status, data = {}) => {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status >= 400) {
    return Promise.reject(new AxiosError(`HTTP ${status}`, 'ERR_BAD_REQUEST', config, null, response));
  }
  return Promise.resolve(response);
};

const user = { id: 1, username: 'demo', role: 'admin' };
const makeStore = () => configureStore({ reducer: { auth: authReducer } });

describe('authSlice', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    localStorage.clear();
    clearAccessToken();
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  test('restoreSession : cookie valide, session restaurée et anciennes clés purgées', async () => {
    localStorage.setItem('token', 'vieux');
    localStorage.setItem('refresh_token', 'vieux');
    api.defaults.adapter = (config) => {
      if (config.url === 'token/refresh/') return respond(config, 200, { access: 'acc' });
      if (config.url === 'users/me/') return respond(config, 200, user);
      return respond(config, 404);
    };
    const store = makeStore();

    await store.dispatch(restoreSession());

    const { auth } = store.getState();
    expect(auth.initialized).toBe(true);
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.user).toEqual(user);
    expect(getAccessToken()).toBe('acc');
    expect(localStorage.length).toBe(0);
  });

  test("restoreSession : sans cookie, l'utilisateur n'est pas connecté", async () => {
    api.defaults.adapter = (config) => respond(config, 401);
    const store = makeStore();

    await store.dispatch(restoreSession());

    const { auth } = store.getState();
    expect(auth.initialized).toBe(true);
    expect(auth.isAuthenticated).toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  test('connexion puis déconnexion : token en mémoire seulement, révoqué côté serveur', async () => {
    const calls = [];
    api.defaults.adapter = (config) => {
      calls.push(config.url);
      if (config.url === 'token/') return respond(config, 200, { access: 'acc', user });
      if (config.url === 'token/logout/') return respond(config, 204);
      return respond(config, 404);
    };
    const store = makeStore();

    await store.dispatch(loginUser({ username: 'demo', password: 'x' }));
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(getAccessToken()).toBe('acc');
    expect(localStorage.length).toBe(0);

    await store.dispatch(logoutUser());
    expect(calls).toContain('token/logout/');
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(getAccessToken()).toBeNull();
  });
});
