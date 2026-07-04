import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ExamBuilder from "./pages/ExamBuilder";
import ExamResults from "./pages/ExamResults";
import JoinExam from "./pages/JoinExam";
import ExamAttempt from "./pages/ExamAttempt";
import ExamComplete from "./pages/ExamComplete";
import Leaderboard from "./pages/Leaderboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Organizer auth + dashboard */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams/:examId"
            element={
              <ProtectedRoute>
                <ExamBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams/:examId/results"
            element={
              <ProtectedRoute>
                <ExamResults />
              </ProtectedRoute>
            }
          />

          {/* Test-taker (public, no login) */}
          <Route path="/join" element={<JoinExam />} />
          <Route path="/join/:accessCode" element={<JoinExam />} />
          <Route path="/exam-attempt/:attemptId" element={<ExamAttempt />} />
          <Route path="/exam-complete" element={<ExamComplete />} />

          {/* Public leaderboard */}
          <Route path="/leaderboard/:accessCode" element={<Leaderboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
