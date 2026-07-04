import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import UserMenu from "./UserMenu";
import Button from "./Button";
import { VidyoraLogo } from "./VidyoraLogo";

export default function Navbar() {
  const { organizer } = useAuth();
  const location = useLocation();
  const isAuthPage = ["/login", "/signup"].includes(location.pathname);

  const { theme, setTheme, themeLabel } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  useEffect(() => {
    const handleOuterClick = () => {
      setThemeDropdownOpen(false);
    };
    window.addEventListener("click", handleOuterClick);
    return () => window.removeEventListener("click", handleOuterClick);
  }, []);

  const navLinks = organizer
    ? [
        { to: "/dashboard", label: "Organizer Hub" },
        { to: "/join", label: "Join Exam", external: false },
      ]
    : [
        { to: "/join", label: "Join Exam" },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <VidyoraLogo />
          {!isAuthPage && (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors hover:text-accent ${
                    location.pathname === link.to ? "text-accent" : "text-ink-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Dropdown */}
          <div className="relative">
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                setThemeDropdownOpen(!themeDropdownOpen);
              }}
              className="px-3.5 py-1.5 border border-line bg-card hover:bg-line/10 rounded-full flex items-center gap-1.5 text-ink-secondary hover:text-ink relative transition-colors cursor-pointer text-xs font-semibold"
              title="Switch Theme"
            >
              <span>Theme: <span className="capitalize text-accent font-bold">{themeLabel[theme] || theme}</span></span>
              <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {themeDropdownOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2.5 w-40 bg-surface border border-line rounded-2xl shadow-xl p-2 flex flex-col gap-1 z-50 overflow-hidden text-left"
              >
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary px-3 py-1.5 border-b border-line/40">Select Theme</h3>
                {["dark", "light", "bright"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTheme(t);
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                      theme === t ? "bg-accent/10 text-accent font-bold" : "text-ink-secondary hover:bg-card hover:text-ink"
                    }`}
                  >
                    <span>{themeLabel[t]}</span>
                    {theme === t && <span className="text-accent font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {organizer ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="px-3.5 py-2 text-sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button 
                  variant="primary" 
                  className="px-3.5 py-2 text-sm !bg-[#194AC6] hover:!bg-[#153BA0] active:scale-95 transition-all"
                  glowColor="25, 74, 198"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { VidyoraLogo };
