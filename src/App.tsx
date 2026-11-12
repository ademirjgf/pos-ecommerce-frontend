
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { InicializadorSesion } from "./components/layout/InicializadorSesion";
import { RutaProtegida } from "./components/layout/RutaProtegida";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegistroPage } from "./pages/auth/RegistroPage";
import { StaffPage } from "./pages/staff/StaffPage";
import { CatalogoAdminPage } from "./pages/staff/CatalogoAdminPage";
import { CajerosAdminPage } from "./pages/staff/CajerosAdminPage";
import { TiendaPage } from "./pages/shop/TiendaPage";

function App() {
  return (
    <BrowserRouter>
      <InicializadorSesion>
        <Routes>
          <Route path="/" element={<Navigate to="/tienda" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/tienda" element={<TiendaPage />} />

          <Route
            element={
              <RutaProtegida rolesPermitidos={["ADMIN", "CASHIER"]} />
            }
          >
            <Route path="/staff" element={<StaffPage />} />
          </Route>

          <Route
            element={<RutaProtegida rolesPermitidos={["ADMIN"]} />}
          >
            <Route
              path="/staff/catalogo"
              element={<CatalogoAdminPage />}
            />
            <Route
              path="/staff/cajeros"
              element={<CajerosAdminPage />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/tienda" replace />} />
        </Routes>
      </InicializadorSesion>
    </BrowserRouter>
  );
}

export default App;
