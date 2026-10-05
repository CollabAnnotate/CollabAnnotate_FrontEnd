import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationsAPI } from '../services/api';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async () => {
  const response = await notificationsAPI.getNotifications();
  return response.data;
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id) => {
  await notificationsAPI.markAsRead(id);
  return id;
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await notificationsAPI.markAllAsRead();
});

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Mise à jour optimiste : l'interface réagit sans attendre le serveur
      .addCase(markNotificationRead.pending, (state, action) => {
        const notification = state.items.find((n) => n.id === action.meta.arg);
        if (notification) notification.is_read = true;
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.items.forEach((n) => {
          n.is_read = true;
        });
      });
  },
});

export const { clearNotifications } = notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) =>
  state.notifications.items.filter((n) => !n.is_read).length;

export default notificationsSlice.reducer;
