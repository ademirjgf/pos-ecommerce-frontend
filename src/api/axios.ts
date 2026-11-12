import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pos_token");

if (token) {
config.headers.Authorization = `Bearer ${token}`;
}

return config;
});
