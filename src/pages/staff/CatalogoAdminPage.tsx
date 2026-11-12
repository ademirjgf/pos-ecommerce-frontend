
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  crearCategoria,
  crearProducto,
  editarProducto,
  obtenerCategorias,
  obtenerInventario,
  reponerStock,
} from "../../api/catalogo";

import type {
  Categoria,
  ProductoInventario,
} from "../../types/catalogo";

const esquemaEdicion = z.object({
  categoryId: z.coerce.number<number>().int().min(1, "Selecciona una categoría"),
  sku: z.string().trim().min(1, "SKU obligatorio").max(50),
  name: z.string().trim().min(1, "Nombre obligatorio").max(150),
  description: z.string(),
  costPrice: z.coerce.number<number>().min(0),
  salePrice: z.coerce.number<number>().min(0),
});

const esquemaProducto = esquemaEdicion.extend({
  initialStock: z.coerce.number<number>().int().min(0),
});

const esquemaCategoria = z.object({
  name: z.string().trim().min(1, "Nombre obligatorio").max(100),
  description: z.string(),
});

type ProductoForm = z.infer<typeof esquemaProducto>;
type EdicionForm = z.infer<typeof esquemaEdicion>;
type CategoriaForm = z.infer<typeof esquemaCategoria>;

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function CatalogoAdminPage() {
  const [inventario, setInventario] = useState<ProductoInventario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtro, setFiltro] = useState("todas");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [productoEditando, setProductoEditando] =
    useState<ProductoInventario | null>(null);

  const productoForm = useForm<ProductoForm>({
    resolver: zodResolver(esquemaProducto),
    defaultValues: {
      categoryId: 0,
      sku: "",
      name: "",
      description: "",
      costPrice: 0,
      salePrice: 0,
      initialStock: 0,
    },
  });

  const categoriaForm = useForm<CategoriaForm>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const edicionForm = useForm<EdicionForm>({
    resolver: zodResolver(esquemaEdicion),
    defaultValues: {
      categoryId: 0,
      sku: "",
      name: "",
      description: "",
      costPrice: 0,
      salePrice: 0,
    },
  });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const [productos, listaCategorias] = await Promise.all([
        obtenerInventario(),
        obtenerCategorias(),
      ]);

      setInventario(productos);
      setCategorias(listaCategorias);
    } catch {
      setError("No se pudo cargar el inventario.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  async function guardarProducto(datos: ProductoForm) {
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await crearProducto(datos);
      productoForm.reset();
      await cargarDatos();
      setMensaje("Producto creado correctamente.");
    } catch {
      setError("No se pudo crear el producto. Verifica el SKU y los datos.");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCategoria(datos: CategoriaForm) {
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await crearCategoria(datos);
      categoriaForm.reset();
      await cargarDatos();
      setMensaje("Categoría creada correctamente.");
    } catch {
      setError("No se pudo crear la categoría.");
    } finally {
      setGuardando(false);
    }
  }

  async function agregarStock(productId: number) {
    const cantidad = Number(cantidades[productId]);

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100000) {
      setError("La cantidad debe ser un entero entre 1 y 100000.");
      return;
    }

    setProcesandoId(productId);
    setError("");
    setMensaje("");

    try {
      await reponerStock(productId, cantidad);
      setCantidades((prev) => ({ ...prev, [productId]: "" }));
      await cargarDatos();
      setMensaje("Stock actualizado correctamente.");
    } catch {
      setError("No se pudo actualizar el stock.");
    } finally {
      setProcesandoId(null);
    }
  }

  function comenzarEdicion(producto: ProductoInventario) {
    setProductoEditando(producto);
    setError("");
    setMensaje("");

    edicionForm.reset({
      categoryId: producto.categoryId,
      sku: producto.sku,
      name: producto.name,
      description: producto.description ?? "",
      costPrice: Number(producto.costPrice),
      salePrice: Number(producto.salePrice),
    });
  }

  function cancelarEdicion() {
    setProductoEditando(null);
    edicionForm.reset();
  }

  async function guardarEdicion(datos: EdicionForm) {
    if (!productoEditando) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await editarProducto(productoEditando.id, datos);
      cancelarEdicion();
      await cargarDatos();
      setMensaje("Producto actualizado correctamente.");
    } catch {
      setError("No se pudo editar el producto. Verifica los datos y el SKU.");
    } finally {
      setGuardando(false);
    }
  }

  const filtrados =
    filtro === "todas"
      ? inventario
      : inventario.filter((p) => p.categoryId === Number(filtro));

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Administración del catálogo
            </h1>
            <p className="text-slate-500">
              Productos, categorías e inventario interno
            </p>
          </div>

          <Link
            to="/staff"
            className="rounded-lg bg-slate-800 px-4 py-2 text-white"
          >
            Volver al panel
          </Link>
        </header>

        {error && (
          <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div role="status" className="rounded-lg bg-green-50 p-4 text-green-700">
            {mensaje}
          </div>
        )}

        {productoEditando && (
          <section className="rounded-xl border-2 border-blue-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">
                Editar: {productoEditando.name}
              </h2>
              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={guardando}
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>

            <form
              onSubmit={edicionForm.handleSubmit(guardarEdicion)}
              className="grid gap-4 md:grid-cols-2"
            >
              <label className="block">
                <span className="mb-1 block">Categoría</span>
                <select
                  {...edicionForm.register("categoryId")}
                  className="w-full rounded-lg border p-3"
                >
                  <option value="0">Seleccionar categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-red-600">
                  {edicionForm.formState.errors.categoryId?.message}
                </span>
              </label>

              {([
                ["sku", "SKU", "text"],
                ["name", "Nombre", "text"],
                ["description", "Descripción", "text"],
                ["costPrice", "Costo de adquisición", "number"],
                ["salePrice", "Precio de venta", "number"],
              ] as const).map(([campo, etiqueta, tipo]) => (
                <label key={campo} className="block">
                  <span className="mb-1 block">{etiqueta}</span>
                  <input
                    {...edicionForm.register(campo)}
                    type={tipo}
                    step={tipo === "number" ? "0.01" : undefined}
                    className="w-full rounded-lg border p-3"
                  />
                  <span className="text-sm text-red-600">
                    {edicionForm.formState.errors[campo]?.message}
                  </span>
                </label>
              ))}

              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50 md:col-span-2"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>

            <p className="mt-3 text-sm text-slate-500">
              Para modificar existencias utiliza la reposición de stock
              de la tabla inferior.
            </p>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={productoForm.handleSubmit(guardarProducto)}
            className="space-y-4 rounded-xl bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold">Nuevo producto</h2>

            <label className="block">
              <span className="mb-1 block">Categoría</span>
              <select
                {...productoForm.register("categoryId")}
                className="w-full rounded-lg border p-3"
              >
                <option value="0">Seleccionar categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="text-sm text-red-600">
                {productoForm.formState.errors.categoryId?.message}
              </span>
            </label>

            {([
              ["sku", "SKU", "text"],
              ["name", "Nombre", "text"],
              ["description", "Descripción", "text"],
              ["costPrice", "Costo de adquisición", "number"],
              ["salePrice", "Precio de venta", "number"],
              ["initialStock", "Stock inicial", "number"],
            ] as const).map(([campo, etiqueta, tipo]) => (
              <label key={campo} className="block">
                <span className="mb-1 block">{etiqueta}</span>
                <input
                  {...productoForm.register(campo)}
                  type={tipo}
                  step={
                    tipo === "number"
                      ? campo === "initialStock"
                        ? "1"
                        : "0.01"
                      : undefined
                  }
                  className="w-full rounded-lg border p-3"
                />
                <span className="text-sm text-red-600">
                  {productoForm.formState.errors[campo]?.message}
                </span>
              </label>
            ))}

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Crear producto"}
            </button>
          </form>

          <form
            onSubmit={categoriaForm.handleSubmit(guardarCategoria)}
            className="h-fit space-y-4 rounded-xl bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold">Nueva categoría</h2>

            <label className="block">
              <span className="mb-1 block">Nombre</span>
              <input
                {...categoriaForm.register("name")}
                className="w-full rounded-lg border p-3"
              />
              <span className="text-sm text-red-600">
                {categoriaForm.formState.errors.name?.message}
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block">Descripción</span>
              <textarea
                {...categoriaForm.register("description")}
                className="w-full rounded-lg border p-3"
              />
            </label>

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-lg bg-slate-800 p-3 font-semibold text-white disabled:opacity-50"
            >
              Crear categoría
            </button>
          </form>
        </div>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Inventario</h2>

            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="rounded-lg border p-2"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {cargando ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-12 animate-pulse rounded bg-slate-200"
                />
              ))}
            </div>
          ) : inventario.length === 0 ? (
            <p className="text-slate-500">Todavía no hay productos.</p>
          ) : filtrados.length === 0 ? (
            <p className="text-slate-500">
              No hay productos con este filtro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    {[
                      "Producto",
                      "SKU",
                      "Costo",
                      "Precio",
                      "Stock",
                      "Disponible",
                      "Reposición",
                      "Acciones",
                    ].map((titulo) => (
                      <th key={titulo} className="p-3">
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3">{p.sku}</td>
                      <td className="p-3">
                        {moneda.format(Number(p.costPrice))}
                      </td>
                      <td className="p-3">
                        {moneda.format(Number(p.salePrice))}
                      </td>
                      <td className="p-3">{p.stock}</td>
                      <td className="p-3">{p.availableStock}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100000"
                            step="1"
                            aria-label={`Cantidad a reponer para ${p.name}`}
                            value={cantidades[p.id] ?? ""}
                            onChange={(e) =>
                              setCantidades((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            className="w-20 rounded border p-2"
                          />

                          <button
                            type="button"
                            onClick={() => void agregarStock(p.id)}
                            disabled={procesandoId !== null}
                            className="rounded bg-green-700 px-3 py-2 text-white disabled:opacity-50"
                          >
                            {procesandoId === p.id ? "..." : "Agregar"}
                          </button>
                        </div>
                      </td>

                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => comenzarEdicion(p)}
                          disabled={guardando}
                          className="rounded bg-blue-700 px-3 py-2 text-white disabled:opacity-50"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
