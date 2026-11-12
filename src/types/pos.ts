
export interface ItemCarritoPOS {
  productId: number;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

export interface ItemVentaPOS {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: string | number;
}

export interface VentaPOS {
  id: number;
  cashierId: number;
  cashSessionId: number;
  status: "OPEN" | "PAID" | "CANCELLED";
  total: string | number;
  paymentMethod: string | null;
  createdAt: string;
  paidAt: string | null;
  items: ItemVentaPOS[];
}
