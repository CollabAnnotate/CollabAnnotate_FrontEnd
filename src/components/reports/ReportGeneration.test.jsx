import { render, screen, fireEvent, within } from '@testing-library/react';
import ReportGeneration from './ReportGeneration';
import { projectsAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  projectsAPI: {
    getProjects: vi.fn(),
    getProjectStats: vi.fn(),
  },
}));

const stats = {
  total_images: 2,
  annotations_by_label: [{ name: 'car', value: 2 }],
  validation_breakdown: [
    { name: 'Validées', value: 1 },
    { name: 'Rejetées', value: 1 },
    { name: 'En attente', value: 0 },
  ],
  quality: { acceptance_rate: 0.5, average_confidence: 0.8, completion_rate: null },
};

test('affiche les indicateurs du projet choisi sans planter', async () => {
  projectsAPI.getProjects.mockResolvedValue({ data: [{ id: 1, name: 'Voitures' }] });
  projectsAPI.getProjectStats.mockResolvedValue({ data: stats });

  render(<ReportGeneration />);

  // Ouvre la liste déroulante MUI et choisit le projet
  fireEvent.mouseDown(await screen.findByRole('combobox'));
  fireEvent.click(within(await screen.findByRole('listbox')).getByText('Voitures'));

  expect(await screen.findByText('Indicateurs de qualité')).toBeInTheDocument();
  expect(screen.getByText('50.0 %')).toBeInTheDocument();
  expect(screen.getByText('80.0 %')).toBeInTheDocument();
  expect(screen.getByText('N/A')).toBeInTheDocument();
  expect(projectsAPI.getProjectStats).toHaveBeenCalledWith(1);
});
