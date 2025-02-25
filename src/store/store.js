import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import notificationsReducer from './notificationsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore ces actions pour la vérification de sérialisation
        ignoredActions: ['auth/setCredentials', 'auth/logout'],
      },
    }),
});

export default store;