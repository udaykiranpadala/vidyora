import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserMenu() {
  const { organizer, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!organizer) return null;

  const initial = (organizer.username || organizer.email || "?")[0].toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-line hover:bg-card transition-colors cursor-pointer"
      >
        <span className="w-8 h-8 rounded-full bg-accent text-white text-sm font-semibold flex items-center justify-center">
          {initial}
        </span>
        <span className="text-sm font-medium text-ink hidden sm:block max-w-[120px] truncate">
          {organizer.username}
        </span>
        <svg className="w-4 h-4 text-ink-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-xl shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-line">
            <p className="text-sm font-semibold text-ink truncate">{organizer.username}</p>
            {organizer.email && (
              <p className="text-xs text-ink-secondary truncate mt-0.5">{organizer.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); navigate("/dashboard"); }}
            className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-card transition-colors cursor-pointer"
          >
            Organizer Hub
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger-soft transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
