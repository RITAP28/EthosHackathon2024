import { createSlice } from '@reduxjs/toolkit';
import { UserReducerInitialState } from '../../types/reducer';

const initialState: UserReducerInitialState = {
  currentUser: null,
  error: null,
  loading: false,
  isAuthenticated: false,
  accessToken: null
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    RegistrationSuccess: (state, action) => {
      state.currentUser = action.payload.user;
      state.error = null;
      state.loading = false;
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken
    },
    RegistrationFailure: (state, action) => {
      state.currentUser = null;
      state.error = action.payload;
      state.loading = false;
      state.isAuthenticated = false;
      state.accessToken = null;
    },
    LoginSuccess: (state, action) => {
      state.currentUser = action.payload.user;
      state.error = null;
      state.loading = false;
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
    },
    LoginFailure: (state, action) => {
      state.currentUser = null;
      state.error = action.payload;
      state.loading = false;
      state.isAuthenticated = false;
      state.accessToken = null;
    },
    LogoutSuccess: (state) => {
      state.currentUser = null;
      state.error = null;
      state.loading = false;
      state.isAuthenticated = false;
      state.accessToken = null;
    },
    AccessTokenRefreshSuccess: (state, action) => {
      state.accessToken = action.payload.accessToken;
    },
    AccessTokenRefreshFailure: (state) => {
      state.accessToken = null;
      state.error = null;
    }
  },
});

export const {
  RegistrationSuccess,
  RegistrationFailure,
  LoginSuccess,
  LoginFailure,
  LogoutSuccess,
  AccessTokenRefreshSuccess,
  AccessTokenRefreshFailure
} = userSlice.actions;
export default userSlice.reducer;
