
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { obtenerProductosPublicos } from "../../api/catalogo";
import { crearPedidoManual } from "../../api/ecommerce";

import type { ProductoPublico } from "../../types/catalogo";
import type { CrearPedidoManual } from "../../types/ecommerce";

type ItemSeleccionado = {
  productId: number;
  quantity: number;
};

type DatosCliente = {
  firstName: string;
  lastName: string;
  phone: string;
  shippingAddress: string;
  district: string;
  city: string;
  reference: string;
};

const datosIniciales: DatosCliente = {
  firstName: "",
  lastName: "",
  phone: "",
  shippingAddress: "",
  district: "",
  city: "",
  reference: "",
};

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "USD",
});

function obtenerError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const mensaje = error.response?.data?.message;

    if (Array.isArray(mensaje)) return mensaje.join(", ");
    if (typeof mensaje === "string") return mensaje;
  }

  if (error instanceof Error) return error.message;

  return "No se pudo registrar el pedido.";
}

export function PedidoManualPage() {
  const [productos, setProductos] = useState<ProductoPublico[]>([]);
  const [items, setItems] = useState<ItemSeleccionado[]>([]);

  const [source, setSource] =
    useState<CrearPedidoManual["source"]>("MARKETPLACE");

  const [cliente, setCliente] = useState<DatosCliente>(datosIniciales);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [pagoConfirmado, setPagoConfirmado] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const bloqueo = useRef(false);

  const cargarProductos = useCallback(async () => {
    const lista = await obtenerProductosPublicos();
    setProductos(lista);
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        await cargarProductos();
      } catch (err) {
        if (activo) setError(obtenerError(err));
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [cargarProductos]);

  const agregarProducto = () => {
    setError("");

    const id = Number(productoId);
    const producto = productos.find((p) => p.id === id);

    if (!producto) {
      setError("Selecciona un producto.");
      return;
    }

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      setError("La cantidad debe ser un entero mayor que cero.");
      return;
    }

    const actual = items.find((item) => item.productId === id);
    const nuevaCantidad = (actual?.quantity ?? 0) + cantidad;

    if (nuevaCantidad > producto.availableStock) {
      setError(
        `Stock insuficiente para ${producto.name}. Disponibles: ${producto.availableStock}.`
      );
      return;
    }

    setItems((anteriores) => {
      if (actual) {
        return anteriores.map((item) =>
          item.productId === id
            ? { ...item, quantity: nuevaCantidad }
            : item
        );
      }

      return [...anteriores, { productId: id, quantity: cantidad }];
    });

    setProductoId("");
    setCantidad(1);
  };

  const quitarProducto = (id: number) => {
    setItems((anteriores) =>
      anteriores.filter((item) => item.productId !== id)
    );
  };

  const total = items.reduce((acumulado, item) => {
    const producto = productos.find((p) => p.id === item.productId);
    return acumulado + Number(producto?.salePrice ?? 0) * item.quantity;
  }, 0);

  const registrarPedido = async () => {
    if (bloqueo.current) return;

    setError("");
    setMensaje("");

    const campos = [
      cliente.firstName,
      cliente.lastName,
      cliente.phone,
      cliente.shippingAddress,
      cliente.district,
      cliente.city,
    ];

    if (campos.some((campo) => !campo.trim())) {
      setError("Completa todos los datos obligatorios del cliente.");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }

    if (!pagoConfirmado) {
      setError("Debes verificar el pago externo antes de registrar.");
      return;
    }

    bloqueo.current = true;
    setProcesando(true);

    try {
      // Revalidar stock justo antes de enviar.
      const listaActual = await obtenerProductosPublicos();
      setProductos(listaActual);

      for (const item of items) {
        const producto = listaActual.find(
          (p) => p.id === item.productId
        );

        if (!producto || item.quantity > producto.availableStock) {
          throw new Error(
            `Stock insuficiente o producto no disponible: ${
              producto?.name ?? `#${item.productId}`
            }.`
          );
        }
      }

      const pedido: CrearPedidoManual = {
        source,
        firstName: cliente.firstName.trim(),
        lastName: cliente.lastName.trim(),
        phone: cliente.phone.trim(),
        shippingAddress: cliente.shippingAddress.trim(),
        district: cliente.district.trim(),
        city: cliente.city.trim(),
        reference: cliente.reference.trim(),
        paymentConfirmed: true,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const creado = await crearPedidoManual(pedido);

      setMensaje(
        `Pedido #${creado.id} registrado correctamente como PAGADO.`
      );

      setCliente(datosIniciales);
      setItems([]);
      setPagoConfirmado(false);

      await cargarProductos();
    } catch (err) {
      setError(obtenerError(err));

      try {
        await cargarProductos();
      } catch {
        // Se conserva el mensaje original.
      }
    } finally {
      bloqueo.current = false;
      setProcesando(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">
              Registrar pedido manual
            </h1>
            <p className="mt-1 text-slate-500">
              Ventas externas con pago previamente verificado.
            </p>
          </div>

          <Link
            to="/staff/ordenes"
            className="rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-700"
          >
            Ver cola de órdenes
          </Link>
        </div>

        {error && (
          <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="rounded-lg bg-green-50 p-4 text-green-800">
            {mensaje}
          </div>
        )}

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Origen de la venta</h2>

          <select
            value={source}
            onChange={(e) =>
              setSource(e.target.value as CrearPedidoManual["source"])
            }
            className="mt-4 w-full rounded-lg border p-3"
          >
            <option value="MARKETPLACE">Marketplace</option>
            <option value="MANUAL">Redes sociales / venta manual</option>
          </select>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Datos del comprador</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(
              [
                ["firstName", "Nombres"],
                ["lastName", "Apellidos"],
                ["phone", "Teléfono"],
                ["shippingAddress", "Dirección"],
                ["district", "Distrito"],
                ["city", "Ciudad"],
                ["reference", "Referencia (opcional)"],
              ] as const
            ).map(([campo, etiqueta]) => (
              <label key={campo} className="block">
                <span className="mb-1 block text-sm font-medium">
                  {etiqueta}
                </span>

                <input
                  value={cliente[campo]}
                  onChange={(e) =>
                    setCliente((actual) => ({
                      ...actual,
                      [campo]: e.target.value,
                    }))
                  }
                  maxLength={
                    campo === "firstName" || campo === "lastName"
                      ? 70
                      : campo === "phone"
                        ? 20
                        : campo === "district" || campo === "city"
                          ? 100
                          : undefined
                  }
                  className="w-full rounded-lg border p-3"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Productos</h2>

          {cargando ? (
            <p className="mt-4">Cargando productos...</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_auto]">
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="rounded-lg border p-3"
              >
                <option value="">Seleccionar producto</option>

                {productos.map((producto) => (
                  <option
                    key={producto.id}
                    value={producto.id}
                    disabled={producto.availableStock <= 0}
                  >
                    {producto.name} —{" "}
                    {moneda.format(Number(producto.salePrice))} —{" "}
                    {producto.availableStock} disponibles
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                step={1}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="rounded-lg border p-3"
                aria-label="Cantidad"
              />

              <button
                onClick={agregarProducto}
                disabled={procesando}
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">
                Todavía no agregaste productos.
              </p>
            ) : (
              items.map((item) => {
                const producto = productos.find(
                  (p) => p.id === item.productId
                );

                return (
                  <div
                    key={item.productId}
                    className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {producto?.name ?? `Producto #${item.productId}`}
                      </p>

                      <p className="text-sm text-slate-500">
                        {item.quantity} ×{" "}
                        {moneda.format(Number(producto?.salePrice ?? 0))}
                      </p>
                    </div>

                    <button
                      onClick={() => quitarProducto(item.productId)}
                      disabled={procesando}
                      className="text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Quitar
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-5 flex justify-between border-t pt-4 text-xl font-bold">
            <span>Total de productos</span>
            <span>{moneda.format(total)}</span>
          </p>

          <p className="mt-2 text-xs text-slate-500">
            El importe definitivo se calcula en el servidor.
          </p>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={pagoConfirmado}
              onChange={(e) => setPagoConfirmado(e.target.checked)}
              disabled={procesando}
              className="mt-1 h-5 w-5"
            />

            <span>
              <strong>Confirmo que verifiqué el pago externo.</strong>
              <span className="mt-1 block text-sm text-slate-500">
                Esta operación registrará el pedido como pagado y
                descontará inventario. No realizará un cobro con MockPay.
              </span>
            </span>
          </label>

          <button
            onClick={() => void registrarPedido()}
            disabled={
              procesando ||
              cargando ||
              !pagoConfirmado ||
              items.length === 0
            }
            className="mt-5 w-full rounded-lg bg-green-700 p-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {procesando
              ? "Registrando..."
              : "Registrar venta externa pagada"}
          </button>
        </section>
      </div>
    </main>
  );
}
