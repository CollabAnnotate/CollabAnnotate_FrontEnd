import { AxiosError } from 'axios';
import api from './api';

// Construit une réponse axios ; les statuts >= 400 sont rejetés comme le ferait axios
const respond = (config, status, data = {}) => {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status >= 400) {
    return Promise.reject(new AxiosError(`HTTP ${status}`, 'ERR_BAD_REQUEST', config, null, response));
  }
  return Promise.resolve(response);
};

// Faux backend Django : rotation des refresh tokens + blacklist de l'ancien
const fakeBackend = (calls, { validRefresh = 'refresh-1' } = {}) => (config) => {
  calls.push(config.url);
  if (config.url === 'token/refresh/') {
    const { refresh } = JSON.parse(config.data);
    if (refresh !== validRefresh) {
      return respond(config, 401, { detail: 'Token is blacklisted' });
    }
    validRefresh = `${refresh}-next`;
    return respond(config, 200, { access: 'new-access', refresh: validRefresh });
  }
  if (config.headers.Authorization === 'Bearer new-access') {
    return respond(config, 200, { ok: true });
  }
  return respond(config, 401);
};

describe('intercepteur de refresh du token', () => {
  const originalAdapter = api.defaults.adapter;
  let calls;

  beforeEach(() => {
    calls = [];
    localStorage.clear();
    localStorage.setItem('token', 'expired-access');
    localStorage.setItem('refresh_token', 'refresh-1');
    vi.stubGlobal('location', { href: '' });
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  test('rafraîchit le token, enregistre le nouveau refresh token et rejoue la requête', async () => {
    api.defaults.adapter = fakeBackend(calls);

    const response = await api.get('projects/');

    expect(response.data).toEqual({ ok: true });
    expect(calls).toEqual(['projects/', 'token/refresh/', 'projects/']);
    expect(localStorage.getItem('token')).toBe('new-access');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-1-next');
  });

  test('un seul refresh pour plusieurs requêtes en 401 simultanées', async () => {
    api.defaults.adapter = fakeBackend(calls);

    const responses = await Promise.all([
      api.get('projects/'),
      api.get('notifications/'),
      api.get('users/me/'),
    ]);

    expect(responses.every((r) => r.data.ok)).toBe(true);
    expect(calls.filter((url) => url === 'token/refresh/')).toHaveLength(1);
  });

  test('refresh refusé : pas de boucle, session vidée et redirection vers /login', async () => {
    api.defaults.adapter = fakeBackend(calls, { validRefresh: 'autre-token' });

    await expect(api.get('projects/')).rejects.toThrow();

    expect(calls).toEqual(['projects/', 'token/refresh/']);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  test('un 401 sur la connexion ne déclenche pas de refresh', async () => {
    api.defaults.adapter = fakeBackend(calls);

    await expect(api.post('token/', { username: 'x', password: 'y' })).rejects.toThrow();

    expect(calls).toEqual(['token/']);
    expect(localStorage.getItem('refresh_token')).toBe('refresh-1');
  });
});
