
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { LoginPage } from "./pages/auth/LoginPage";
import { RegistroPage } from "./pages/auth/RegistroPage";
import { TiendaPage } from "./pages/shop/TiendaPage";

import { StaffPage } from "./pages/staff/StaffPage";
import { CatalogoAdminPage } from "./pages/staff/CatalogoAdminPage";
import { CajerosAdminPage } from "./pages/staff/CajerosAdminPage";
import { PosPage } from "./pages/staff/PosPage";
import { HistorialPosPage } from "./pages/staff/HistorialPosPage";
import { OrdenesAdminPage } from "./pages/staff/OrdenesAdminPage";

import { RutaProtegida } from "./components/layout/RutaProtegida";
import { InicializadorSesion } from "./components/layout/InicializadorSesion";

import { PedidoManualPage } from "./pages/staff/PedidoManualPage";

export default function App() {
  return (
    <BrowserRouter>
      <InicializadorSesion>
        <Routes>
          {/* Página inicial */}
          <Route
            path="/"
            element={<Navigate to="/tienda" replace />}
          />

          {/* Autenticación */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/registro"
            element={<RegistroPage />}
          />

          {/* Tienda pública */}
          <Route
            path="/tienda"
            element={<TiendaPage />}
          />

          {/* Rutas para ADMIN y CASHIER */}
          <Route
            element={
              <RutaProtegida
                rolesPermitidos={["ADMIN", "CASHIER"]}
              />
            }
          >
            <Route
              path="/staff"
              element={<StaffPage />}
            />

            <Route
              path="/staff/pos"
              element={<PosPage />}
            />

            <Route
              path="/staff/pos/historial"
              element={<HistorialPosPage />}
            />
          </Route>

          {/* Rutas exclusivas del ADMIN */}

          <Route
            path="/staff/ordenes/manual"
              element={<PedidoManualPage />}
              />
          <Route
            element={
              <RutaProtegida
                rolesPermitidos={["ADMIN"]}
              />
            }
          >
            <Route
              path="/staff/catalogo"
              element={<CatalogoAdminPage />}
            />

            <Route
              path="/staff/cajeros"
              element={<CajerosAdminPage />}
            />

            <Route
              path="/staff/ordenes"
              element={<OrdenesAdminPage />}
            />
          </Route>

          {/* Ruta no encontrada */}
          <Route
            path="*"
            element={<Navigate to="/tienda" replace />}
          />
        </Routes>
      </InicializadorSesion>
    </BrowserRouter>
  );
}
