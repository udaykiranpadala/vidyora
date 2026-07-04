import { createContext, useContext, useEffect, useState } from "react";

const THEMES = ["dark", "light", "bright"];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("vidyora-theme");
    return THEMES.includes(saved) ? saved : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "bright");
    if (theme === "light") root.classList.add("light");
    if (theme === "bright") root.classList.add("bright");
    localStorage.setItem("vidyora-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "vidyora-theme" && THEMES.includes(e.newValue)) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const cycleTheme = () => {
    setTheme((prev) => {
      const idx = THEMES.indexOf(prev);
      return THEMES[(idx + 1) % THEMES.length];
    });
  };

  const themeLabel = { dark: "Dark", light: "Light", bright: "Bright" };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themeLabel }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
