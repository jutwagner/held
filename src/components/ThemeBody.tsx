"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ThemeBody({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<string>("light");

  // Get theme from user or default to light
  const theme = user?.theme || "light";

  // Update current theme when user theme changes
  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  // Apply theme to document body
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (currentTheme === "dark") {
        document.body.classList.add("dark");
        document.documentElement.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
        document.documentElement.classList.remove("dark");
      }
    }
  }, [currentTheme]);

  // Listen for theme changes from settings (immediate updates)
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail.theme;
      setCurrentTheme(newTheme);
    };

    if (typeof window !== "undefined") {
      window.addEventListener('theme-change', handleThemeChange as EventListener);
      return () => {
        window.removeEventListener('theme-change', handleThemeChange as EventListener);
      };
    }
  }, []);

  return <>{children}</>;
}

