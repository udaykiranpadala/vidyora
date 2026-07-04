import { Link } from "react-router-dom";
import logoImg from "../assets/logo.png";

/**
 * VidyoraIcon — renders the custom emblem image.
 * Uses object-fit: contain to ensure it scales correctly.
 */
export function VidyoraIcon({ className = "w-9 h-9", ...props }) {
  return (
    <img
      src={logoImg}
      alt="Vidyora Logo Icon"
      className={className}
      style={{ display: "block", objectFit: "contain", flexShrink: 0, ...props.style }}
      {...props}
    />
  );
}

/**
 * VidyoraLogo — renders the custom emblem icon and the "VIDYORA" text next to it.
 */
export function VidyoraLogo({
  className = "",
  showText = true,
  size = "md",
  iconColorClass = "text-accent", // Kept for compatibility
  to = "/"
}) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const textSizes = {
    sm: "text-base tracking-wide",
    md: "text-xl tracking-wider",
    lg: "text-2xl tracking-widest",
    xl: "text-3xl tracking-widest",
  };

  const content = (
    <>
      <VidyoraIcon
        className={`${iconSizes[size] || iconSizes.md} group-hover:scale-105 transition-transform duration-200`}
      />
      {showText && (
        <span className={`font-display ${textSizes[size] || textSizes.md} font-extrabold text-ink uppercase`}>
          VIDYORA
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`flex items-center gap-2.5 group ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {content}
    </div>
  );
}
