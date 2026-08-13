import { useEffect, useRef, useState } from "react";

// questionKey should change every time a new question loads, so the timer resets.
export default function Timer({ totalSeconds, questionKey, onExpire, className = "", compact = false }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    try {
      const saved = localStorage.getItem(`timer_left_${questionKey}`);
      if (saved !== null) {
        return parseInt(saved, 10);
      }
    } catch (e) {
      console.error(e);
    }
    return totalSeconds;
  });
  
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    let initialSecs = totalSeconds;
    try {
      const saved = localStorage.getItem(`timer_left_${questionKey}`);
      if (saved !== null) {
        initialSecs = parseInt(saved, 10);
      }
    } catch (e) {
      console.error(e);
    }
    setSecondsLeft(initialSecs);
    hasExpiredRef.current = false;
  }, [questionKey, totalSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextVal = prev - 1;
        try {
          localStorage.setItem(`timer_left_${questionKey}`, String(Math.max(0, nextVal)));
        } catch (e) {
          console.error(e);
        }
        
        if (nextVal <= 0) {
          clearInterval(interval);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return nextVal;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [questionKey, secondsLeft]);

  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const isLow = secondsLeft <= 30;

  const formatDisplay = () => {
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const padStyles = compact
    ? "px-2 py-1 rounded-lg text-[11px] gap-1"
    : "px-3.5 py-1.5 rounded-xl text-xs gap-2";

  return (
    <div
      className={`flex items-center font-mono font-semibold border transition-colors ${padStyles} ${
        isLow ? "bg-danger-soft border-danger text-danger animate-pulse" : "bg-card border-line text-ink"
      } ${className}`}
      title="Question Time Remaining"
    >
      <span className={compact ? "text-[10px]" : "text-xs"}>⏱</span>
      <span>{formatDisplay()}</span>
    </div>
  );
}
