export type AuthPage = 'login' | 'signup' | 'password-reset';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type RegisteredUser = {
  userId: number;
  email: string;
  nickname: string;
};

export type ApiError = {
  code?: string;
  message?: string;
};
