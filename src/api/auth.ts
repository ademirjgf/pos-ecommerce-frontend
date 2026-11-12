import { api } from "./axios";
import type { LoginResponse, Usuario } from "../types/auth";

export interface RegistroDatos {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(
    "/auth/login",
    { email, password }
  );

return data;
}

export async function registrarCliente(
  datos: RegistroDatos
): Promise<void> {
  await api.post("/auth/register", datos);
}

export async function obtenerPerfil(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/auth/me");
  return data;
}