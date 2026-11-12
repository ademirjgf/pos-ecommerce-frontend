
import { api } from "./axios";

export interface SesionCaja {
  id: number;
  cashierId: number;
  status: "OPEN" | "CLOSED";
  openingAmount: string | number;
  openedAt?: string;
  createdAt?: string;
}

export async function obtenerCajaActual() {
  const { data } = await api.get<SesionCaja | null>(
    "/cash-sessions/current"
  );
  return data;
}

export async function abrirCaja(openingAmount: number) {
  const { data } = await api.post<SesionCaja>(
    "/cash-sessions/open",
    { openingAmount }
  );
  return data;
}
