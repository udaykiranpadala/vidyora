import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import GoogleSignInButton from "../components/GoogleSignInButton";
import ShinyText from "../components/ShinyText";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      login(res.data.organizer, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

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

            {/* Premium Inline SVG Illustration */}
            <div className="w-full max-w-md aspect-[4/3] flex items-center justify-center relative z-10">
              <svg width="100%" height="100%" viewBox="0 0 500 380" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background soft glow bubble */}
                <circle cx="250" cy="180" r="140" fill="currentColor" className="text-accent/5" />
                
                {/* Modern Floating Code Brackets/Decorations */}
                <text x="70" y="100" fill="currentColor" className="text-accent/30 font-mono text-3xl font-bold animate-pulse">{`{`}</text>
                <text x="400" y="120" fill="currentColor" className="text-accent/30 font-mono text-3xl font-bold animate-pulse">{`}`}</text>
                <text x="380" y="240" fill="currentColor" className="text-accent/20 font-mono text-2xl font-bold">&lt;/&gt;</text>
                
                {/* Desk Line */}
                <line x1="50" y1="280" x2="450" y2="280" stroke="currentColor" className="text-line" strokeWidth="4" strokeLinecap="round" />
                <line x1="100" y1="280" x2="100" y2="340" stroke="currentColor" className="text-line" strokeWidth="4" />
                <line x1="400" y1="280" x2="400" y2="340" stroke="currentColor" className="text-line" strokeWidth="4" />

                {/* Chair */}
                <path d="M120 340 L140 250 L125 190 C125 160 150 155 165 170 C180 185 185 210 185 240" stroke="currentColor" style={{ color: "var(--color-accent-deep)" }} strokeWidth="6" strokeLinecap="round" fill="none" />
                <path d="M132 250 H185" stroke="currentColor" style={{ color: "var(--color-accent-deep)" }} strokeWidth="6" />

                {/* Character Torso & Arms */}
                <path d="M165 295 L175 220 Q190 200 205 195" stroke="currentColor" className="text-ink" strokeWidth="16" strokeLinecap="round" />
                <circle cx="210" cy="155" r="16" fill="currentColor" className="text-ink" />
                <path d="M205 150 C205 140 220 140 222 152 C225 158 212 163 205 150Z" fill="currentColor" className="text-accent" />
                
                {/* Arms typing on laptop */}
                <path d="M175 240 C195 240 220 245 245 250" stroke="currentColor" className="text-ink/80" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M175 248 C195 250 215 252 248 255" stroke="currentColor" className="text-ink/80" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                {/* Laptop Base & Screen */}
                <path d="M260 280 L350 280 L360 274 L250 274 Z" fill="currentColor" className="text-ink-secondary" />
                <path d="M268 274 L328 274 L340 212 L280 212 Z" fill="currentColor" className="text-surface" stroke="var(--color-accent)" strokeWidth="3" />
                
                {/* Laptop Screen Content (Code Lines in green colors) */}
                <line x1="290" y1="222" x2="325" y2="222" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="286" y1="232" x2="315" y2="232" stroke="var(--color-accent-deep)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="289" y1="242" x2="305" y2="242" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="284" y1="252" x2="320" y2="252" stroke="var(--color-success-soft)" strokeWidth="2.5" strokeLinecap="round" />

                {/* Decorative floating stats/checks */}
                <circle cx="370" cy="170" r="10" fill="currentColor" className="text-success-soft" />
                <path d="M366 170 L369 173 L374 167" stroke="currentColor" className="text-success" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                
                <circle cx="90" cy="210" r="8" fill="currentColor" className="text-success-soft" stroke="var(--color-accent)" strokeWidth="1" />
                
                {/* Sparkles */}
                <path d="M400 90 L403 82 L406 90 L403 98 Z" fill="currentColor" className="text-accent" />
              </svg>
            </div>
            
            <p className="text-ink-secondary text-sm font-medium mt-4 max-w-sm relative z-10">
              Deliver secure, automated, and candidate-friendly developer evaluations flawlessly.
            </p>
          </div>

          {/* Right Pane - Redesigned Welcome Card */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden auth-card">
              
              {/* Card top gradient line decoration (Emerald Green theme) */}
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: "linear-gradient(to right, #047857, #059669, #10B981)" }} />
              
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-extrabold tracking-tight">
                  <ShinyText text="Welcome" speed={3.5} color="var(--color-ink)" shineColor="var(--color-accent)" />
                </h1>
                <p className="text-ink-secondary text-xs mt-2 uppercase tracking-wider font-semibold">
                  Access your assessment dashboard
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-xl bg-danger-soft border border-danger text-danger text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                
                {/* Email Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ink-secondary tracking-wider uppercase">
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-ink-secondary opacity-70">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Type Username or Email"
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
                      placeholder="Enter Password"
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

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between text-xs font-semibold px-1">
                  <label className="flex items-center gap-2 text-ink-secondary hover:text-ink cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberLogin}
                      onChange={(e) => setRememberLogin(e.target.checked)}
                      className="rounded border-line bg-surface text-accent focus:ring-accent outline-none w-3.5 h-3.5"
                    />
                    <span>Remember Login</span>
                  </label>
                  <Link to="/forgot-password" className="text-accent hover:text-accent-deep hover:underline transition-all">
                    Forgot Password?
                  </Link>
                </div>

                {/* Log In Button ( Emerald theme accent colors ) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-deep text-white font-semibold rounded-full py-3.5 mt-2 transition-all duration-200 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? "Logging In..." : "Log In"}
                </button>

                {/* Divider */}
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-line" />
                  </div>
                  <span className="relative bg-surface px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    OR
                  </span>
                </div>

                {/* Social Login Buttons */}
                <div className="flex items-center justify-center gap-6">
                  {/* Facebook Icon */}
                  <button
                    type="button"
                    onClick={() => alert("Facebook authentication is coming soon!")}
                    className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center text-accent hover:bg-accent-soft transition-all shadow-sm hover:scale-105 cursor-pointer"
                    title="Sign in with Facebook"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                    </svg>
                  </button>
                  
                  {/* Gmail (Google Login) Circle Icon */}
                  {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                    <div className="w-10 h-10 hover:scale-105 transition-all flex items-center justify-center rounded-full border border-line bg-surface overflow-hidden shadow-sm cursor-pointer">
                      <GoogleSignInButton type="icon" shape="circle" onError={setError} />
                    </div>
                  )}

                  {/* Twitter/X Icon */}
                  <button
                    type="button"
                    onClick={() => alert("Twitter/X authentication is coming soon!")}
                    className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center text-accent hover:bg-accent-soft transition-all shadow-sm hover:scale-105 cursor-pointer"
                    title="Sign in with Twitter"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                </div>

                {/* Link to SignUp */}
                <p className="text-sm text-center text-ink-secondary mt-2">
                  Don't have account?{" "}
                  <Link to="/signup" className="text-accent font-bold hover:underline">
                    SignUp
                  </Link>
                </p>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
