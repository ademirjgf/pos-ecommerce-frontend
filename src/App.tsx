
import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { RutaProtegida } from "./components/layout/RutaProtegida";
import { InicializadorSesion } from "./components/layout/InicializadorSesion";

// Páginas cargadas bajo demanda.
const LoginPage = lazy(() =>
  import("./pages/auth/LoginPage").then((modulo) => ({
    default: modulo.LoginPage,
  }))
);

const RegistroPage = lazy(() =>
  import("./pages/auth/RegistroPage").then((modulo) => ({
    default: modulo.RegistroPage,
  }))
);

const TiendaPage = lazy(() =>
  import("./pages/shop/TiendaPage").then((modulo) => ({
    default: modulo.TiendaPage,
  }))
);

const StaffPage = lazy(() =>
  import("./pages/staff/StaffPage").then((modulo) => ({
    default: modulo.StaffPage,
  }))
);

const CatalogoAdminPage = lazy(() =>
  import("./pages/staff/CatalogoAdminPage").then((modulo) => ({
    default: modulo.CatalogoAdminPage,
  }))
);

const CajerosAdminPage = lazy(() =>
  import("./pages/staff/CajerosAdminPage").then((modulo) => ({
    default: modulo.CajerosAdminPage,
  }))
);

const PosPage = lazy(() =>
  import("./pages/staff/PosPage").then((modulo) => ({
    default: modulo.PosPage,
  }))
);

const HistorialPosPage = lazy(() =>
  import("./pages/staff/HistorialPosPage").then((modulo) => ({
    default: modulo.HistorialPosPage,
  }))
);

const OrdenesAdminPage = lazy(() =>
  import("./pages/staff/OrdenesAdminPage").then((modulo) => ({
    default: modulo.OrdenesAdminPage,
  }))
);

const PedidoManualPage = lazy(() =>
  import("./pages/staff/PedidoManualPage").then((modulo) => ({
    default: modulo.PedidoManualPage,
  }))
);

const CajaAdminPage = lazy(() =>
  import("./pages/staff/CajaAdminPage").then((modulo) => ({
    default: modulo.CajaAdminPage,
  }))
);

function PantallaCarga() {
  return (
    <main
      role="status"
      className="flex min-h-screen items-center justify-center bg-slate-50"
    >
      <p className="text-lg font-medium text-slate-600">
        Cargando página...
      </p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <InicializadorSesion>
        <Suspense fallback={<PantallaCarga />}>
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/tienda" replace />}
            />

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/registro"
              element={<RegistroPage />}
            />

            <Route
              path="/tienda"
              element={<TiendaPage />}
            />

            {/* ADMIN y CASHIER */}
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

            {/* Exclusivo de ADMIN */}
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

              <Route
                path="/staff/ordenes/manual"
                element={<PedidoManualPage />}
              />

              <Route
                path="/staff/caja"
                element={<CajaAdminPage />}
              />
            </Route>

            <Route
              path="*"
              element={<Navigate to="/tienda" replace />}
            />
          </Routes>
        </Suspense>
      </InicializadorSesion>
    </BrowserRouter>
  );
}
