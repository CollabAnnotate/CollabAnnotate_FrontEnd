import { getApiErrorMessage } from './api';

const apiError = (data) => ({ response: { data } });

describe('getApiErrorMessage', () => {
  test.each([
    ['detail DRF', { detail: 'Non authentifié' }, 'Non authentifié'],
    ['clé error', { error: 'Statut invalide' }, 'Statut invalide'],
    [
      'liste',
      ['Vous ne pouvez pas supprimer votre propre compte.'],
      'Vous ne pouvez pas supprimer votre propre compte.',
    ],
    [
      'erreurs par champ',
      { password: ['Trop court.', 'Trop courant.'] },
      'password : Trop court. Trop courant.',
    ],
    [
      'non_field_errors',
      { non_field_errors: ['Identifiants invalides'] },
      'Identifiants invalides',
    ],
  ])('%s', (_, data, expected) => {
    expect(getApiErrorMessage(apiError(data))).toBe(expected);
  });

  test('message par défaut sans réponse (erreur réseau)', () => {
    expect(getApiErrorMessage(new Error('Network Error'), 'Serveur injoignable')).toBe(
      'Serveur injoignable',
    );
  });
});
