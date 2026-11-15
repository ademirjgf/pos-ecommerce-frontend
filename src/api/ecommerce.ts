
import { api } from "./axios";

import type {
  CarritoCliente,
  CrearDireccion,
  CrearPedidoManual,
  DireccionCliente,
  Pedido,
  RespuestaPago,
  ResultadoConciliacion,
} from "../types/ecommerce";

// CARRITO DEL CLIENTE

export async function obtenerCarrito() {
  const { data } = await api.get<CarritoCliente>("/carts");
  return data;
}

export async function agregarAlCarrito(
  productId: number,
  quantity: number = 1
) {
  const { data } = await api.post<CarritoCliente>(
    "/carts/items",
    {
      productId,
      quantity,
    }
  );

  return data;
}

export async function eliminarDelCarrito(
  productId: number
) {
  const { data } = await api.delete<CarritoCliente>(
    `/carts/items/${productId}`
  );

  return data;
}

// DIRECCIONES

export async function obtenerDirecciones() {
  const { data } = await api.get<DireccionCliente[]>(
    "/addresses"
  );

  return data;
}

export async function crearDireccion(
  direccion: CrearDireccion
) {
  const { data } = await api.post<DireccionCliente>(
    "/addresses",
    direccion
  );

  return data;
}

// PEDIDOS DEL CLIENTE

export async function confirmarPedido(
  addressId: number
) {
  const { data } = await api.post<Pedido>(
    "/orders/checkout",
    { addressId }
  );

  return data;
}

export async function obtenerMisPedidos() {
  const { data } = await api.get<Pedido[]>("/orders");
  return data;
}

// PAGOS MOCKPAY

export async function iniciarPago(orderId: number) {
  const { data } = await api.post<RespuestaPago>(
    `/payments/orders/${orderId}/checkout`
  );

  return data;
}

export async function conciliarPago(orderId: number) {
  const { data } = await api.post<ResultadoConciliacion>(
    `/payments/orders/${orderId}/reconcile`
  );

  return data;
}

// COLA LOGÍSTICA - ADMIN

export async function obtenerColaOrdenes() {
  const { data } = await api.get<Pedido[]>(
    "/admin/orders"
  );

  return data;
}

export async function marcarEnCamino(
  orderId: number
) {
  const { data } = await api.patch<Pedido>(
    `/admin/orders/${orderId}/in-transit`
  );

  return data;
}

export async function marcarEntregado(
  orderId: number
) {
  const { data } = await api.patch<Pedido>(
    `/admin/orders/${orderId}/delivered`
  );

  return data;
}

// PEDIDOS MANUALES - ADMIN

export async function crearPedidoManual(
  pedido: CrearPedidoManual
) {
  const { data } = await api.post<Pedido>(
    "/admin/orders/manual",
    pedido
  );

  return data;
}
