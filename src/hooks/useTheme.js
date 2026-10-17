import { useEffect, useState } from "react";

const STORAGE_KEY = "bahati-portfolio-theme";

function resolveInitialTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useTheme() {
  const [theme, setActiveTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setActiveTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const setTheme = (nextTheme) => {
    setActiveTheme(nextTheme === "light" ? "light" : "dark");
  };

  return {
    setTheme,
    theme,
    toggleTheme,
  };
}
