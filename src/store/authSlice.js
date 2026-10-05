import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  authAPI,
  usersAPI,
  setAccessToken,
  clearAccessToken,
  refreshAccessToken,
  getApiErrorMessage,
} from '../services/api';

// Clés de l'ancien stockage des tokens dans le localStorage, à purger
const LEGACY_STORAGE_KEYS = ['token', 'refresh_token', 'user', 'role'];

// Thunk lancé au démarrage : l'access token vit en mémoire et disparaît au
// rechargement, on le récupère grâce au cookie HttpOnly du refresh token.
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    try {
      await refreshAccessToken();
      const { data: user } = await usersAPI.getCurrentUser();
      return { user, role: user.role || 'annotateur' };
    } catch {
      // Pas de cookie valide : l'utilisateur doit se connecter
      clearAccessToken();
      return rejectWithValue(null);
    }
  }
);

// Thunk pour la connexion
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, access } = response.data;

      // Access token en mémoire ; le refresh token est dans un cookie HttpOnly
      setAccessToken(access);

      return { user, role: user.role || 'annotateur' };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Erreur de connexion');
    }
  }
);

// Thunk pour la déconnexion : le serveur révoque le refresh token et vide le cookie
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authAPI.logout();
  } catch {
    // Même si l'appel échoue, on déconnecte localement
  } finally {
    clearAccessToken();
  }
});

// Thunk pour la mise à jour du profil
export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await usersAPI.updateProfile(userData);
      const updatedUser = response.data;

      return { user: updatedUser, role: updatedUser.role || 'annotateur' };
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Erreur lors de la mise à jour du profil'));
    }
  }
);

const initialState = {
  user: null,
  role: null,
  isAuthenticated: false,
  // false tant que restoreSession n'a pas déterminé si l'utilisateur est connecté
  initialized: false,
  status: 'idle',
  error: null
};

const resetSession = (state) => {
  state.user = null;
  state.role = null;
  state.isAuthenticated = false;
  state.status = 'idle';
  state.error = null;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Restauration de session
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        resetSession(state);
        state.initialized = true;
      })
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, resetSession)
      // Update user cases
      .addCase(updateUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.role;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
