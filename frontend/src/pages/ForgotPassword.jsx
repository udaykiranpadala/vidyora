import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/auth";
import Navbar from "../components/Navbar";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState(1); // 1: request OTP, 2: reset password, 3: success
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP request
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await authApi.forgotPasswordRequest(email);
      setMessage(res.data.message || "Reset OTP sent to your registered email");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verification and Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPasswordReset({
        email,
        otp,
        newPassword,
        confirmPassword
      });
      setMessage(res.data.message || "Password reset successfully");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP trigger (Step 2)
  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await authApi.forgotPasswordRequest(email);
      setMessage(res.data.message || "A new OTP code has been sent!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper hero-grid flex flex-col font-sans auth-page">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">

          {/* Card top decoration (Emerald Green theme) */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-deep via-accent to-success" />

          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-extrabold text-ink tracking-tight">
                  Reset Password
                </h1>
                <p className="text-ink-secondary text-xs mt-2 uppercase tracking-wider font-semibold">
                  Send OTP to registered email
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-xl bg-danger-soft border border-danger text-danger text-sm font-medium flex items-center gap-2">
                  <span className="shrink-0 text-danger">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase">
                    Registered Email
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-ink-secondary opacity-70">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Type your email address"
                      className="w-full pl-12 pr-4 py-3 text-sm rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-deep text-white font-semibold rounded-full py-3.5 mt-2 transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {loading ? "Sending OTP..." : "Request Reset Code"}
                </button>

                <p className="text-sm text-center text-ink-secondary mt-2">
                  Remember password?{" "}
                  <Link to="/login" className="text-accent font-bold hover:underline">
                    Log In
                  </Link>
                </p>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-extrabold text-ink tracking-tight">
                  Enter Reset Code
                </h1>
                <p className="text-ink-secondary text-xs mt-2 uppercase tracking-wider font-semibold">
                  Check code sent to {email}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-xl bg-danger-soft border border-danger text-danger text-sm font-medium flex items-center gap-2">
                  <span className="shrink-0 text-danger">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </span>
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="mb-6 p-3 rounded-xl bg-success-soft border border-success/30 text-success text-xs font-semibold flex items-center gap-2">
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase">
                    6-Digit Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 text-center tracking-widest font-mono text-lg font-bold rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full px-5 py-3 text-sm rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-type new password"
                    className="w-full px-5 py-3 text-sm rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-deep text-white font-semibold rounded-full py-3.5 mt-2 transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? "Resetting Password..." : "Update Password"}
                </button>

                <div className="flex justify-between items-center text-xs font-semibold px-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-accent hover:text-accent-deep hover:underline transition-colors"
                  >
                    Resend Code (OTP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-ink-secondary hover:text-ink transition-colors"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-accent-soft border border-accent/30 rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-extrabold text-ink tracking-tight mb-2">
                All Done!
              </h1>
              <p className="text-ink-secondary text-sm leading-relaxed mb-8">
                Your password has been successfully updated. You can now use it to log in to your organizer dashboard.
              </p>

              <button
                onClick={() => navigate("/login")}
                className="w-full bg-accent hover:bg-accent-deep text-white font-semibold rounded-full py-3.5 transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Return to Log In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
