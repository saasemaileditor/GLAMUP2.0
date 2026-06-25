"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setThemeState(savedTheme);
  }, []);

  const setTheme = (newTheme) => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.add("disable-transitions");
      setTimeout(() => {
        document.documentElement.classList.remove("disable-transitions");
      }, 50);
    }
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const resolvedTheme = theme;

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both classes first
    root.classList.remove("light", "dark");
    // Add active class
    root.classList.add(resolvedTheme);
    
    // Set color scheme style/meta property
    root.style.colorScheme = resolvedTheme;
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
