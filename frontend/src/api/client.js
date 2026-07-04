import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Automatically attach the organizer's JWT (if logged in) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("organizerToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
