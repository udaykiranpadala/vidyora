import { useEffect, useCallback, useRef } from "react";
import { attemptApi } from "../api/attempts";

// Enforces fullscreen and tracks tab-switch / fullscreen-exit events,
// logging each occurrence to the backend for the organizer to review later.
export default function useAntiCheat(attemptId, enabled) {
  const hasEnteredFullscreen = useRef(false);

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        // user may have denied or browser blocked it - we still proceed,
        // exit detection below just won't fire meaningfully without it
      });
      hasEnteredFullscreen.current = true;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !attemptId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        attemptApi.logEvent(attemptId, "tab_switch").catch(() => {});
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && hasEnteredFullscreen.current) {
        attemptApi.logEvent(attemptId, "fullscreen_exit").catch(() => {});
      }
    };

    // Disable right-click context menu (weak deterrent, standard practice)
    const handleContextMenu = (e) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [attemptId, enabled]);

  return { requestFullscreen };
}
