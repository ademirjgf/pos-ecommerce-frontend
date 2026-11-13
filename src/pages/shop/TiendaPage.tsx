
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { useAuthStore } from "../../stores/authStore";
import {
  obtenerCategorias,
  obtenerProductosPublicos,
} from "../../api/catalogo";

import {
  obtenerCarrito,
  agregarAlCarrito,
  eliminarDelCarrito,
  obtenerDirecciones,
  crearDireccion,
  confirmarPedido,
  iniciarPago,
  obtenerMisPedidos,
  conciliarPago,
} from "../../api/ecommerce";

import type {
  Categoria,
  ProductoPublico,
} from "../../types/catalogo";

import type {
  CarritoCliente,
  DireccionCliente,
  CrearDireccion,
  Pedido,
} from "../../types/ecommerce";

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "USD",
});

const direccionInicial: CrearDireccion = {
  recipientName: "",
  recipientPhone: "",
  addressLine: "",
  district: "",
  city: "",
  reference: "",
  isDefault: true,
};

function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error && !axios.isAxiosError(error)) {
  return error.message;
}
  if (axios.isAxiosError(error)) {
    const mensaje = error.response?.data?.message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(", ");
    }

    if (typeof mensaje === "string") {
      return mensaje;
    }
  }

  return "Ocurrió un error. Inténtalo nuevamente.";
}

