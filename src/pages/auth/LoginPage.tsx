import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login, obtenerPerfil } from "../../api/auth";
import { useAuthStore } from "../../stores/authStore";

const esquema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type Formulario = z.infer<typeof esquema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { token, usuario, iniciarSesion, establecerUsuario, cerrarSesion } =
    useAuthStore();

const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
  });

if (token && usuario) {
    return (
      <Navigate
        to={usuario.role === "CUSTOMER" ? "/tienda" : "/staff"}
        replace
      />
    );
  }

async function enviar(datos: Formulario) {
    setError("");
    setEnviando(true);

try {
      const respuesta = await login(datos.email, datos.password);

      iniciarSesion(respuesta.accessToken);

const perfil = await obtenerPerfil();
      establecerUsuario(perfil);

navigate(perfil.role === "CUSTOMER" ? "/tienda" : "/staff", {
        replace: true,
      });
    } catch {
      cerrarSesion();
      setError("No se pudo iniciar sesión. Verifica tus credenciales.");
    } finally {
      setEnviando(false);
    }
  }

return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(enviar)}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-3xl font-bold">Iniciar sesión</h1>
        <p className="text-slate-500">POS & E-commerce</p>

<div>
          <label className="mb-1 block font-medium">Correo electrónico</label>
          <input
            {...register("email")}
            type="email"
            className="w-full rounded-lg border p-3"
          />
          <p className="text-sm text-red-600">{errors.email?.message}</p>
        </div>

<div>
          <label className="mb-1 block font-medium">Contraseña</label>
          <input
            {...register("password")}
            type="password"
            className="w-full rounded-lg border p-3"
          />
          <p className="text-sm text-red-600">{errors.password?.message}</p>
        </div>

        {error && <p role="alert" className="text-red-600">{error}</p>}

<button
          disabled={enviando}
          className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
        >
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>

<p className="text-center text-sm">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="text-blue-700 underline">
            Regístrate como cliente
          </Link>
        </p>
      </form>
    </main>
  );
}