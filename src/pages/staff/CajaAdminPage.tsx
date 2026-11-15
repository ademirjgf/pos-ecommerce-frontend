
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
  abrirCaja,
  cerrarCaja,
  obtenerCajaActual,
  type CierreCaja,
  type SesionCaja,
} from "../../api/caja";

function obtenerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const mensaje = error.response?.data?.message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(", ");
    }

    if (typeof mensaje === "string") {
      return mensaje;
    }

    if (error.response?.status === 404) {
      return "No se encontró una caja abierta.";
    }
  }

  return "No se pudo completar la operación.";
}

function formatoImporte(valor: string | number): string {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return String(valor);
  }

  return numero.toFixed(2);
}

function esImporteValido(valor: string): boolean {
  if (valor.trim() === "") return false;

  const numero = Number(valor);

  return Number.isFinite(numero) && numero >= 0;
}

export function CajaAdminPage() {
  const [sesion, setSesion] = useState<SesionCaja | null>(null);
  const [resultado, setResultado] = useState<CierreCaja | null>(null);

  const [montoInicial, setMontoInicial] = useState("");
  const [efectivoContado, setEfectivoContado] = useState("");

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const operacionEnCurso = useRef(false);

  async function consultarCaja() {
    setCargando(true);
    setError("");

    try {
      const caja = await obtenerCajaActual();
      setSesion(caja);
    } catch (errorDesconocido) {
      if (
        axios.isAxiosError(errorDesconocido) &&
        errorDesconocido.response?.status === 404
      ) {
        setSesion(null);
      } else {
        setError(obtenerMensajeError(errorDesconocido));
      }
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void consultarCaja();
  }, []);

  async function manejarApertura() {
    if (operacionEnCurso.current) return;

    if (!esImporteValido(montoInicial)) {
      setError("Ingresa un monto inicial válido, mayor o igual a cero.");
      return;
    }

    operacionEnCurso.current = true;
    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const caja = await abrirCaja(Number(montoInicial));

      setSesion(caja);
      setResultado(null);
      setMontoInicial("");
      setMensaje("La caja se abrió correctamente.");
    } catch (errorDesconocido) {
      setError(obtenerMensajeError(errorDesconocido));
    } finally {
      operacionEnCurso.current = false;
      setProcesando(false);
    }
  }

  async function manejarCierre() {
    if (operacionEnCurso.current) return;

    if (!esImporteValido(efectivoContado)) {
      setError("Ingresa el efectivo físico contado.");
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas el cierre de caja? Esta operación finalizará la sesión actual."
    );

    if (!confirmado) return;

    operacionEnCurso.current = true;
    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const cierre = await cerrarCaja(Number(efectivoContado));

      setResultado(cierre);
      setSesion(null);
      setEfectivoContado("");
      setMensaje("La caja se cerró correctamente.");
    } catch (errorDesconocido) {
      setError(obtenerMensajeError(errorDesconocido));
    } finally {
      operacionEnCurso.current = false;
      setProcesando(false);
    }
  }

  const diferencia = resultado
    ? Number(resultado.difference)
    : null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Administración de caja
            </h1>
            <p className="mt-1 text-slate-600">
              Apertura, cierre y conciliación de efectivo.
            </p>
          </div>

          <Link
            to="/staff"
            className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
          >
            Volver al panel
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {error}
          </div>
        )}

        {mensaje && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
          >
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            Consultando estado de caja...
          </div>
        ) : sesion ? (
          <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                Caja abierta
              </h2>

              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                ABIERTA
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Número de sesión
                </p>
                <p className="text-xl font-semibold">
                  #{sesion.id}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Fondo inicial
                </p>
                <p className="text-xl font-semibold">
                  {formatoImporte(sesion.openingAmount)}
                </p>
              </div>
            </div>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                void manejarCierre();
              }}
              className="space-y-4 border-t border-slate-200 pt-5"
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Cerrar y conciliar caja
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Cuenta el efectivo físico disponible, incluyendo
                  el fondo inicial, e ingresa el total.
                </p>
              </div>

              <label className="block space-y-2">
                <span className="font-medium text-slate-700">
                  Efectivo físico reportado
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={efectivoContado}
                  onChange={(evento) =>
                    setEfectivoContado(evento.target.value)
                  }
                  disabled={procesando}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </label>

              <p className="text-sm text-slate-500">
                El sistema calculará las ventas POS pagadas en
                efectivo y la diferencia exacta al cerrar.
              </p>

              <button
                type="submit"
                disabled={
                  procesando ||
                  !esImporteValido(efectivoContado)
                }
                className="rounded-lg bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {procesando
                  ? "Cerrando caja..."
                  : "Cerrar caja y ver conciliación"}
              </button>
            </form>
          </section>
        ) : (
          <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                Apertura de caja
              </h2>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                SIN CAJA ABIERTA
              </span>
            </div>

            <p className="text-slate-600">
              Ingresa el fondo inicial para comenzar un turno.
            </p>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                void manejarApertura();
              }}
              className="space-y-4"
            >
              <label className="block space-y-2">
                <span className="font-medium text-slate-700">
                  Monto inicial
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={montoInicial}
                  onChange={(evento) =>
                    setMontoInicial(evento.target.value)
                  }
                  disabled={procesando}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </label>

              <button
                type="submit"
                disabled={
                  procesando ||
                  !esImporteValido(montoInicial)
                }
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {procesando ? "Abriendo caja..." : "Abrir caja"}
              </button>
            </form>
          </section>
        )}

        {resultado && (
          <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                Resultado de conciliación
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  diferencia === 0
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {diferencia === 0
                  ? "CAJA CUADRADA"
                  : "DIFERENCIA DETECTADA"}
              </span>
            </div>

            <p className="text-sm text-slate-500">
              Sesión #{resultado.id}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Fondo inicial
                </p>
                <p className="text-xl font-semibold">
                  {formatoImporte(resultado.openingAmount)}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Ventas POS en efectivo
                </p>
                <p className="text-xl font-semibold">
                  {formatoImporte(resultado.totalCashSales)}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  Efectivo esperado
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatoImporte(resultado.expectedAmount)}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Efectivo físico reportado
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatoImporte(resultado.countedAmount)}
                </p>
              </div>
            </div>

            <div
              className={`rounded-xl border p-5 ${
                diferencia === 0
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p className="text-sm font-medium">
                Diferencia de caja
              </p>

              <p
                className={`mt-2 text-3xl font-bold ${
                  diferencia === 0
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {diferencia !== null && diferencia > 0 ? "+" : ""}
                {formatoImporte(resultado.difference)}
              </p>

              <p className="mt-2 text-sm">
                {diferencia === 0
                  ? "El efectivo contado coincide con el esperado."
                  : diferencia !== null && diferencia < 0
                    ? "Faltante de efectivo respecto al sistema."
                    : "Sobrante de efectivo respecto al sistema."}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
