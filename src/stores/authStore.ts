
import { create } from "zustand";
import type { Usuario } from "../types/auth";

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (token: string) => void;
  establecerUsuario: (usuario: Usuario) => void;
  establecerCargando: (valor: boolean) => void;
  cerrarSesion: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("pos_token"),
  usuario: null,
  cargando: true,

iniciarSesion: (token) => {
    localStorage.setItem("pos_token", token);
    set({ token, usuario: null });
  },

establecerUsuario: (usuario) => {
    set({ usuario });
  },

establecerCargando: (valor) => {
    set({ cargando: valor });
  },

cerrarSesion: () => {
    localStorage.removeItem("pos_token");
    set({
      token: null,
      usuario: null,
      cargando: false,
    });
  },
}));
    
