import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import notificationsReducer from './notificationsSlice';

// Fabrique de store : les tests créent un store neuf (éventuellement pré-rempli) à chaque rendu
export const makeStore = (preloadedState) =>
  configureStore({
    reducer: {
      auth: authReducer,
      notifications: notificationsReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore ces actions pour la vérification de sérialisation
          ignoredActions: ['auth/setCredentials', 'auth/logout'],
        },
      }),
  });

const store = makeStore();

export default store;
