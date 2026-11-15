    
import { useEffect, useState } from "react";
import axios from "axios";

import { obtenerHistorialPOS } from "../api/pos";
import type { VentaPOS } from "../types/pos";

export function useHistorialPOS(fecha: string) {
  const [ventas, setVentas] = useState<VentaPOS[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    if (!fecha) {
      return;
    }

    async function cargarHistorial() {
      setCargando(true);
      setError("");
      setVentas([]);

      try {
        const resultado = await obtenerHistorialPOS(fecha);

        if (activo) {
          setVentas(resultado);
        }
      } catch (errorDesconocido) {
        if (!activo) return;

        if (axios.isAxiosError(errorDesconocido)) {
          const mensaje = errorDesconocido.response?.data?.message;

          setError(
            typeof mensaje === "string"
              ? mensaje
              : "No se pudo consultar el historial."
          );
        } else {
          setError("No se pudo consultar el historial.");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargarHistorial();

    return () => {
      activo = false;
    };
  }, [fecha]);

  return {
    ventas,
    cargando,
    error,
  };
}
