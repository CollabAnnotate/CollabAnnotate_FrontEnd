// Ajoute les matchers DOM (toBeInTheDocument, toHaveTextContent…) à Vitest
import '@testing-library/jest-dom/vitest';
import { server } from './test/server';

// Toute requête non prévue par un test fait échouer ce test : pas d'appel réseau caché
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
