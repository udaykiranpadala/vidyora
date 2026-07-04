import { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";

const DEFAULT_GLOW_COLOR = "5, 150, 105"; // Accent green default

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement("span");
  el.className = "btn-particle";
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 10;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  glowColor = DEFAULT_GLOW_COLOR,
  disabled = false,
  ...props
}) {
  const btnRef = useRef(null);
  const innerRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const particlesInitialized = useRef(false);
  const memoizedParticles = useRef([]);
  const magnetismAnimationRef = useRef(null);

  const base =
    "inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const variants = {
    primary: "bg-accent text-white hover:bg-accent-deep",
    secondary: "bg-surface text-ink border border-line hover:bg-accent-soft",
    ghost: "text-ink hover:bg-accent-soft",
    danger: "bg-danger text-white hover:opacity-90",
  };

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !btnRef.current) return;
    const { width, height } = btnRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: 6 }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: "back.in(1.7)",
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        },
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!btnRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !btnRef.current) return;

        const clone = particle.cloneNode(true);
        btnRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(1.7)" }
        );

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 60,
          rotation: Math.random() * 360,
          duration: 1.5 + Math.random() * 1.5,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(clone, {
          opacity: 0.25,
          duration: 1,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, index * 80);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disabled || !btnRef.current) return;

    const element = btnRef.current;
    
    // Check if user is on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      if (enableStars) {
        animateParticles();
      }

      if (enableSpotlight || enableBorderGlow) {
        element.style.setProperty("--glow-intensity", "1");
      }

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 4,
          rotateY: 4,
          duration: 0.25,
          ease: "power2.out",
          transformPerspective: 800,
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableSpotlight || enableBorderGlow) {
        element.style.setProperty("--glow-intensity", "0");
      }

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.25,
          ease: "power2.out",
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.25,
          ease: "power2.out",
        });
      }
    };

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Update spotlight position
      if (enableSpotlight || enableBorderGlow) {
        const relativeX = (x / rect.width) * 100;
        const relativeY = (y / rect.height) * 100;
        element.style.setProperty("--glow-x", `${relativeX}%`);
        element.style.setProperty("--glow-y", `${relativeY}%`);
      }

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 800,
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.08;
        const magnetY = (y - centerY) * 0.08;

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.2,
          ease: "power2.out",
        });
      }
    };

    const handleClick = (e) => {
      if (!clickEffect || !innerRef.current) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement("span");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.35) 0%, rgba(${glowColor}, 0.15) 35%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 100;
      `;

      innerRef.current.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => ripple.remove(),
        }
      );
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }, [
    disabled,
    animateParticles,
    clearAllParticles,
    enableStars,
    enableSpotlight,
    enableBorderGlow,
    enableTilt,
    enableMagnetism,
    clickEffect,
    glowColor,
  ]);

  const borderGlowClass = enableBorderGlow ? "btn-border-glow" : "";

  return (
    <button
      ref={btnRef}
      disabled={disabled}
      className={`${base} ${variants[variant]} btn-animate ${borderGlowClass} ${className}`}
      style={{ "--glow-color": glowColor }}
      {...props}
    >
      {/* Click effect ripple boundary */}
      <span ref={innerRef} className="btn-inner-container" />
      
      {/* Actual button text/icon child content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
