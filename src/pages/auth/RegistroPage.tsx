import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registrarCliente } from "../../api/auth";

const esquema = z.object({
  firstName: z.string().min(1, "Nombre obligatorio"),
  lastName: z.string().min(1, "Apellido obligatorio"),
  email: z.email("Correo inválido"),
  phone: z.string().min(1, "Teléfono obligatorio"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type Formulario = z.infer<typeof esquema>;

export function RegistroPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
  });

async function enviar(datos: Formulario) {
    setError("");
    setEnviando(true);

try {
      await registrarCliente(datos);
      navigate("/login", {
        state: { mensaje: "Cuenta creada. Ya puedes iniciar sesión." },
      });
    } catch {
      setError("No se pudo completar el registro. Revisa tus datos.");
    } finally {
      setEnviando(false);
    }
  }

return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(enviar)}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-3xl font-bold">Crear cuenta</h1>
        <p className="text-slate-500">
          Registro exclusivo para clientes web
        </p>

{([
          ["firstName", "Nombre"],
          ["lastName", "Apellido"],
          ["email", "Correo electrónico"],
          ["phone", "Teléfono"],
          ["password", "Contraseña"],
        ] as const).map(([campo, etiqueta]) => (
          <div key={campo}>
            <label className="mb-1 block font-medium">{etiqueta}</label>
            <input
              {...register(campo)}
              type={
                campo === "password"
                  ? "password"
                  : campo === "email"
                    ? "email"
                    : "text"
              }
              className="w-full rounded-lg border p-3"
            />
            <p className="text-sm text-red-600">
              {errors[campo]?.message}
            </p>
          </div>
        ))}

        {error && <p role="alert" className="text-red-600">{error}</p>}

<button
          disabled={enviando}
          className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
        >
          {enviando ? "Registrando..." : "Crear cuenta"}
        </button>

<Link to="/login" className="block text-center text-blue-700">
          Volver al inicio de sesión
        </Link>
      </form>
    </main>
  );
}