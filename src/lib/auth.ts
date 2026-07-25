import { api, setTokens, clearTokens } from './axios';
import type { ApiResponse, TokenResponse, LoginPayload } from '../types/api';

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  console.log('Login payload:', payload);
  const res = await api.post<ApiResponse<TokenResponse>>('/auth/login', payload);
  const tokens = res.data.data!;
  console.log('Received tokens:', res);
  await setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function logout() {
  await clearTokens();
}
