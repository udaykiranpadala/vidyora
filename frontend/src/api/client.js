import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Automatically attach the organizer's JWT (if logged in) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("organizerToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh Token Queue Handler to avoid multiple concurrent refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token expiration & automatic refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh if 401 Unauthorized and not already retried or calling auth endpoints
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/signup")
    ) {
      const refreshToken = localStorage.getItem("organizerRefreshToken");
      if (!refreshToken) {
        localStorage.removeItem("organizerToken");
        localStorage.removeItem("organizerRefreshToken");
        localStorage.removeItem("organizer");
        window.dispatchEvent(new CustomEvent("auth:expired"));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken, organizer } = res.data;

        localStorage.setItem("organizerToken", newToken);
        if (newRefreshToken) {
          localStorage.setItem("organizerRefreshToken", newRefreshToken);
        }
        if (organizer) {
          localStorage.setItem("organizer", JSON.stringify(organizer));
        }

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("organizerToken");
        localStorage.removeItem("organizerRefreshToken");
        localStorage.removeItem("organizer");
        window.dispatchEvent(new CustomEvent("auth:expired"));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;