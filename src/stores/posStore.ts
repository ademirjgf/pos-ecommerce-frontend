
import { create } from "zustand";
import type { ItemCarritoPOS } from "../types/pos";
import type { ProductoPublico } from "../types/catalogo";

interface EstadoPOS {
  items: ItemCarritoPOS[];
  agregarProducto: (producto: ProductoPublico) => void;
  cambiarCantidad: (productId: number, cantidad: number) => void;
  eliminarProducto: (productId: number) => void;
  limpiarCarrito: () => void;
}

export const usePosStore = create<EstadoPOS>((set) => ({
  items: [],

  agregarProducto: (producto) =>
    set((estado) => {
      const existente = estado.items.find(
        (item) => item.productId === producto.id
      );

      if (existente) {
        return {
          items: estado.items.map((item) =>
            item.productId === producto.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        items: [
          ...estado.items,
          {
            productId: producto.id,
            sku: producto.sku,
            name: producto.name,
            unitPrice: Number(producto.salePrice),
            quantity: 1,
            availableStock: producto.availableStock,
          },
        ],
      };
    }),

  cambiarCantidad: (productId, cantidad) =>
    set((estado) => ({
      items: estado.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.trunc(cantidad)) }
          : item
      ),
    })),

  eliminarProducto: (productId) =>
    set((estado) => ({
      items: estado.items.filter(
        (item) => item.productId !== productId
      ),
    })),

  limpiarCarrito: () => set({ items: [] }),
}));
