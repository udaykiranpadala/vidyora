import { useState, useEffect } from "react";
import { VidyoraLogo } from "./VidyoraLogo";

export default function PreExamLandingPage({
  config = {},
  candidateName = "",
  onContinue = () => {},
  isPreview = false,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Config fallbacks (ensuring graceful fallback if any field is omitted)
  const eventName = config.eventName ?? "COMPUTER SOCIETY OF INDIA";
  const eventTitle = config.eventTitle ?? "CSI ROUND 3";
  const logo = config.logo || "/csi-logo.png";
  const mainHeading = config.mainHeading ?? "CONGRATULATIONS, CODER!";
  const subHeading = config.subHeading ?? "YOU'VE MADE IT TO ROUND 3";
  const description =
    config.description ??
    "You successfully cleared Round 2 and earned your place in the next stage of the CSI Selection Process.";
  const motivationalHeading =
    config.motivationalHeading ?? "YOU EARNED YOUR SPOT. NOW MAKE IT COUNT.";
  const challengeLabel = config.challengeLabel ?? "ROUND 3 — CODING CHALLENGE";
  const tagline = config.tagline ?? "THINK • CODE • SOLVE • CONQUER";
  const primaryButtonText = config.primaryButtonText ?? "ENTER ROUND 3 →";
  const footerText = config.footerText ?? "Best of luck! Give it your best shot.";

  // Theme overrides & defaults matching Vidyora theme tokens
  const primaryColor = config.theme?.primaryColor || "#059669"; // Vidyora Emerald Accent default
  const backgroundColor = config.theme?.backgroundColor || "#0B0F14"; // Vidyora Dark Paper default

  // Pillars / Skill Cards fallback
  const showPillars = config.pillars?.enabled !== false;
  const defaultPillars = [
    { icon: "🧠", title: "LOGIC", description: "Problem Solving" },
    { icon: "💻", title: "CODING", description: "Implementation" },
    { icon: "⚡", title: "SPEED", description: "Accuracy & Precision" },
  ];
  const pillarsList =
    config.pillars?.items && config.pillars.items.length > 0
      ? config.pillars.items
      : defaultPillars;

  // Journey stage fallback
  const showJourney = config.journey?.enabled !== false;
  const defaultStages = [
    { label: "ROUND 1", status: "completed" },
    { label: "ROUND 2", status: "cleared" },
    { label: "ROUND 3", status: "current" },
    { label: "FINAL SELECTION", status: "upcoming" },
  ];
  const journeyStages =
    config.journey?.stages && config.journey.stages.length > 0
      ? config.journey.stages
      : defaultStages;

  // Format participant greeting using organizer template & {name} placeholder
  const formatGreeting = (heading, name) => {
    const displayName = name && name.trim() !== "" ? name.trim() : "Coder";
    if (!heading) return `Congratulations, ${displayName}!`;

    // 1. Explicit placeholder replacement ({name}, {participantName}, {candidateName})
    if (/\{name\}|\{participantName\}|\{candidateName\}/i.test(heading)) {
      return heading.replace(/\{name\}|\{participantName\}|\{candidateName\}/gi, displayName);
    }

    // 2. If name is available and heading contains "CODER" or "Coder"
    if (name && name.trim() !== "" && /coder/i.test(heading)) {
      return heading.replace(/coder/gi, displayName);
    }

    // 3. If heading starts with "Congratulations"
    if (name && name.trim() !== "" && /^congratulations/i.test(heading.trim())) {
      return `Congratulations, ${name.trim()}!`;
    }

    return heading;
  };

  const greetingText = formatGreeting(mainHeading, candidateName);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          icon: "✓",
          text: "COMPLETED",
          badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        };
      case "cleared":
        return {
          icon: "✓",
          text: "CLEARED",
          badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        };
      case "current":
        return {
          icon: "●",
          text: "YOU ARE HERE",
          badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(5,150,105,0.35)] animate-pulse",
        };
      default:
        return {
          icon: "○",
          text: "UPCOMING",
          badgeClass: "bg-slate-800/40 text-slate-400 border-slate-700/40",
        };
    }
  };

  return (
    <div
      className={`relative min-h-screen text-slate-100 font-expert select-none flex flex-col justify-between overflow-x-hidden transition-all duration-700 ${
        isPreview ? "rounded-2xl border border-line p-4 sm:p-6 shadow-2xl" : "p-4 sm:p-8"
      }`}
      style={{
        backgroundColor: backgroundColor,
        backgroundImage: `radial-gradient(circle at 50% 15%, ${primaryColor}20 0%, transparent 65%), radial-gradient(circle at 80% 85%, #05966910 0%, transparent 55%)`,
      }}
    >
      {/* Ambient Background Grid Effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[160px] opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />
      </div>

      {/* Top Navigation Bar Branding */}
      {!isPreview && (
        <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between py-2 border-b border-line/30 mb-2">
          <VidyoraLogo size="sm" to="#" className="shrink-0" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface border border-line text-[11px] font-sans font-semibold tracking-wider text-ink-secondary">
            <span>OFFICIAL ASSESSMENT LOBBY</span>
          </div>
        </header>
      )}

      {/* Main Centered Content Area */}
      <div className="relative z-10 max-w-4xl w-full mx-auto flex flex-col items-center text-center my-auto py-4">
        
        {/* 🌟 CENTERED CSI / EVENT LOGO CONTAINER (NO MULTI-COLOR CONIC RINGS) */}
        <div
          className={`relative flex flex-col items-center justify-center my-3 transition-all duration-1000 transform ${
            mounted ? "translate-y-0 opacity-100 scale-100" : "translate-y-6 opacity-0 scale-90"
          }`}
        >
          <div className="relative group cursor-pointer animate-float-logo">
            {/* Subtle soft backdrop glow matching primary theme color only */}
            <div
              className="absolute -inset-4 rounded-full opacity-20 blur-xl"
              style={{ backgroundColor: primaryColor }}
            />

            {/* Clean, professional circular logo container */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white p-3.5 flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.4)] border border-slate-200/30 backdrop-blur-md transition-all duration-500 group-hover:scale-105">
              <img
                src={logo}
                alt={eventName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/csi-logo.png";
                }}
              />
            </div>
          </div>

          {/* Clean, Professional Organization Name Text (NO AI green dots or cyan mono fonts) */}
          {eventName && (
            <div className="mt-4 font-sans font-bold text-xs sm:text-sm tracking-[0.2em] text-slate-200 uppercase">
              {eventName}
            </div>
          )}
        </div>

        {/* 2. Main Hero Greetings */}
        <div
          className={`transition-all duration-700 delay-150 transform ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-1 mb-2 font-display bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-300">
            {greetingText}
          </h1>

          {subHeading && (
            <p className="text-base sm:text-xl font-bold tracking-wider text-emerald-400 uppercase font-sans mb-3">
              {subHeading}
            </p>
          )}

          {description && (
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed mb-5 font-normal">
              {description}
            </p>
          )}
        </div>

        {/* 3. Motivational Callout Banner */}
        {motivationalHeading && (
          <div
            className={`w-full max-w-xl my-3 py-3 px-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg transition-all duration-700 delay-300 transform ${
              mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <span className="text-xs sm:text-sm font-sans font-bold tracking-widest text-amber-400 uppercase flex items-center justify-center gap-2">
              <span>⚡</span>
              <span>{motivationalHeading}</span>
            </span>
          </div>
        )}

        {/* 4. Selection Journey Component */}
        {showJourney && journeyStages.length > 0 && (
          <div
            className={`w-full max-w-3xl my-5 transition-all duration-700 delay-400 transform ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <div className="text-xs font-sans font-bold tracking-widest text-slate-400 uppercase mb-3 text-center">
              Candidate Selection Pipeline
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {journeyStages.map((stage, idx) => {
                const badge = getStatusBadge(stage.status);
                const isCurrent = stage.status?.toLowerCase() === "current";

                return (
                  <div
                    key={idx}
                    className={`relative p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-between text-center gap-2 backdrop-blur-md ${
                      isCurrent
                        ? "bg-slate-900/90 border-emerald-500/70 shadow-[0_0_20px_rgba(5,150,105,0.25)] scale-[1.03]"
                        : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold font-sans text-slate-200 tracking-wide">
                      {stage.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold border ${badge.badgeClass}`}
                    >
                      <span>{badge.icon}</span>
                      <span>{badge.text}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Pillars / Skill Cards */}
        {showPillars && pillarsList.length > 0 && (
          <div
            className={`grid grid-cols-${Math.min(pillarsList.length, 4)} gap-3 sm:gap-6 w-full max-w-2xl my-4 transition-all duration-700 delay-500 transform ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            {pillarsList.map((pillar, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md text-center hover:border-emerald-500/40 transition-all hover:-translate-y-1"
              >
                <span className="text-2xl sm:text-3xl block mb-1">{pillar.icon || "📌"}</span>
                <span className="text-[11px] sm:text-xs font-sans font-bold text-slate-200 block uppercase tracking-wider">
                  {pillar.title}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">
                  {pillar.description}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 6. Challenge Banner & Tagline */}
        <div
          className={`my-3 transition-all duration-700 delay-600 transform ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          {eventTitle && (
            <span className="text-xs font-sans font-semibold tracking-widest text-slate-400 uppercase block mb-1">
              {eventName} × VIDYORA
            </span>
          )}

          {challengeLabel && (
            <h2 className="text-lg sm:text-2xl font-black font-display tracking-tight text-white uppercase mb-1">
              {challengeLabel}
            </h2>
          )}

          {tagline && (
            <p className="text-xs sm:text-sm font-sans font-bold tracking-widest text-emerald-400 uppercase">
              {tagline}
            </p>
          )}
        </div>

        {/* 7. Call-to-Action Primary Button */}
        <div
          className={`mt-4 w-full max-w-sm transition-all duration-700 delay-700 transform ${
            mounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={onContinue}
            className="btn-animate btn-border-glow group relative w-full py-4 px-8 rounded-2xl text-base sm:text-lg font-sans font-extrabold tracking-wider text-white overflow-hidden shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 0 30px ${primaryColor}60`,
            }}
          >
            {/* Shimmer / Glow Overlay */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              <span>{primaryButtonText}</span>
            </span>
          </button>
        </div>

        {/* 8. Footer Note */}
        {footerText && (
          <p
            className={`mt-6 text-xs font-sans text-slate-400 tracking-wider transition-all duration-700 delay-750 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            🚀 {footerText}
          </p>
        )}
      </div>

      {/* Vidyora Branding Footer Accent */}
      <div className="relative z-10 text-center py-2 text-[10px] font-sans font-medium text-slate-500 tracking-widest uppercase">
        Powered by Vidyora Assessment Platform
      </div>
    </div>
  );
}
