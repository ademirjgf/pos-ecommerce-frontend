
import { api } from "./axios";

export interface SesionCaja {
  id: number;
  cashierId: number;
  status: "OPEN" | "CLOSED";
  openingAmount: string | number;
  expectedAmount?: string | number | null;
  countedAmount?: string | number | null;
  openedAt?: string;
  createdAt?: string;
  closedAt?: string | null;
}

export interface CierreCaja extends SesionCaja {
  status: "CLOSED";
  expectedAmount: string | number;
  countedAmount: string | number;
  totalCashSales: string;
  difference: string;
}

export async function obtenerCajaActual() {
  const { data } = await api.get<SesionCaja>(
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

export async function cerrarCaja(countedAmount: number) {
  const { data } = await api.post<CierreCaja>(
    "/cash-sessions/close",
    { countedAmount }
  );

  return data;
}
