
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useHistorialPOS } from "../../hooks/useHistorialPOS";

function fechaPeru() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
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

const formatoHora = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  hour: "2-digit",
  minute: "2-digit",
});

export function HistorialPosPage() {
  const [fecha, setFecha] = useState(fechaPeru);

  const { ventas, cargando, error } = useHistorialPOS(fecha);

  const totalDia = useMemo(
    () =>
      ventas.reduce(
        (total, venta) => total + Number(venta.total),
        0
      ),
    [ventas]
  );

  const filas = useMemo(
    () =>
      ventas.map((venta) => ({
        id: venta.id,
        hora: venta.paidAt
          ? formatoHora.format(new Date(venta.paidAt))
          : "-",
        productos: venta.items.map((item) => ({
          id: item.id,
          texto: `Producto #${item.productId} × ${item.quantity}`,
        })),
        metodo: nombreMetodo(venta.paymentMethod),
        total: dinero(venta.total),
      })),
    [ventas]
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
          onChange={(evento) => setFecha(evento.target.value)}
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

          {filas.length === 0 ? (
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
                  {filas.map((fila) => (
                    <tr
                      key={fila.id}
                      className="border-t align-top"
                    >
                      <td className="p-4 font-semibold">
                        #{fila.id}
                      </td>

                      <td className="p-4">
                        {fila.hora}
                      </td>

                      <td className="p-4">
                        {fila.productos.map((producto) => (
                          <p key={producto.id}>
                            {producto.texto}
                          </p>
                        ))}
                      </td>

                      <td className="p-4">
                        {fila.metodo}
                      </td>

                      <td className="p-4 font-bold">
                        {fila.total}
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
