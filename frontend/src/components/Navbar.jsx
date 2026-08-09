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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              className="px-3 py-1.5 border border-line bg-card hover:bg-line/10 rounded-full flex items-center gap-1 text-ink-secondary hover:text-ink relative transition-colors cursor-pointer text-xs font-semibold"
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
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="px-3 py-1.5 text-xs">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button 
                  variant="primary" 
                  className="px-3 py-1.5 text-xs !bg-[#194AC6] hover:!bg-[#153BA0] active:scale-95 transition-all"
                  glowColor="25, 74, 198"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-line bg-card text-ink-secondary hover:text-ink"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-surface p-4 flex flex-col gap-3">
          {!isAuthPage && navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-medium py-1.5 transition-colors ${
                location.pathname === link.to ? "text-accent font-bold" : "text-ink-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {!organizer && (
            <div className="flex flex-col gap-2 pt-2 border-t border-line">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full py-2 text-xs font-semibold">Log in</Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full py-2 text-xs font-semibold !bg-[#194AC6]">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export { VidyoraLogo };
