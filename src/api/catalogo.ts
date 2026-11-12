
import { api } from "./axios";

import type {
  Categoria,
  ProductoPublico,
  ProductoInventario,
  CrearProductoDatos,
  CrearCategoriaDatos,
} from "../types/catalogo";

import type {
  EditarProductoDatos,
  CrearCajeroDatos,
  CajeroCreado,
} from "../types/catalogo";

export async function obtenerCategorias() {
  const { data } = await api.get<Categoria[]>("/categories");
  return data;
}

export async function obtenerProductosPublicos() {
  const { data } = await api.get<ProductoPublico[]>("/products");
  return data;
}

export async function obtenerInventario() {
  const { data } = await api.get<ProductoInventario[]>(
    "/inventory"
  );
  return data;
}

export async function crearProducto(datos: CrearProductoDatos) {
  const { data } = await api.post("/products", datos);
  return data;
}

export async function crearCategoria(datos: CrearCategoriaDatos) {
  const { data } = await api.post("/categories", datos);
  return data;
}

export async function reponerStock(
  productId: number,
  quantity: number
) {
  const { data } = await api.post(
    `/inventory/${productId}/restock`,
    { quantity }
  );

  return data;
}


export async function editarProducto(
  productId: number,
  datos: EditarProductoDatos
) {
  const { data } = await api.patch(
    `/products/${productId}`,
    datos
  );

  return data;
}

export async function crearCajero(
  datos: CrearCajeroDatos
): Promise<CajeroCreado> {
  const { data } = await api.post<CajeroCreado>(
    "/auth/staff",
    datos
  );

  return data;
}
