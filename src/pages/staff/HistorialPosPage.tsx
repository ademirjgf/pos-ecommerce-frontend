
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { obtenerHistorialPOS } from "../../api/pos";
import type { VentaPOS } from "../../types/pos";

function fechaPeru() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dinero(valor: number | string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(valor));
}

function nombreMetodo(metodo: string | null) {
  switch (metodo) {
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta";
    case "TRANSFER_QR":
      return "Transferencia / QR";
    default:
      return "No especificado";
  }
}

export function HistorialPosPage() {
  const [fecha, setFecha] = useState(fechaPeru);
  const [ventas, setVentas] = useState<VentaPOS[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarHistorial() {
      setCargando(true);
      setError("");
      setVentas([]);

      try {
        const resultado = await obtenerHistorialPOS(fecha);

        if (activo) {
          setVentas(resultado);
        }
      } catch (err) {
        if (!activo) return;

        if (axios.isAxiosError(err)) {
          const mensaje = err.response?.data?.message;

          setError(
            typeof mensaje === "string"
              ? mensaje
              : "No se pudo consultar el historial."
          );
        } else {
          setError("No se pudo consultar el historial.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    if (fecha) {
      void cargarHistorial();
    }

    return () => {
      activo = false;
    };
  }, [fecha]);

  const totalDia = ventas.reduce(
    (total, venta) => total + Number(venta.total),
    0
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <Link
          to="/staff/pos"
          className="text-blue-600 hover:underline"
        >
          Volver al Punto de Venta
        </Link>

        <h1 className="text-3xl font-bold">
          Historial de ventas POS
        </h1>

        <p className="text-gray-500">
          Consulta tus ventas cobradas por fecha.
        </p>
      </header>

      <section className="rounded-xl border bg-white p-5">
        <label
          htmlFor="fecha-historial"
          className="mb-2 block font-semibold"
        >
          Seleccionar fecha
        </label>

        <input
          id="fecha-historial"
          type="date"
          value={fecha}
          onChange={(evento) =>
            setFecha(evento.target.value)
          }
          className="rounded-lg border p-3"
        />
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      {cargando ? (
        <p role="status">Consultando ventas...</p>
      ) : !error ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-gray-500">
                Ventas cobradas
              </p>
              <p className="text-3xl font-bold">
                {ventas.length}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5">
              <p className="text-gray-500">
                Total cobrado
              </p>
              <p className="text-3xl font-bold">
                {dinero(totalDia)}
              </p>
            </div>
          </section>

          {ventas.length === 0 ? (
            <p className="rounded-xl border bg-white p-6 text-gray-500">
              No hay ventas cobradas en esta fecha.
            </p>
          ) : (
            <section className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">Venta</th>
                    <th className="p-4">Hora</th>
                    <th className="p-4">Productos</th>
                    <th className="p-4">Pago</th>
                    <th className="p-4">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {ventas.map((venta) => (
                    <tr
                      key={venta.id}
                      className="border-t align-top"
                    >
                      <td className="p-4 font-semibold">
                        #{venta.id}
                      </td>

                      <td className="p-4">
                        {venta.paidAt
                          ? new Intl.DateTimeFormat(
                              "es-PE",
                              {
                                timeZone: "America/Lima",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            ).format(
                              new Date(venta.paidAt)
                            )
                          : "-"}
                      </td>

                      <td className="p-4">
                        {venta.items.map((item) => (
                          <p key={item.id}>
                            Producto #{item.productId}
                            {" × "}
                            {item.quantity}
                          </p>
                        ))}
                      </td>

                      <td className="p-4">
                        {nombreMetodo(venta.paymentMethod)}
                      </td>

                      <td className="p-4 font-bold">
                        {dinero(venta.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}
