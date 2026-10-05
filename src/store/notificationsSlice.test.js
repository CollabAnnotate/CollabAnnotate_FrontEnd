import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer, {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectUnreadCount,
} from './notificationsSlice';
import { notificationsAPI } from '../services/api';

vi.mock('../services/api', () => ({
  notificationsAPI: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

const makeStore = () => configureStore({ reducer: { notifications: notificationsReducer } });

describe('notificationsSlice', () => {
  beforeEach(() => {
    notificationsAPI.getNotifications.mockResolvedValue({
      data: [
        { id: 1, title: 'Invitation à un projet', content: 'P', is_read: false },
        { id: 2, title: 'Nouvelle annotation', content: 'Q', is_read: true },
      ],
    });
    notificationsAPI.markAsRead.mockResolvedValue({});
    notificationsAPI.markAllAsRead.mockResolvedValue({});
  });

  test("charge les notifications depuis l'API et compte les non lues (is_read)", async () => {
    const store = makeStore();
    await store.dispatch(fetchNotifications());
    expect(store.getState().notifications.items).toHaveLength(2);
    expect(selectUnreadCount(store.getState())).toBe(1);
  });

  test('marquer comme lue met à jour le compteur et appelle le serveur', async () => {
    const store = makeStore();
    await store.dispatch(fetchNotifications());
    await store.dispatch(markNotificationRead(1));
    expect(notificationsAPI.markAsRead).toHaveBeenCalledWith(1);
    expect(selectUnreadCount(store.getState())).toBe(0);
  });

  test('tout marquer comme lu', async () => {
    const store = makeStore();
    await store.dispatch(fetchNotifications());
    await store.dispatch(markAllNotificationsRead());
    expect(selectUnreadCount(store.getState())).toBe(0);
  });
});
