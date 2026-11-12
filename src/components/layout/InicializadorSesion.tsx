import { useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { obtenerPerfil } from "../../api/auth";

interface Props {
  children: React.ReactNode;
}

export function InicializadorSesion({ children }: Props) {
  const token = useAuthStore((state) => state.token);
  const establecerUsuario = useAuthStore(
    (state) => state.establecerUsuario
  );
  const establecerCargando = useAuthStore(
    (state) => state.establecerCargando
  );
  const cerrarSesion = useAuthStore(
    (state) => state.cerrarSesion
  );

useEffect(() => {
    let activo = true;

async function verificar() {
      if (!token) {
        establecerCargando(false);
        return;
      }

      establecerCargando(true);

try {
        const usuario = await obtenerPerfil();

if (activo) {
          establecerUsuario(usuario);
        }
      } catch {
        if (activo) {
          cerrarSesion();
        }
      } finally {
        if (activo) {
          establecerCargando(false);
        }
      }
    }

    void verificar();

return () => {
      activo = false;
    };
  }, [
    token,
    establecerUsuario,
    establecerCargando,
    cerrarSesion,
  ]);

return <>{children}</>;
}