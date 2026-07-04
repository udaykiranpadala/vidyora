import axios from "axios";

// Plain axios instance - test-takers never have an organizer JWT,
// so we don't use the interceptor-equipped client here.
const publicApi = axios.create({ baseURL: "/api" });

export const attemptApi = {
  join: (accessCode, data) => publicApi.post(`/attempts/join/${accessCode}`, data),
  getLobby: (attemptId) => publicApi.get(`/attempts/${attemptId}/lobby`),
  start: (attemptId) => publicApi.post(`/attempts/${attemptId}/start`),
  getQuestion: (attemptId, index) =>
    publicApi.get(`/attempts/${attemptId}/question/${index}`),
  runCode: (attemptId, data) => publicApi.post(`/attempts/${attemptId}/run`, data),
  submitAnswer: (attemptId, data) =>
    publicApi.post(`/attempts/${attemptId}/submit-answer`, data),
  complete: (attemptId) => publicApi.post(`/attempts/${attemptId}/complete`),
  logEvent: (attemptId, eventType) =>
    publicApi.post(`/attempts/${attemptId}/log-event`, { eventType }),
  getLeaderboard: (accessCode) =>
    publicApi.get(`/public/leaderboard/${accessCode}`),
};
