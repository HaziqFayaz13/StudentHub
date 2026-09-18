import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

function getPreferredTheme() {
  const saved = localStorage.getItem("studenthub-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("studenthub-theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      setTheme,
      chart: theme === "dark"
        ? {
            grid: "#243049",
            text: "#9aa8c2",
            indigo: "#818cf8",
            teal: "#2dd4bf",
            amber: "#fbbf24",
            rose: "#fb7185",
            surface: "#151d2e",
          }
        : {
            grid: "#e8edf6",
            text: "#64748b",
            indigo: "#4f46e5",
            teal: "#0d9488",
            amber: "#d97706",
            rose: "#e11d48",
            surface: "#ffffff",
          },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
