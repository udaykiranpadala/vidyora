import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import api from "./api/client";

// Lazy load route components for fast initial load performance
const Landing = lazy(() => import("./pages/Landing"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ExamBuilder = lazy(() => import("./pages/ExamBuilder"));
const ExamResults = lazy(() => import("./pages/ExamResults"));
const JoinExam = lazy(() => import("./pages/JoinExam"));
const ExamAttempt = lazy(() => import("./pages/ExamAttempt"));
const ExamComplete = lazy(() => import("./pages/ExamComplete"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));

const PageLoader = () => (
  <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-3">
    <div className="w-9 h-9 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs font-mono font-bold text-accent tracking-wider uppercase animate-pulse">
      Loading Vidyora...
    </span>
  </div>
);

function App() {
  useEffect(() => {
    // Ping backend in background to warm it up (wake up from potential cold start)
    api.get("/health").catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
