
export interface Categoria {
  id: number;
  name: string;
  description: string | null;
}

export interface ProductoPublico {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  salePrice: string | number;
  category: {
    id: number;
    name: string;
  };
  availableStock: number;
}

export interface ProductoInventario {
  id: number;
  sku: string;
  name: string;
  active: boolean;
  costPrice: string | number;
  salePrice: string | number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  categoryId: number;
  description: string | null;
}

export interface CrearProductoDatos {
  categoryId: number;
  sku: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  initialStock: number;
}

export interface CrearCategoriaDatos {
  name: string;
  description?: string;
}

export interface EditarProductoDatos {
  categoryId: number;
  sku: string;
  name: string;
  description: string;
  costPrice: number;
  salePrice: number;
}

export interface CrearCajeroDatos {
  email: string;
  password: string;
}

export interface CajeroCreado {
  id: number;
  email: string;
  role: "CASHIER";
  active: boolean;
  createdAt: string;
}
