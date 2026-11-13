
import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export function StaffPage() {
  const { usuario, cerrarSesion } = useAuthStore();
  const esAdmin = usuario?.role === "ADMIN";

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold">
              Panel operativo
            </h1>

            <p className="text-slate-500">
              {usuario?.email} —{" "}
              {esAdmin ? "Administrador" : "Cajero"}
            </p>
          </div>

          <button
            onClick={cerrarSesion}
            className="rounded-lg bg-red-600 px-4 py-2 text-white"
          >
            Cerrar sesión
          </button>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          {esAdmin && (
            <>

            <Link
              to="/staff/ordenes/manual"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-xl font-bold">
            Registrar pedido manual
              </h2>

               <p className="mt-2 text-slate-500">
            Registrar ventas pagadas por Marketplace o redes sociales.
              </p>
              </Link>
              <Link
                to="/staff/catalogo"
                className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-xl font-bold">
                  Administrar catálogo
                </h2>

                <p className="mt-2 text-slate-500">
                  Crear y editar productos, categorías e inventario.
                </p>
              </Link>

              <Link
                to="/staff/cajeros"
                className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-xl font-bold">
                  Administrar cajeros
                </h2>

                <p className="mt-2 text-slate-500">
                  Crear cuentas de acceso para personal de caja.
                </p>
              </Link>

              <Link
                to="/staff/ordenes"
                className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-xl font-bold">
                  Cola de órdenes
                </h2>

                <p className="mt-2 text-slate-500">
                  Consultar pedidos web y manuales, revisar
                  direcciones y gestionar entregas.
                </p>
              </Link>
            </>
          )}

          <Link
            to="/staff/pos"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-bold">
              Punto de venta
            </h2>

            <p className="mt-2 text-slate-500">
              Registrar ventas de mostrador y procesar pagos.
            </p>
          </Link>

          <Link
            to="/staff/pos/historial"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-bold">
              Historial POS
            </h2>

            <p className="mt-2 text-slate-500">
              Consultar las ventas realizadas por fecha.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