export function TiendaPage() {
  const { usuario, token, cerrarSesion } = useAuthStore();

  const esCliente = usuario?.role === "CUSTOMER";

  const [productos, setProductos] = useState<ProductoPublico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [categoriaId, setCategoriaId] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const [carrito, setCarrito] = useState<CarritoCliente | null>(null);
  const [direcciones, setDirecciones] = useState<DireccionCliente[]>([]);
  const [direccionId, setDireccionId] = useState("");

  const [mostrarDireccion, setMostrarDireccion] = useState(false);
  const [nuevaDireccion, setNuevaDireccion] =
    useState<CrearDireccion>(direccionInicial);

  const [pedidoCreado, setPedidoCreado] = useState<Pedido | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const bloqueoOperacion = useRef(false);

  const cargarCatalogo = useCallback(async () => {
    const [listaProductos, listaCategorias] = await Promise.all([
      obtenerProductosPublicos(),
      obtenerCategorias(),
    ]);

    setProductos(listaProductos);
    setCategorias(listaCategorias);
  }, []);

  const actualizarStock = useCallback(async () => {
    const lista = await obtenerProductosPublicos();
    setProductos(lista);
  }, []);

  const cargarDatosCliente = useCallback(async () => {
    const [carritoActual, direccionesActuales, pedidosActuales] =
      await Promise.all([
        obtenerCarrito(),
        obtenerDirecciones(),
        obtenerMisPedidos(),
      ]);

    setCarrito(carritoActual);
    setDirecciones(direccionesActuales);
    setPedidos(pedidosActuales);

    setDireccionId((anterior) => {
      if (direccionesActuales.some(
        (direccion) => String(direccion.id) === anterior
      )) {
        return anterior;
      }

      const predeterminada = direccionesActuales.find(
        (direccion) => direccion.isDefault
      );

      return String(
        predeterminada?.id ?? direccionesActuales[0]?.id ?? ""
      );
    });
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError("");

      try {
        await cargarCatalogo();

        if (esCliente && token) {
          await cargarDatosCliente();
        }

        if (!activo) return;
      } catch (err) {
        if (activo) {
          setError(obtenerMensajeError(err));
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [cargarCatalogo, cargarDatosCliente, esCliente, token]);

  // Revalidación al regresar a la pestaña y cada 15 segundos.
  useEffect(() => {
    let actualizando = false;

    async function revalidar() {
      if (document.visibilityState !== "visible" || actualizando) {
        return;
      }

      actualizando = true;

      try {
        await actualizarStock();

        if (esCliente && token) {
          const carritoActual = await obtenerCarrito();
          setCarrito(carritoActual);
        }
      } catch {
        // No sustituimos los mensajes de una operación en curso.
      } finally {
        actualizando = false;
      }
    }

    function alVolver() {
      void revalidar();
    }

    window.addEventListener("focus", alVolver);
    document.addEventListener("visibilitychange", alVolver);

    const intervalo = window.setInterval(() => {
      void revalidar();
    }, 15000);

    return () => {
      window.removeEventListener("focus", alVolver);
      document.removeEventListener("visibilitychange", alVolver);
      window.clearInterval(intervalo);
    };
  }, [actualizarStock, esCliente, token]);

  const ejecutarOperacion = async (
    operacion: () => Promise<void>
  ) => {
    if (bloqueoOperacion.current) return;

    bloqueoOperacion.current = true;
    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      await operacion();
    } catch (err) {
      setError(obtenerMensajeError(err));

      // Incluso si hubo conflicto de stock, volvemos
      // a consultar la información real del servidor.
      try {
        await actualizarStock();

        if (esCliente) {
          setCarrito(await obtenerCarrito());
        }
      } catch {
        // Conservamos el error original.
      }
    } finally {
      bloqueoOperacion.current = false;
      setProcesando(false);
    }
  };

  const agregarProducto = (producto: ProductoPublico) => {
    if (!esCliente) {
      setError("Inicia sesión como cliente para comprar.");
      return;
    }

    void ejecutarOperacion(async () => {
      const actualizado = await agregarAlCarrito(producto.id, 1);
      setCarrito(actualizado);
      await actualizarStock();
      setMensaje(`${producto.name} agregado al carrito.`);
    });
  };

  const quitarProducto = (productId: number) => {
    void ejecutarOperacion(async () => {
      const actualizado = await eliminarDelCarrito(productId);
      setCarrito(actualizado);
      await actualizarStock();
      setMensaje("Producto eliminado del carrito.");
    });
  };

  const guardarDireccion = () => {
    void ejecutarOperacion(async () => {
      const camposObligatorios = [
        nuevaDireccion.recipientName,
        nuevaDireccion.recipientPhone,
        nuevaDireccion.addressLine,
        nuevaDireccion.district,
        nuevaDireccion.city,
      ];

      if (camposObligatorios.some((campo) => !campo.trim())) {
        throw new Error("Completa los datos obligatorios de entrega.");
      }

      const creada = await crearDireccion(nuevaDireccion);

      const actualizadas = await obtenerDirecciones();
      setDirecciones(actualizadas);
      setDireccionId(String(creada.id));
      setMostrarDireccion(false);
      setNuevaDireccion(direccionInicial);
      setMensaje("Dirección registrada correctamente.");
    });
  };

  const realizarPedido = () => {
    void ejecutarOperacion(async () => {
      if (!carrito?.items.length) {
        throw new Error("El carrito está vacío.");
      }

      if (!direccionId) {
        throw new Error("Selecciona una dirección de entrega.");
      }

      // Revalidamos stock antes del checkout.
      const carritoActual = await obtenerCarrito();
      setCarrito(carritoActual);

      const sinDisponibilidad = carritoActual.items.find(
        (item) => !item.active || item.quantity > item.availableStock
      );

      if (sinDisponibilidad) {
        throw new Error(
          `Stock insuficiente para ${sinDisponibilidad.name}.`
        );
      }

      const pedido = await confirmarPedido(Number(direccionId));

      setPedidoCreado(pedido);

      // La reserva afecta inmediatamente el stock disponible.
      await Promise.all([
        actualizarStock(),
        cargarDatosCliente(),
      ]);

      setMensaje(
        `Pedido #${pedido.id} creado. Pendiente de pago.`
      );
    });
  };

  const pagarPedido = (orderId: number) => {
    void ejecutarOperacion(async () => {
      const pago = await iniciarPago(orderId);

      if (!pago.checkoutUrl) {
        throw new Error("MockPay no devolvió un enlace de pago.");
      }

      // La URL la proporciona el backend, no la construimos.
      window.location.assign(pago.checkoutUrl);
    });
  };

  const verificarPago = (orderId: number) => {
    void ejecutarOperacion(async () => {
      const resultado = await conciliarPago(orderId);

      await Promise.all([
        actualizarStock(),
        cargarDatosCliente(),
      ]);

      const estado =
        resultado.orderStatus ??
        resultado.paymentStatus ??
        resultado.status;

      if (estado === "PAID" || estado === "SUCCEEDED") {
        setMensaje(`Pago del pedido #${orderId} confirmado.`);
        setPedidoCreado(null);
      } else if (
        estado === "CANCELLED" ||
        estado === "FAILED"
      ) {
        setMensaje(
          `El pago del pedido #${orderId} no se completó.`
        );
      } else {
        setMensaje(
          resultado.message ??
          "El pago todavía está pendiente."
        );
      }
    });
  };

  const filtrados = productos.filter((producto) => {
    const coincideCategoria =
      categoriaId === "todas" ||
      producto.category.id === Number(categoriaId);

    const coincideBusqueda = producto.name
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    return coincideCategoria && coincideBusqueda;
  });

  const pedidoPendiente =
    pedidoCreado?.status === "PENDING"
      ? pedidoCreado
      : pedidos.find((pedido) => pedido.status === "PENDING");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 p-6">
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

      <div className="mx-auto max-w-7xl p-6">
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            {mensaje}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                Nuestros productos
              </h2>
              <p className="text-slate-500">
                Catálogo y stock disponible actualizados.
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
              <p>Cargando productos...</p>
            ) : filtrados.length === 0 ? (
              <p className="rounded-xl bg-white p-8 text-center text-slate-500">
                No hay productos disponibles con estos filtros.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

                    <p
                      className={`mt-2 text-sm ${
                        producto.availableStock > 0
                          ? "text-green-700"
                          : "font-semibold text-red-700"
                      }`}
                    >
                      {producto.availableStock > 0
                        ? `Disponibles: ${producto.availableStock}`
                        : "Agotado"}
                    </p>

                    <button
                      onClick={() => agregarProducto(producto)}
                      disabled={
                        procesando ||
                        producto.availableStock <= 0 ||
                        !esCliente
                      }
                      className="mt-5 w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                    >
                      {producto.availableStock <= 0
                        ? "Sin stock"
                        : !esCliente
                          ? "Inicia sesión para comprar"
                          : "Agregar al carrito"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">
                Mi carrito
              </h2>

              {!esCliente ? (
                <p className="mt-3 text-sm text-slate-500">
                  <Link
                    to="/login"
                    className="font-semibold text-blue-700"
                  >
                    Inicia sesión
                  </Link>{" "}
                  como cliente para comprar.
                </p>
              ) : (
                <>
                  {carrito?.items.length ? (
                    <div className="mt-4 space-y-4">
                      {carrito.items.map((item) => (
                        <div
                          key={item.productId}
                          className="border-b pb-4"
                        >
                          <p className="font-semibold">
                            {item.name}
                          </p>

                          <p className="text-sm text-slate-500">
                            Cantidad: {item.quantity}
                          </p>

                          <p className="text-sm text-slate-500">
                            Stock disponible: {item.availableStock}
                          </p>

                          <p className="font-medium">
                            {moneda.format(Number(item.subtotal))}
                          </p>

                          {(
                            !item.active ||
                            item.quantity > item.availableStock
                          ) && (
                            <p className="text-sm text-red-700">
                              Este producto necesita ajustar
                              su disponibilidad.
                            </p>
                          )}

                          <button
                            onClick={() => quitarProducto(item.productId)}
                            disabled={procesando}
                            className="mt-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      Tu carrito está vacío.
                    </p>
                  )}

                  <div className="mt-4 border-t pt-4">
                    <p className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>
                        {moneda.format(Number(carrito?.total ?? 0))}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </section>

            {esCliente && (
              <section className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">
                  Dirección de entrega
                </h2>

                {direcciones.length > 0 && (
                  <select
                    value={direccionId}
                    onChange={(e) => setDireccionId(e.target.value)}
                    className="mt-4 w-full rounded-lg border p-3"
                  >
                    {direcciones.map((direccion) => (
                      <option
                        key={direccion.id}
                        value={direccion.id}
                      >
                        {direccion.addressLine} - {direccion.district}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => setMostrarDireccion((actual) => !actual)}
                  className="mt-4 text-sm font-semibold text-blue-700"
                >
                  {mostrarDireccion
                    ? "Cerrar formulario"
                    : "+ Agregar dirección"}
                </button>

                {mostrarDireccion && (
                  <div className="mt-4 space-y-3">
                    {(
                      [
                        ["recipientName", "Nombre del destinatario"],
                        ["recipientPhone", "Teléfono"],
                        ["addressLine", "Dirección"],
                        ["district", "Distrito"],
                        ["city", "Ciudad"],
                        ["reference", "Referencia (opcional)"],
                      ] as const
                    ).map(([campo, etiqueta]) => (
                      <input
                        key={campo}
                        value={nuevaDireccion[campo] ?? ""}
                        onChange={(e) =>
                          setNuevaDireccion((actual) => ({
                            ...actual,
                            [campo]: e.target.value,
                          }))
                        }
                        placeholder={etiqueta}
                        className="w-full rounded-lg border p-3"
                      />
                    ))}

                    <button
                      onClick={guardarDireccion}
                      disabled={procesando}
                      className="w-full rounded-lg bg-slate-800 p-3 font-semibold text-white disabled:opacity-50"
                    >
                      Guardar dirección
                    </button>
                  </div>
                )}

                <button
                  onClick={realizarPedido}
                  disabled={
                    procesando ||
                    !carrito?.items.length ||
                    !direccionId
                    || !!pedidoPendiente
                  }
                  className="mt-5 w-full rounded-lg bg-green-700 p-3 font-semibold text-white disabled:bg-slate-300"
                >
                  {procesando
                    ? "Procesando..."
                    : "Confirmar pedido"}
                </button>

                <p className="mt-3 text-xs text-slate-500">
                  El pedido se reserva y queda pendiente
                  hasta que se confirme el pago.
                </p>
              </section>
            )}

            {esCliente && pedidoPendiente && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-lg font-bold">
                  Pedido #{pedidoPendiente.id}
                </h2>

                <p className="mt-2 text-sm">
                  Estado: pendiente de pago
                </p>

                <p className="mt-1 font-semibold">
                  {moneda.format(Number(pedidoPendiente.total))}
                </p>

                <button
                  onClick={() => pagarPedido(pedidoPendiente.id)}
                  disabled={procesando}
                  className="mt-4 w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
                >
                  Ir a pagar con MockPay
                </button>

                <button
                  onClick={() => verificarPago(pedidoPendiente.id)}
                  disabled={procesando}
                  className="mt-3 w-full rounded-lg border border-blue-700 p-3 font-semibold text-blue-700 disabled:opacity-50"
                >
                  Verificar estado del pago
                </button>
              </section>
            )}

            {esCliente && pedidos.length > 0 && (
              <section className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">
                  Mis pedidos
                </h2>

                <div className="mt-4 space-y-3">
                  {pedidos.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="rounded-lg border p-3"
                    >
                      <p className="font-semibold">
                        Pedido #{pedido.id}
                      </p>
                      <p className="text-sm">
                        Estado: {pedido.status}
                      </p>
                      <p className="text-sm">
                        {moneda.format(Number(pedido.total))}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
