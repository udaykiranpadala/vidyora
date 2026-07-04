import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import GoogleSignInButton from "../components/GoogleSignInButton";
import ShinyText from "../components/ShinyText";

const STEPS = {
  EMAIL: "email",
  OTP: "otp",
  DETAILS: "details",
};

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/signup/request-otp", { email });
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/signup/verify-otp", { email, otp });
      setStep(STEPS.DETAILS);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/signup/complete", {
        email,
        username,
        password,
        collegeName,
      });
      login(res.data.organizer, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  const isGoogleConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen bg-paper hero-grid flex flex-col auth-page">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center px-4">
          
          {/* Left Pane - Tagline and Illustration */}
          <div className="hidden md:flex flex-col items-center text-center p-8 bg-card/10 border border-line/20 rounded-3xl backdrop-blur-md shadow-2xl relative">
            <div className="absolute inset-0 bg-radial-gradient from-accent/5 via-transparent to-transparent pointer-events-none rounded-3xl" />
            <div className="mb-6 relative z-10">
              <h2 className="font-display text-2xl lg:text-3xl font-extrabold leading-tight uppercase tracking-wider">
                <ShinyText text="Online Assessments" speed={3.5} color="var(--color-ink)" shineColor="var(--color-accent)" />
              </h2>
              <h3 className="font-display text-xl lg:text-2xl font-bold mt-1 uppercase tracking-widest">
                <ShinyText text="Are Now Simple" speed={3.5} color="var(--color-accent)" shineColor="var(--color-ink)" />
              </h3>
            </div>

            {/* Premium Inline SVG Illustration (Rocket Launch for signup/getting started with green accents) */}
            <div className="w-full max-w-md aspect-[4/3] flex items-center justify-center relative z-10">
              <svg width="100%" height="100%" viewBox="0 0 500 380" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Professional Gradients */}
                <defs>
                  <linearGradient id="fire-outer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                  <linearGradient id="fire-inner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="window-glass" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#93c5fd" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                {/* Background glow bubble */}
                <circle cx="250" cy="180" r="140" fill="currentColor" className="text-accent/5" />

                {/* Floating brackets & code symbols */}
                <text x="80" y="110" fill="currentColor" className="text-accent/30 font-mono text-2xl font-bold animate-pulse">{`[]`}</text>
                <text x="390" y="230" fill="currentColor" className="text-accent/30 font-mono text-2xl font-bold animate-pulse">{`</>`}</text>
                <text x="380" y="100" fill="currentColor" className="text-accent/20 font-mono text-2xl font-bold">101</text>
                <text x="90" y="240" fill="currentColor" className="text-accent/20 font-mono text-xl font-bold">const</text>

                {/* Clouds at base */}
                <path d="M100 320 C120 300 160 300 180 320 C200 295 250 295 270 320 C290 300 330 300 350 320 H100 Z" fill="currentColor" className="text-line" opacity="0.3" />
                <path d="M140 330 C160 315 190 315 210 330 C230 310 270 310 290 330 C300 320 330 320 345 330 H140 Z" fill="currentColor" className="text-line" opacity="0.5" />

                {/* Professional Engine Flame */}
                <path d="M232 248 Q 250 320 250 320 Q 250 320 268 248 Z" fill="url(#fire-outer)" className="animate-pulse" />
                <path d="M241 248 Q 250 290 250 290 Q 250 290 259 248 Z" fill="url(#fire-inner)" className="animate-pulse" style={{ animationDelay: "150ms" }} />

                {/* Rocket Body */}
                <path d="M210 240 L220 200 L235 220 Z" fill="currentColor" className="text-accent-deep" />
                <path d="M290 240 L280 200 L265 220 Z" fill="currentColor" className="text-accent-deep" />
                <path d="M230 240 L230 150 C230 100 250 80 250 80 C250 80 270 100 270 150 L270 240 Z" fill="currentColor" className="text-ink" stroke="var(--color-accent)" strokeWidth="3" />
                
                {/* Center Circle Door (Glossy Glass Window) */}
                <circle cx="250" cy="140" r="14" fill="currentColor" className="text-card" stroke="var(--color-accent)" strokeWidth="2.5" />
                <circle cx="250" cy="140" r="11" fill="url(#window-glass)" />
                {/* Glass Reflection Highlight */}
                <path d="M 243 133 A 8 8 0 0 1 257 133 A 9 9 0 0 0 243 133 Z" fill="#ffffff" opacity="0.9" />
                
                {/* Tip */}
                <path d="M236 115 C242 100 248 90 250 80 C252 90 258 100 264 115 Z" fill="currentColor" className="text-accent" />

                {/* Stars */}
                <circle cx="160" cy="100" r="3" fill="#FFF" className="animate-ping" />
                <circle cx="340" cy="150" r="4" fill="#FFF" />
                <circle cx="310" cy="70" r="2" fill="#FFF" />
                <path d="M120 160 L124 152 L128 160 L124 168 Z" fill="currentColor" className="text-accent" />
              </svg>
            </div>
            
            <p className="text-ink-secondary text-sm font-medium mt-4 max-w-sm relative z-10">
              Create your organizer profile and launch premium assessments for candidates globally.
            </p>
          </div>

          {/* Right Pane - Signup Steps Card */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden auth-card">
              
              {/* Card Top Decoration Line (Emerald Green theme) */}
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: "linear-gradient(to right, #047857, #059669, #10B981)" }} />
              
              <div className="text-center mb-4">
                <h1 className="font-display text-3xl font-extrabold tracking-tight">
                  <ShinyText 
                    text={
                      step === STEPS.EMAIL ? "Create Account" :
                      step === STEPS.OTP ? "Verify Email" : "Fill Details"
                    }
                    speed={3.5}
                    color="var(--color-ink)"
                    shineColor="var(--color-accent)"
                  />
                </h1>
                <p className="text-ink-secondary text-xs mt-2 uppercase tracking-wider font-semibold">
                  {step === STEPS.EMAIL && "Get started as an organizer"}
                  {step === STEPS.OTP && "Confirm your verification code"}
                  {step === STEPS.DETAILS && "Set up credentials and college"}
                </p>
              </div>

              {/* Progress Indicators */}
              <div className="flex items-center justify-center gap-3 my-6">
                {[STEPS.EMAIL, STEPS.OTP, STEPS.DETAILS].map((s, i) => {
                  const isCurrent = step === s;
                  const isPassed = Object.values(STEPS).indexOf(step) > i;
                  return (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCurrent
                          ? "w-8 bg-accent"
                          : isPassed
                          ? "w-4 bg-accent-deep"
                          : "w-4 bg-line"
                      }`}
                    />
                  );
                })}
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-xl bg-danger-soft border border-danger text-danger text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: Enter Email */}
              {step === STEPS.EMAIL && (
                <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase">
                      Email address
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-ink-secondary opacity-70">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Your @email"
                        className="w-full pl-12 pr-4 py-3 text-sm rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent-deep text-white font-semibold rounded-full py-3.5 mt-2 transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? "Sending code..." : "Send verification code"}
                  </button>

                  {/* Social Sign In (Only if Google Client ID is configured) */}
                  {isGoogleConfigured && (
                    <>
                      <div className="relative my-2 text-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-line" />
                        </div>
                        <span className="relative bg-surface px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                          OR
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-6">
                        {/* Facebook Icon */}
                        <button
                          type="button"
                          onClick={() => alert("Facebook authentication is coming soon!")}
                          className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center text-accent hover:bg-accent-soft transition-all shadow-sm hover:scale-105 cursor-pointer"
                          title="Sign up with Facebook"
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                          </svg>
                        </button>
                        
                        {/* Google Sign-in Circle Icon */}
                        <div className="w-10 h-10 hover:scale-105 transition-all flex items-center justify-center rounded-full border border-line bg-surface overflow-hidden shadow-sm cursor-pointer">
                          <GoogleSignInButton type="icon" shape="circle" onError={setError} />
                        </div>

                        {/* Twitter Icon */}
                        <button
                          type="button"
                          onClick={() => alert("Twitter/X authentication is coming soon!")}
                          className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center text-accent hover:bg-accent-soft transition-all shadow-sm hover:scale-105 cursor-pointer"
                          title="Sign up with Twitter"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  )}

                  <p className="text-sm text-center text-ink-secondary mt-2">
                    Already have an account?{" "}
                    <Link to="/login" className="text-accent font-bold hover:underline">
                      Log in
                    </Link>
                  </p>
                </form>
              )}

              {/* STEP 2: Enter Verification Code */}
              {step === STEPS.OTP && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                  <div className="p-3 bg-card border border-line/50 rounded-2xl text-center text-xs">
                    <p className="text-ink-secondary">
                      We sent a 6-digit verification code to
                    </p>
                    <p className="text-ink font-bold font-mono text-sm mt-1 truncate">
                      {email}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase text-center">
                      Enter Verification Code
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-ink-secondary opacity-70">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        placeholder="000000"
                        className="w-full text-center tracking-[0.5em] pl-10 pr-4 py-3 text-lg font-mono rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/20 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent-deep text-white font-semibold rounded-full py-3.5 mt-2 transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? "Verifying..." : "Verify code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(STEPS.EMAIL)}
                    className="text-xs font-semibold text-accent hover:text-accent-deep transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Use a different email address
                  </button>
                </form>
              )}

              {/* STEP 3: Enter Account Details */}
              {step === STEPS.DETAILS && (
                <form onSubmit={handleCompleteSignup} className="flex flex-col gap-5">
                  <div className="p-3 bg-accent-soft border border-accent/30 rounded-2xl text-center text-xs flex items-center justify-center gap-2">
                    <span className="text-accent text-sm">✓</span>
                    <span className="text-accent font-bold font-mono">Email Verified</span>
                  </div>

                  {/* Username Section */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase">
                      Username
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-ink-secondary opacity-70">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="Choose a username"
                        className="w-full pl-12 pr-4 py-3 text-sm rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-ink-secondary opacity-70">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a3 3 0 11-6 0 3 3 0 016 0zm-6 5h.01M6 20v-4m0 0h4m-4 0h4m-4 0v-4m0 0h4" />
                        </svg>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        className="w-full pl-12 pr-12 py-3 text-sm rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-ink-secondary hover:text-ink transition-colors"
                        title={showPassword ? "Hide Password" : "Show Password"}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* College Name Section */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase">
                      College / Organization (optional)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-ink-secondary opacity-70">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        placeholder="e.g. SRM Institute of Technology"
                        className="w-full pl-12 pr-4 py-3 text-sm rounded-full border border-line bg-surface text-ink placeholder:text-ink-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent-deep text-white font-semibold rounded-full py-3.5 mt-2 transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
