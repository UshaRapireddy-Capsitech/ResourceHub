export type Role = "Admin" | "Staff" | "User";

export interface UserDto{
    id: string;
    userName: string;
    email: string;
    role: Role;
    createdAt: string;
}

export interface CreateUserDto{
    userName: string;
    email: string;
    role: Role;
}

export interface LoginDto{
    email: string;
    password: string;
}

export interface AuthResponse{
    token: string;
    user: UserDto;
}
