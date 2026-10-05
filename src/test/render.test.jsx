// Vérifie l'outillage de test : MSW répond aux appels axios et renderWithProviders fournit le contexte.
import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { server, apiUrl } from './server';
import { renderWithProviders } from './render';

test('MSW répond aux appels faits par services/api', async () => {
  server.use(http.get(apiUrl('projects/'), () => HttpResponse.json([{ id: 1, name: 'Voitures' }])));

  const response = await projectsAPI.getProjects();

  expect(response.data).toEqual([{ id: 1, name: 'Voitures' }]);
});

test('renderWithProviders fournit le store pré-rempli et la route', async () => {
  function Probe() {
    const username = useSelector((state) => state.auth.user?.username);
    const { pathname } = useLocation();
    return (
      <p>
        {username} sur {pathname}
      </p>
    );
  }

  renderWithProviders(<Probe />, {
    preloadedState: { auth: { user: { username: 'alice' }, initialized: true } },
    route: '/projects',
  });

  expect(screen.getByText('alice sur /projects')).toBeInTheDocument();
});
