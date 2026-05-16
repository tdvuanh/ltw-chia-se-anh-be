export interface JwtPayload {
  userId: bigint;
  email: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  data?: {
    token?: string;
    user?: {
      id: bigint;
      email: string;
      username: string;
      full_name: string | null;
    };
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}
