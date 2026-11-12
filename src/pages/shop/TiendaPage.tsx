
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import {
  obtenerCategorias,
  obtenerProductosPublicos,
} from "../../api/catalogo";

import type {
  Categoria,
  ProductoPublico,
} from "../../types/catalogo";

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function TiendaPage() {
  const { usuario, cerrarSesion } = useAuthStore();

  const [productos, setProductos] = useState<ProductoPublico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarCatalogo = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const [listaProductos, listaCategorias] = await Promise.all([
        obtenerProductosPublicos(),
        obtenerCategorias(),
      ]);

      setProductos(listaProductos);
      setCategorias(listaCategorias);
    } catch {
      setError("No se pudo cargar el catálogo.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  const filtrados = productos.filter((producto) => {
    const coincideCategoria =
      categoriaId === "todas" ||
      producto.category.id === Number(categoriaId);

    const coincideBusqueda = producto.name
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    return coincideCategoria && coincideBusqueda;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">
              POS & E-commerce
            </h1>
            <p className="text-slate-500">
              {usuario
                ? `Bienvenido, ${usuario.email}`
                : "Tu tienda en línea"}
            </p>
          </div>

          {usuario ? (
            <button
              onClick={cerrarSesion}
              className="rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              Cerrar sesión
            </button>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="text-blue-700">
                Ingresar
              </Link>
              <Link
                to="/registro"
                className="rounded-lg bg-blue-700 px-4 py-2 text-white"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Nuestros productos</h2>
          <p className="text-slate-500">
            Consulta nuestro catálogo actualizado.
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="rounded-lg border border-slate-300 bg-white p-3"
          />

          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white p-3"
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.name}
              </option>
            ))}
          </select>
        </div>

        {cargando ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-xl bg-red-50 p-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => void cargarCatalogo()}
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-white"
            >
              Reintentar
            </button>
          </div>
        ) : filtrados.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-slate-500">
            No hay productos disponibles con estos filtros.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {filtrados.length} producto(s) encontrado(s)
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((producto) => (
                <article
                  key={producto.id}
                  className="rounded-xl bg-white p-6 shadow-sm"
                >
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                    {producto.category.name}
                  </span>

                  <h3 className="mt-4 text-xl font-semibold">
                    {producto.name}
                  </h3>

                  <p className="mt-2 min-h-12 text-sm text-slate-500">
                    {producto.description || "Sin descripción"}
                  </p>

                  <p className="mt-4 text-2xl font-bold text-blue-800">
                    {moneda.format(Number(producto.salePrice))}
                  </p>

                  <p className="mt-2 text-sm text-green-700">
                    Disponibles: {producto.availableStock}
                  </p>

                  <button
                    disabled
                    title="El carrito estará disponible en la etapa del miércoles"
                    className="mt-5 w-full cursor-not-allowed rounded-lg bg-slate-300 p-3 font-semibold text-slate-600"
                  >
                    Comprar próximamente
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
