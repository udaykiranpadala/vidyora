import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuth } from "../context/AuthContext";
import SplitText from "../components/SplitText";
import ShinyText from "../components/ShinyText";
import SplashCursor from "../components/SplashCursor";
import { ParticleCard } from "../components/MagicBento";

export default function Landing() {
  const { organizer } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-expert" style={{ background: "var(--color-paper)" }}>
      <SplashCursor 
        DENSITY_DISSIPATION={4.5}
        SPLAT_RADIUS={0.15}
      />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Ambient gradient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            style={{
              position: "absolute",
              top: "-10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "900px",
              height: "500px",
              background:
                "radial-gradient(ellipse at center, rgba(5,150,105,0.13) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "15%",
              width: "400px",
              height: "300px",
              background:
                "radial-gradient(ellipse at center, rgba(5,150,105,0.07) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              right: "10%",
              width: "300px",
              height: "250px",
              background:
                "radial-gradient(ellipse at center, rgba(16,185,129,0.07) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              border: "1px solid var(--color-line)",
              background: "var(--color-surface)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 6px rgba(16,185,129,0.7)",
              }}
            />
            <ShinyText
              text="A Modern Platform For Secure Exams"
              className="text-sm font-semibold tracking-wide"
              color="var(--color-ink-secondary)"
              shineColor="var(--color-accent)"
              speed={3}
            />
          </div>

          {/* Headline */}
          <h1
            className="font-display font-bold leading-tight mb-6"
            style={{ fontSize: "clamp(2.4rem, 5vw, 3.75rem)", color: "var(--color-ink)" }}
          >
            <SplitText
              text="Where Students Prove their"
              className="inline-block"
              delay={35}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 25 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              textAlign="center"
              tag="span"
            />{" "}
            <SplitText
              text="Coding Skills"
              className="inline-block"
              style={{
                color: "var(--color-accent)"
              }}
              delay={35}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 25 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              textAlign="center"
              tag="span"
            />
          </h1>

          <p
            className="max-w-2xl mx-auto mb-3 leading-relaxed"
            style={{ fontSize: "1.05rem", color: "var(--color-ink-secondary)" }}
          >
            Host live coding contests, MCQ exams, and timed assessments — get results instantly.
            Students join with just a code. No signup. No friction.
          </p>
          <p
            className="mb-10"
            style={{ fontSize: "0.95rem", color: "var(--color-ink-secondary)", opacity: 0.85 }}
          >
            Anti-cheat protection · Live leaderboards · Real-time timers · Instant analytics
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
            {organizer ? (
              <div className="w-full sm:w-auto">
                <Button 
                  onClick={() => {
                    setTimeout(() => {
                      navigate("/dashboard");
                    }, 250);
                  }}
                  className="w-full px-8 py-3 text-base bg-accent text-white hover:bg-accent-deep active:scale-95 transition-all transform duration-150 shadow-lg shadow-accent/25 hover:shadow-accent/40 rounded-xl"
                >
                  Enter Organizer Hub →
                </Button>
              </div>
            ) : (
              <>
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button 
                    className="w-full px-8 py-3 text-base !bg-[#1D55D8] hover:!bg-[#1944BC] active:scale-95 transition-all"
                    glowColor="37, 99, 235"
                  >
                    Get started free →
                  </Button>
                </Link>
                <div className="w-full sm:w-auto">
                  <GoogleSignInButton />
                </div>
              </>
            )}
          </div>

          {/* Social proof line */}
          <p className="mt-6 text-sm" style={{ color: "var(--color-ink-secondary)", opacity: 0.75 }}>
            Trusted security for Every Assessment
          </p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ height: "1px", background: "var(--color-line)", opacity: 0.5 }} />

      {/* ── Feature Cards ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#059669" }}>
            Everything you need
          </p>
          <h2 className="font-display font-bold" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", color: "var(--color-ink)" }}>
            The Complete Assessment Platform for Modern Education
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ),
              title: "Create Exams",
              desc: "Build MCQ and coding challenges with per-question timers, test cases, scoring, and anti-cheat restrictions.",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              ),
              title: "Share Instantly",
              desc: "Publish and share a short access code or QR. Students join in seconds — no account, no friction.",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: "Track Results",
              desc: "Live leaderboards, detailed submissions, violation flags, and exportable results — all in one place.",
            },
          ].map((item) => (
            <ParticleCard
              key={item.title}
              glowColor="5, 150, 105"
              enableTilt={true}
              enableMagnetism={false}
              clickEffect={true}
              className="magic-bento-card--border-glow"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-line)",
                borderRadius: "1rem",
                padding: "1.75rem",
                minHeight: "auto",
                aspectRatio: "auto",
                justifyContent: "start",
                "--glow-color": "5, 150, 105"
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "0.625rem",
                  background: "rgba(5,150,105,0.1)",
                  color: "#059669",
                  marginBottom: "1rem",
                }}
              >
                {item.icon}
              </div>
              <h3 className="font-semibold mb-1.5" style={{ color: "var(--color-ink)", fontSize: "0.95rem" }}>
                {item.title}
              </h3>
              <p className="leading-relaxed" style={{ fontSize: "0.82rem", color: "var(--color-ink-secondary)" }}>
                {item.desc}
              </p>
            </ParticleCard>
          ))}
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <div style={{ borderTop: "1px solid var(--color-line)", borderBottom: "1px solid var(--color-line)" }}>
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-3 gap-6 text-center">
          {[
            { value: "10K+", label: "Assessments Created" },
            { value: "50K+", label: "Students Assessed" },
            { value: "99.9%", label: "Uptime" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display font-bold mb-1" style={{ fontSize: "1.8rem", color: "#059669" }}>
                {s.value}
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-ink-secondary)", fontWeight: 500 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="py-8 text-center" style={{ fontSize: "0.85rem", color: "var(--color-ink-secondary)", opacity: 0.8 }}>
        © {new Date().getFullYear()} Vidyora — Professional assessment platform for educators
      </footer>
    </div>
  );
}
