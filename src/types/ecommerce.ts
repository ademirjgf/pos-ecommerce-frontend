
export interface ItemCarrito {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  availableStock: number;
  active: boolean;
}

export interface CarritoCliente {
  cartId: number | null;
  status: "ACTIVE";
  currency: string;
  items: ItemCarrito[];
  total: string;
}

export interface DireccionCliente {
  id: number;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  district: string;
  city: string;
  reference: string | null;
  isDefault: boolean;
}

export interface CrearDireccion {
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  district: string;
  city: string;
  reference?: string;
  isDefault?: boolean;
}

export type EstadoPedido =
  | "PENDING"
  | "PAID"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export interface ItemPedido {
  productId?: number;
  quantity: number;
  unitPrice: string | number;
  product?: {
    sku: string;
    name: string;
  };
}

export interface Pedido {
  id: number;
  source: string;
  status: EstadoPedido;
  total: string | number;
  currency: string;
  recipientName: string;
  recipientPhone?: string;
  shippingAddress: string;
  district: string;
  city: string;
  reference?: string | null;
  reservationStatus?: string;
  reservationExpiresAt?: string | null;
  createdAt: string;
  items: ItemPedido[];
}

export interface RespuestaPago {
  orderId: number;
  paymentId: number;
  checkoutUrl: string;
  status: string;
  reused?: boolean;
}

export interface ResultadoConciliacion {
  orderId: number;
  paymentId: number;
  status?: string;
  paymentStatus?: string;
  orderStatus?: EstadoPedido;
  message?: string;
  alreadyReconciled?: boolean;
}

export interface CrearPedidoManual {
  source: "MARKETPLACE" | "MANUAL";
  firstName: string;
  lastName: string;
  phone: string;
  shippingAddress: string;
  district: string;
  city: string;
  reference?: string;
  paymentConfirmed: true;
  items: {
    productId: number;
    quantity: number;
  }[];
}
