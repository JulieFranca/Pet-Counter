import { User, AuthState } from '@/types';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  rememberMe: false,
};

const SET_CREDENTIALS = 'auth/setCredentials';
const SET_REMEMBER_ME = 'auth/setRememberMe';
const LOGOUT = 'auth/logout';

export const setCredentials = (user: User, token: string) => ({
  type: SET_CREDENTIALS,
  payload: { user, token },
});

export const setRememberMe = (rememberMe: boolean) => ({
  type: SET_REMEMBER_ME,
  payload: rememberMe,
});

export const logout = () => ({
  type: LOGOUT,
});

const authReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_CREDENTIALS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      };
    case SET_REMEMBER_ME:
      return {
        ...state,
        rememberMe: action.payload,
      };
    case LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

export default authReducer; 