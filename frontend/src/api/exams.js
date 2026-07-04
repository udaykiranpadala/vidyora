import api from "./client";

export const examApi = {
  create: (data) => api.post("/exams", data),
  list: () => api.get("/exams"),
  getById: (examId) => api.get(`/exams/${examId}`),
  update: (examId, data) => api.patch(`/exams/${examId}`, data),
  publish: (examId) => api.post(`/exams/${examId}/publish`),
  close: (examId) => api.post(`/exams/${examId}/close`),
  delete: (examId) => api.delete(`/exams/${examId}`),
  getResults: (examId) => api.get(`/exams/${examId}/results`),

  addQuestion: (examId, data) => api.post(`/exams/${examId}/questions`, data),
  updateQuestion: (examId, questionId, data) =>
    api.patch(`/exams/${examId}/questions/${questionId}`, data),
  deleteQuestion: (examId, questionId) =>
    api.delete(`/exams/${examId}/questions/${questionId}`),
  reorderQuestions: (examId, orderedQuestionIds) =>
    api.post(`/exams/${examId}/questions/reorder`, { orderedQuestionIds }),
};
