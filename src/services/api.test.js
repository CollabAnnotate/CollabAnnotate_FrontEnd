import { AxiosError } from 'axios';
import api, { setAccessToken, getAccessToken, clearAccessToken } from './api';

// Construit une réponse axios ; les statuts >= 400 sont rejetés comme le ferait axios
const respond = (config, status, data = {}) => {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status >= 400) {
    return Promise.reject(
      new AxiosError(`HTTP ${status}`, 'ERR_BAD_REQUEST', config, null, response),
    );
  }
  return Promise.resolve(response);
};

// Faux backend Django. Le refresh token vit dans un cookie HttpOnly que le
// navigateur gère seul : on le simule ici par la variable `cookie`, avec
// rotation à chaque refresh (l'ancien est blacklisté).
const fakeBackend =
  (calls, { cookie = 'refresh-1' } = {}) =>
  (config) => {
    calls.push({ url: config.url, data: config.data, withCredentials: config.withCredentials });
    if (config.url === 'token/refresh/') {
      if (!cookie) {
        return respond(config, 401, { detail: 'Aucun refresh token' });
      }
      cookie = `${cookie}-next`;
      return respond(config, 200, { access: 'new-access' });
    }
    if (config.headers.Authorization === 'Bearer new-access') {
      return respond(config, 200, { ok: true });
    }
    return respond(config, 401);
  };

const urls = (calls) => calls.map((call) => call.url);

describe('intercepteur de refresh du token', () => {
  const originalAdapter = api.defaults.adapter;
  let calls;

  beforeEach(() => {
    calls = [];
    localStorage.clear();
    setAccessToken('expired-access');
    vi.stubGlobal('location', { href: '' });
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    clearAccessToken();
    vi.unstubAllGlobals();
  });

  test("envoie l'access token gardé en mémoire", async () => {
    let authorization;
    api.defaults.adapter = (config) => {
      authorization = config.headers.Authorization;
      return respond(config, 200);
    };
    setAccessToken('abc');

    await api.get('projects/');

    expect(authorization).toBe('Bearer abc');
  });

  test('rafraîchit via le cookie, garde le token en mémoire et rejoue la requête', async () => {
    api.defaults.adapter = fakeBackend(calls);

    const response = await api.get('projects/');

    expect(response.data).toEqual({ ok: true });
    expect(urls(calls)).toEqual(['projects/', 'token/refresh/', 'projects/']);
    // Le refresh n'envoie aucun token dans le corps : seul le cookie fait foi
    const refreshCall = calls.find((call) => call.url === 'token/refresh/');
    expect(refreshCall.data).toBeUndefined();
    expect(refreshCall.withCredentials).toBe(true);
    expect(getAccessToken()).toBe('new-access');
    // Rien n'est jamais écrit dans le localStorage
    expect(localStorage.length).toBe(0);
  });

  test('un seul refresh pour plusieurs requêtes en 401 simultanées', async () => {
    api.defaults.adapter = fakeBackend(calls);

    const responses = await Promise.all([
      api.get('projects/'),
      api.get('notifications/'),
      api.get('users/me/'),
    ]);

    expect(responses.every((r) => r.data.ok)).toBe(true);
    expect(urls(calls).filter((url) => url === 'token/refresh/')).toHaveLength(1);
  });

  test('refresh refusé : pas de boucle, token effacé et redirection vers /login', async () => {
    api.defaults.adapter = fakeBackend(calls, { cookie: null });

    await expect(api.get('projects/')).rejects.toThrow();

    expect(urls(calls)).toEqual(['projects/', 'token/refresh/']);
    expect(getAccessToken()).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  test('un 401 sur la connexion ne déclenche pas de refresh', async () => {
    api.defaults.adapter = fakeBackend(calls);

    await expect(api.post('token/', { username: 'x', password: 'y' })).rejects.toThrow();

    expect(urls(calls)).toEqual(['token/']);
  });
});
