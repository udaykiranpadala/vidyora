import React from "react";

/**
 * LightningLoader - Dribbble-style energetic lightning pre-loader
 * Custom tailored for Vidyora's dark charcoal & emerald brand palette.
 */
export default function LightningLoader({
  fullScreen = true,
  text = "LOADING VIDYORA...",
  size = "md", // 'sm', 'md', 'lg'
  className = "",
}) {
  const sizeMap = {
    sm: { container: "w-12 h-12", bolt: "w-6 h-6", text: "text-[10px]" },
    md: { container: "w-24 h-24", bolt: "w-12 h-12", text: "text-xs" },
    lg: { container: "w-36 h-36", bolt: "w-20 h-20", text: "text-sm" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center gap-5 ${className}`}>
      {/* Central Lightning Bolt Container with Radial Glow */}
      <div className={`relative flex items-center justify-center ${currentSize.container}`}>
        
        {/* Soft Radial Ambient Aura Glow */}
        <div 
          className="absolute inset-0 rounded-full animate-lightning-aura opacity-75 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(250, 204, 21, 0.38) 0%, rgba(16, 185, 129, 0.22) 45%, transparent 75%)",
            filter: "blur(20px)",
          }}
        />

        {/* Outer Electric Pulse Ring */}
        <div 
          className="absolute inset-0 rounded-full border border-yellow-400/25 animate-ping opacity-30 pointer-events-none"
          style={{ animationDuration: "2.5s" }}
        />

        {/* Floating Sparks */}
        <div className="absolute -top-1 right-2 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-spark-1 shadow-[0_0_8px_#facc15]" />
        <div className="absolute bottom-1 -left-2 w-1 h-1 rounded-full bg-emerald-400 animate-spark-2 shadow-[0_0_6px_#10b981]" />
        <div className="absolute top-1/2 -right-3 w-1 h-1 rounded-full bg-amber-400 animate-spark-3 shadow-[0_0_6px_#f59e0b]" />

        {/* Lightning Bolt SVG Icon */}
        <div className="relative z-10 animate-lightning-flash">
          <svg
            viewBox="0 0 24 24"
            className={`${currentSize.bolt} filter drop-shadow-[0_0_14px_rgba(250,204,21,0.9)] drop-shadow-[0_0_28px_rgba(16,185,129,0.55)]`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Gold & Emerald Energy Gradient */}
              <linearGradient id="vidyoraLightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF59D" />
                <stop offset="30%" stopColor="#FACC15" />
                <stop offset="70%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              {/* Stroke glow filter */}
              <filter id="lightningGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Electric Outline Path */}
            <path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              stroke="#FACC15"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-lightning-stroke opacity-60"
            />

            {/* Filled Electric Lightning Bolt */}
            <path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill="url(#vidyoraLightningGrad)"
              stroke="#FFF59D"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lightningGlow)"
            />
          </svg>
        </div>
      </div>

      {/* Brand & Loading Label */}
      {text && (
        <div className="flex flex-col items-center gap-2 text-center select-none">
          <div className={`font-mono font-extrabold tracking-[0.25em] uppercase ${currentSize.text} bg-gradient-to-r from-yellow-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent`}>
            {text}
          </div>
          {/* Electric Progress Line */}
          <div className="w-28 h-0.5 bg-line/60 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-yellow-400 via-emerald-400 to-accent animate-lightning-bar rounded-full" />
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-paper flex items-center justify-center relative overflow-hidden select-none">
        {/* Ambient radial vignette backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.04)_0,rgba(5,150,105,0.03)_40%,transparent_70%)] pointer-events-none" />
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}
