
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { crearCajero } from "../../api/catalogo";

const esquema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

type FormularioCajero = z.infer<typeof esquema>;

export function CajerosAdminPage() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormularioCajero>({
    resolver: zodResolver(esquema),
    defaultValues: { email: "", password: "" },
  });

  async function guardar(datos: FormularioCajero) {
    setError("");
    setMensaje("");

    try {
      const cajero = await crearCajero(datos);
      reset();
      setMensaje(`Cajero ${cajero.email} creado correctamente.`);
    } catch {
      setError(
        "No se pudo crear el Cajero. Verifica si el correo ya existe."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Administrar Cajeros</h1>
            <p className="text-slate-500">
              Crear cuentas de personal de caja.
            </p>
          </div>

          <Link
            to="/staff"
            className="rounded-lg bg-slate-800 px-4 py-2 text-white"
          >
            Volver
          </Link>
        </header>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {mensaje && (
          <p role="status" className="rounded-lg bg-green-50 p-4 text-green-700">
            {mensaje}
          </p>
        )}

        <form
          onSubmit={handleSubmit(guardar)}
          className="space-y-5 rounded-xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold">Nuevo Cajero</h2>

          <label className="block">
            <span className="mb-1 block">Correo electrónico</span>
            <input
              {...register("email")}
              type="email"
              autoComplete="off"
              className="w-full rounded-lg border p-3"
              placeholder="cajero@ejemplo.com"
            />
            <span className="text-sm text-red-600">
              {errors.email?.message}
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block">Contraseña inicial</span>
            <input
              {...register("password")}
              type="password"
              autoComplete="new-password"
              className="w-full rounded-lg border p-3"
              placeholder="Mínimo 8 caracteres"
            />
            <span className="text-sm text-red-600">
              {errors.password?.message}
            </span>
          </label>

          <p className="text-sm text-slate-500">
            La cuenta tendrá únicamente el rol CASHIER.
            La contraseña no se mostrará después de guardar.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Creando..." : "Crear Cajero"}
          </button>
        </form>
      </div>
    </main>
  );
}
