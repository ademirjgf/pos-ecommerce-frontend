
export type Rol = "ADMIN" | "CASHIER" | "CUSTOMER";

export interface Usuario {
  id: number;
  email: string;
  role: Rol;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
}
