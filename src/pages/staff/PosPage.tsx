
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { obtenerProductosPublicos } from "../../api/catalogo";

import {
  abrirVentaPOS,
  agregarProductoVenta,
  confirmarVentaPOS,
  consultarVentaPOS,
  cancelarVentaPOS,
} from "../../api/pos";

import {
  abrirCaja,
  obtenerCajaActual,
  type SesionCaja,
} from "../../api/caja";

import { usePosStore } from "../../stores/posStore";

import type { ProductoPublico } from "../../types/catalogo";
import type { VentaPOS } from "../../types/pos";

type MetodoPago = "CASH" | "CARD" | "TRANSFER_QR";

const formatoDinero = (valor: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(valor);

function mensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const mensaje = error.response?.data?.message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(", ");
    }

    if (typeof mensaje === "string") {
      return mensaje;
    }

    if (!error.response) {
      return "No se pudo conectar con el servidor. Verifica tu conexión.";
    }
  }

  return "No se pudo completar la operación.";
}

export function PosPage() {
  const {
    items,
    agregarProducto,
    cambiarCantidad,
    eliminarProducto,
    limpiarCarrito,
  } = usePosStore();

  const [productos, setProductos] = useState<ProductoPublico[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [caja, setCaja] = useState<SesionCaja | null>(null);
  const [montoInicial, setMontoInicial] = useState("0");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("CASH");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [comprobante, setComprobante] = useState<VentaPOS | null>(null);

  const bloqueoCobro = useRef(false);

  const total = items.reduce(
    (suma, item) =>
      suma + item.unitPrice * item.quantity,
    0
  );

  const cargarDatos = useCallback(async () => {
    setCargando(true);

    try {
      const [listaProductos, cajaActual] = await Promise.all([
        obtenerProductosPublicos(),
        obtenerCajaActual(),
      ]);

      setProductos(listaProductos);
      setCaja(cajaActual);
      setError("");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const productosFiltrados = productos.filter((producto) =>
    `${producto.name} ${producto.sku}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  async function manejarAbrirCaja() {
    const monto = Number(montoInicial);

    if (!Number.isFinite(monto) || monto < 0) {
      setError("El monto inicial debe ser un número válido.");
      return;
    }

    setProcesando(true);
    setError("");

    try {
      const nuevaCaja = await abrirCaja(monto);

      setCaja(nuevaCaja);
      setExito("Caja abierta correctamente.");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  }

  function manejarAgregar(producto: ProductoPublico) {
    setError("");
    setExito("");
    setComprobante(null);

    const existente = items.find(
      (item) => item.productId === producto.id
    );

    if (
      existente &&
      existente.quantity >= producto.availableStock
    ) {
      setError(
        `Stock insuficiente para "${producto.name}". ` +
        `Disponibles: ${producto.availableStock}.`
      );
      return;
    }

    agregarProducto(producto);
  }

  async function manejarCobrar() {
    if (bloqueoCobro.current || procesando) {
      return;
    }

    if (!caja) {
      setError("Debes abrir una caja antes de vender.");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un producto al carrito.");
      return;
    }

    bloqueoCobro.current = true;
    setProcesando(true);
    setError("");
    setExito("");
    setComprobante(null);

    let ventaId: number | null = null;
    let pagoConfirmado = false;

    try {
      const venta = await abrirVentaPOS();
      ventaId = venta.id;

      for (const item of items) {
        try {
          await agregarProductoVenta(
            venta.id,
            item.productId,
            item.quantity
          );
        } catch (err) {
          const detalle = mensajeError(err);

          if (/stock/i.test(detalle)) {
            throw new Error(
              `Stock insuficiente para "${item.name}". ` +
              `Cantidad solicitada: ${item.quantity}. ` +
              "El servidor rechazó este producto."
            );
          }

          throw new Error(
            `No se pudo agregar "${item.name}": ${detalle}`
          );
        }
      }

      const resultado = await confirmarVentaPOS(
        venta.id,
        metodoPago
      );

      pagoConfirmado = true;

      const ventaCompleta = await consultarVentaPOS(
        resultado.id
      ).catch(() => resultado);

      setComprobante(ventaCompleta);
      limpiarCarrito();

      setExito(
        `Venta #${resultado.id} cobrada correctamente.`
      );

      try {
        const listaActualizada =
          await obtenerProductosPublicos();

        setProductos(listaActualizada);
      } catch {
        // El cobro ya fue exitoso.
      }
    } catch (err) {
      const detalle =
        err instanceof Error && !axios.isAxiosError(err)
          ? err.message
          : mensajeError(err);

      setError(detalle);

      if (ventaId !== null && !pagoConfirmado) {
        try {
          const ventaActual =
            await consultarVentaPOS(ventaId);

          if (ventaActual.status === "PAID") {
            setComprobante(ventaActual);
            limpiarCarrito();
            setError("");

            setExito(
              `Venta #${ventaId} confirmada correctamente.`
            );

            pagoConfirmado = true;
          } else if (ventaActual.status === "OPEN") {
            await cancelarVentaPOS(ventaId);
          }
        } catch {
          setError(
            `${detalle} No se pudo verificar o cancelar ` +
            `la venta #${ventaId}. Revisa su estado ` +
            "antes de intentar cobrar nuevamente."
          );
        }
      }
    } finally {
      bloqueoCobro.current = false;
      setProcesando(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Punto de Venta
          </h1>

          <p className="text-gray-500">
            Ventas de mostrador
          </p>
        </div>

        <Link
          to="/staff/pos/historial"
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Ver historial de ventas
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800"
        >
          {error}
        </div>
      )}

      {exito && (
        <div
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800"
        >
          {exito}
        </div>
      )}

      {!caja && !cargando && (
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">
            Abrir caja
          </h2>

          <label className="mb-2 block">
            Monto inicial (S/)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={montoInicial}
            onChange={(e) =>
              setMontoInicial(e.target.value)
            }
            className="mb-4 w-full rounded border p-3"
          />

          <button
            type="button"
            disabled={procesando}
            onClick={manejarAbrirCaja}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {procesando
              ? "Abriendo..."
              : "Abrir caja"}
          </button>
        </section>
      )}

      {caja && (
        <div className="rounded-lg bg-green-100 p-3 font-medium text-green-800">
          Caja abierta — Sesión #{caja.id}
        </div>
      )}

      {cargando ? (
        <p>Cargando productos y caja...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2">
            <input
              type="search"
              placeholder="Buscar producto por nombre o SKU..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              className="w-full rounded-lg border p-3"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {productosFiltrados.map((producto) => (
                <article
                  key={producto.id}
                  className="rounded-xl border bg-white p-4 shadow-sm"
                >
                  <h3 className="font-semibold">
                    {producto.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    SKU: {producto.sku}
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    {formatoDinero(
                      Number(producto.salePrice)
                    )}
                  </p>

                  <p className="my-2 text-sm">
                    Stock disponible:{" "}
                    {producto.availableStock}
                  </p>

                  <button
                    type="button"
                    disabled={
                      !caja ||
                      procesando ||
                      producto.availableStock <= 0
                    }
                    onClick={() =>
                      manejarAgregar(producto)
                    }
                    className="w-full rounded-lg bg-blue-600 p-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Agregar al carrito
                  </button>
                </article>
              ))}
            </div>
          </section>

          <aside className="h-fit space-y-4 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">
              Carrito de venta
            </h2>

            {items.length === 0 ? (
              <p className="text-gray-500">
                Todavía no hay productos.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="space-y-2 border-b pb-4"
                >
                  <p className="font-semibold">
                    {item.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {formatoDinero(item.unitPrice)}
                    {" "}por unidad
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      aria-label={`Cantidad de ${item.name}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      disabled={procesando}
                      onChange={(e) => {
                        const cantidad = Number(
                          e.target.value
                        );

                        if (
                          Number.isInteger(cantidad) &&
                          cantidad >= 1
                        ) {
                          cambiarCantidad(
                            item.productId,
                            cantidad
                          );
                        }
                      }}
                      className="w-20 rounded border p-2"
                    />

                    <button
                      type="button"
                      disabled={procesando}
                      onClick={() =>
                        eliminarProducto(item.productId)
                      }
                      className="text-sm text-red-600 disabled:opacity-40"
                    >
                      Eliminar
                    </button>
                  </div>

                  <p className="font-medium">
                    Subtotal:{" "}
                    {formatoDinero(
                      item.unitPrice * item.quantity
                    )}
                  </p>
                </div>
              ))
            )}

            <div className="border-t pt-4">
              <p className="text-2xl font-bold">
                Total: {formatoDinero(total)}
              </p>
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Método de pago
              </label>

              <select
                value={metodoPago}
                disabled={procesando}
                onChange={(e) =>
                  setMetodoPago(
                    e.target.value as MetodoPago
                  )
                }
                className="w-full rounded-lg border p-3"
              >
                <option value="CASH">
                  Efectivo
                </option>

                <option value="CARD">
                  Tarjeta
                </option>

                <option value="TRANSFER_QR">
                  Transferencia / QR
                </option>
              </select>
            </div>

            <button
              type="button"
              disabled={
                procesando ||
                !caja ||
                items.length === 0
              }
              onClick={manejarCobrar}
              className="w-full rounded-lg bg-green-600 p-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesando
                ? "Procesando venta..."
                : `Confirmar cobro — ${formatoDinero(total)}`}
            </button>
          </aside>
        </div>
      )}

      {comprobante && (
        <section className="rounded-xl border-2 border-green-500 bg-white p-6">
          <h2 className="mb-3 text-2xl font-bold text-green-700">
            Venta exitosa
          </h2>

          <p>
            Comprobante de venta #{comprobante.id}
          </p>

          <p>
            Estado: {comprobante.status}
          </p>

          <p>
            Método de pago:{" "}
            {comprobante.paymentMethod === "CASH"
              ? "Efectivo"
              : comprobante.paymentMethod === "CARD"
                ? "Tarjeta"
                : "Transferencia / QR"}
          </p>

          <div className="my-4 border-y py-3">
            {comprobante.items.map((item) => (
              <p key={item.id}>
                Producto #{item.productId}
                {" — "}
                {item.quantity}
                {" × "}
                {formatoDinero(
                  Number(item.unitPrice)
                )}
              </p>
            ))}
          </div>

          <p className="text-2xl font-bold">
            Total pagado:{" "}
            {formatoDinero(
              Number(comprobante.total)
            )}
          </p>

          <button
            type="button"
            onClick={() => {
              setComprobante(null);
              setExito("");
            }}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-white"
          >
            Nueva venta
          </button>
        </section>
      )}
    </main>
  );
}
