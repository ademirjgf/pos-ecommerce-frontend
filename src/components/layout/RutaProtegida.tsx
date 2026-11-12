import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import type { Rol } from "../../types/auth";

interface Props {
  rolesPermitidos: Rol[];
}

export function RutaProtegida({ rolesPermitidos }: Props) {
  const { token, usuario, cargando } = useAuthStore();

if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Verificando sesión...</p>
      </div>
    );
  }

if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

if (!rolesPermitidos.includes(usuario.role)) {
    return (
      <Navigate
        to={usuario.role === "CUSTOMER" ? "/tienda" : "/staff"}
        replace
      />
    );
  }

return <Outlet />;
}