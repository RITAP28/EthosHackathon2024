import { createSlice } from '@reduxjs/toolkit';
import { UserReducerInitialState } from '../../types/reducer';

const initialState: UserReducerInitialState = {
  currentUser: null,
  error: null,
  loading: false,
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    RegistrationSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.error = null;
      state.loading = false;
      state.isAuthenticated = true;
    },
    RegistrationFailure: (state, action) => {
      state.currentUser = null;
      state.error = action.payload;
      state.loading = false;
      state.isAuthenticated = false;
    },
    LoginSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.error = null;
      state.loading = false;
      state.isAuthenticated = true;
    },
    LoginFailure: (state, action) => {
      state.currentUser = null;
      state.error = action.payload;
      state.loading = false;
      state.isAuthenticated = false;
    },
    LogoutSuccess: (state) => {
      state.currentUser = null;
      state.error = null;
      state.loading = false;
      state.isAuthenticated = false;
    },
  },
});

export const {
  RegistrationSuccess,
  RegistrationFailure,
  LoginSuccess,
  LoginFailure,
  LogoutSuccess,
} = userSlice.actions;
export default userSlice.reducer;
