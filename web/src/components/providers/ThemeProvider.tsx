"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { APP_THEME_STORAGE_KEY } from "@/lib/theme/constants";
import type { Theme } from "@/lib/theme/types";

export type { Theme } from "@/lib/theme/types";

function readThemeFromDom(): Theme {
  const v = document.documentElement.getAttribute("data-theme");
  return v === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(APP_THEME_STORAGE_KEY, theme);
    const cookie = `${APP_THEME_STORAGE_KEY}=${encodeURIComponent(theme)};path=/;max-age=31536000;SameSite=Lax`;
    document.cookie = cookie;
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("polaris-theme"));
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useLayoutEffect(() => {
    setThemeState(readThemeFromDom());
  }, []);

  useLayoutEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === APP_THEME_STORAGE_KEY &&
        (e.newValue === "light" || e.newValue === "dark")
      ) {
        document.documentElement.setAttribute("data-theme", e.newValue);
        setThemeState(e.newValue);
      }
    };
    const onPolarisTheme = () => setThemeState(readThemeFromDom());
    window.addEventListener("storage", onStorage);
    window.addEventListener("polaris-theme", onPolarisTheme);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("polaris-theme", onPolarisTheme);
    };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = readThemeFromDom() === "dark" ? "light" : "dark";
    setTheme(next);
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }
  return ctx;
}
