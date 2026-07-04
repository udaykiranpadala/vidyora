import { useTheme } from "../context/ThemeContext";

const ICONS = { dark: "🌙", light: "☀️", bright: "✨" };

export default function ThemeToggle({ className = "" }) {
  const { theme, cycleTheme, themeLabel } = useTheme();

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-line rounded-lg hover:bg-card transition-colors cursor-pointer ${className}`}
      title={`Theme: ${themeLabel[theme]}. Click to switch.`}
    >
      <span>{ICONS[theme]}</span>
      <span className="hidden sm:inline">{themeLabel[theme]}</span>
    </button>
  );
}
