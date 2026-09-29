import api from "./api";
import type { LoginDto, AuthResponse } from "../types/user";
import type { ApiResponse } from "../types/api";

export const loginUser = async (loginData: LoginDto) => {
  const response = await api.post<ApiResponse<AuthResponse>>("/Auth/login", loginData);
  return response.data;
};