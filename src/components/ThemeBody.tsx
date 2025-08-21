"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ThemeBody({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const theme = user?.theme || "light";

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    }
  }, [theme]);

  return <>{children}</>;
}
