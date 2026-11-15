
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import {
  obtenerColaOrdenes,
  marcarEnCamino,
  marcarEntregado,
} from "../../api/ecommerce";

import type { Pedido, EstadoPedido } from "../../types/ecommerce";

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "USD",
});

const etiquetas: Record<EstadoPedido, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  IN_TRANSIT: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function mensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const mensaje = error.response?.data?.message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(", ");
    }

    if (typeof mensaje === "string") {
      return mensaje;
    }
  }

  return error instanceof Error
    ? error.message
    : "Ocurrió un error al procesar la solicitud.";
}

export function OrdenesAdminPage() {
  const [ordenes, setOrdenes] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState("TODOS");
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarOrdenes = useCallback(async () => {
    try {
      const datos = await obtenerColaOrdenes();
      setOrdenes(datos);
      setError("");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarOrdenes();

    const intervalo = window.setInterval(() => {
      void cargarOrdenes();
    }, 15000);

    const alVolver = () => {
      void cargarOrdenes();
    };

    window.addEventListener("focus", alVolver);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", alVolver);
    };
  }, [cargarOrdenes]);

  const cambiarEstado = async (
    pedido: Pedido,
    accion: "EN_CAMINO" | "ENTREGADO"
  ) => {
    if (procesandoId !== null) return;

    setProcesandoId(pedido.id);
    setError("");
    setMensaje("");

    try {
      if (accion === "EN_CAMINO") {
        await marcarEnCamino(pedido.id);
        setMensaje(`Pedido #${pedido.id} marcado en camino.`);
      } else {
        await marcarEntregado(pedido.id);
        setMensaje(`Pedido #${pedido.id} marcado como entregado.`);
      }

      await cargarOrdenes();
    } catch (err) {
      setError(mensajeError(err));
      await cargarOrdenes();
    } finally {
      setProcesandoId(null);
    }
  };

  const filtradas = ordenes.filter(
    (pedido) => filtro === "TODOS" || pedido.status === filtro
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">
              Cola de órdenes
            </h1>
            <p className="mt-1 text-slate-500">
              Pedidos web, Marketplace y ventas externas.
            </p>
          </div>

          <button
            onClick={() => void cargarOrdenes()}
            disabled={cargando || procesandoId !== null}
            className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            Actualizar órdenes
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 rounded-lg bg-green-50 p-4 text-green-800">
            {mensaje}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
          <label htmlFor="estado" className="font-medium">
            Filtrar por estado:
          </label>

          <select
            id="estado"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="rounded-lg border border-slate-300 p-2"
          >
            <option value="TODOS">Todos</option>
            {Object.entries(etiquetas).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>

          <span className="text-sm text-slate-500">
            {filtradas.length} pedido(s)
          </span>
        </div>

        {cargando ? (
          <p>Cargando órdenes...</p>
        ) : filtradas.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">
            No hay pedidos con este estado.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filtradas.map((pedido) => (
              <article
                key={pedido.id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      Pedido #{pedido.id}
                    </h2>

                    <p className="text-sm text-slate-500">
                      Origen: {pedido.source}
                    </p>

                    <p className="text-sm text-slate-500">
                      {new Date(pedido.createdAt).toLocaleString("es-PE")}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
                    {etiquetas[pedido.status] ?? pedido.status}
                  </span>
                </div>

                <div className="mt-5 border-t pt-4">
                  <h3 className="font-semibold">Productos</h3>

                  <ul className="mt-2 space-y-2">
                    {pedido.items.map((item, indice) => (
                      <li
                        key={`${pedido.id}-${indice}`}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span>
                          {item.product?.name ??
                            `Producto #${item.productId ?? indice + 1}`}
                          {" × "}
                          {item.quantity}
                        </span>

                        <span>
                          {moneda.format(
                            Number(item.unitPrice) * item.quantity
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 flex justify-between border-t pt-3 text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {moneda.format(Number(pedido.total))}
                    </span>
                  </p>
                </div>

                <div className="mt-5 border-t pt-4">
                  <h3 className="font-semibold">Datos de entrega</h3>

                  <p className="mt-2 text-sm">
                    <strong>Destinatario:</strong> {pedido.recipientName}
                  </p>

                  <p className="text-sm">
                    <strong>Teléfono:</strong>{" "}
                    {pedido.recipientPhone || "No registrado"}
                  </p>

                  <p className="text-sm">
                    <strong>Dirección:</strong> {pedido.shippingAddress}
                  </p>

                  <p className="text-sm">
                    <strong>Distrito:</strong> {pedido.district}
                  </p>

                  <p className="text-sm">
                    <strong>Ciudad:</strong> {pedido.city}
                  </p>

                  <p className="text-sm">
                    <strong>Referencia:</strong>{" "}
                    {pedido.reference || "Sin referencia"}
                  </p>
                </div>

                <div className="mt-5 border-t pt-4">
                  {pedido.status === "PAID" && (
                    <button
                      onClick={() =>
                        void cambiarEstado(pedido, "EN_CAMINO")
                      }
                      disabled={procesandoId !== null}
                      className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
                    >
                      {procesandoId === pedido.id
                        ? "Procesando..."
                        : "Marcar en camino"}
                    </button>
                  )}

                  {pedido.status === "IN_TRANSIT" && (
                    <button
                      onClick={() =>
                        void cambiarEstado(pedido, "ENTREGADO")
                      }
                      disabled={procesandoId !== null}
                      className="w-full rounded-lg bg-green-700 p-3 font-semibold text-white disabled:opacity-50"
                    >
                      {procesandoId === pedido.id
                        ? "Procesando..."
                        : "Marcar entregado"}
                    </button>
                  )}

                  {pedido.status === "PENDING" && (
                    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      Pendiente de pago. Todavía no puede enviarse.
                    </p>
                  )}

                  {pedido.status === "CANCELLED" && (
                    <p className="text-sm text-slate-500">
                      Pedido cancelado.
                    </p>
                  )}

                  {pedido.status === "DELIVERED" && (
                    <p className="text-sm font-medium text-green-700">
                      Entrega completada.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
