import api from "./api";
import type { ApiResponse } from "../types/api";
import type { UserDto, CreateUserDto } from "../types/user";

export const getUsers = async () => {
  const response = await api.get<ApiResponse<UserDto[]>>("/User");
  return response.data;
};

export const createUser = async (userData: CreateUserDto) => {
  const response = await api.post<ApiResponse<UserDto>>("/User", userData);
  return response.data;
};