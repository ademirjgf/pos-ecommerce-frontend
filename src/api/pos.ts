
import { api } from "./axios";
import type { VentaPOS } from "../types/pos";

export async function abrirVentaPOS() {
  const { data } = await api.post<VentaPOS>("/pos-sales");
  return data;
}

export async function agregarProductoVenta(
  saleId: number,
  productId: number,
  quantity: number
) {
  const { data } = await api.post(
    `/pos-sales/${saleId}/items`,
    { productId, quantity }
  );
  return data;
}

export async function consultarVentaPOS(saleId: number) {
  const { data } = await api.get<VentaPOS>(
    `/pos-sales/${saleId}`
  );
  return data;
}

export async function confirmarVentaPOS(
  saleId: number,
  paymentMethod: string
) {
  const { data } = await api.post<VentaPOS>(
    `/pos-sales/${saleId}/checkout`,
    { paymentMethod }
  );
  return data;
}

export async function cancelarVentaPOS(saleId: number) {
  const { data } = await api.post<VentaPOS>(
    `/pos-sales/${saleId}/cancel`
  );
  return data;
}

export async function obtenerVentasAbiertas() {
  const { data } = await api.get<VentaPOS[]>(
    "/pos-sales/open"
  );
  return data;
}

export async function obtenerHistorialPOS(fecha: string) {
  const { data } = await api.get<VentaPOS[]>(
    "/pos-sales/history",
    {
      params: { date: fecha },
    }
  );

  return data;
}