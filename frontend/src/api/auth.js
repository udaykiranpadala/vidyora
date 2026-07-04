import api from "./client";

export const authApi = {
  updateProfile: (data) => api.patch("/auth/profile", data),
  forgotPasswordRequest: (email) => api.post("/auth/forgot-password-request", { email }),
  forgotPasswordReset: (data) => api.post("/auth/forgot-password-reset", data),
};
