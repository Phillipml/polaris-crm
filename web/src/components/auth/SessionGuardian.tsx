"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const INACTIVITY_LIMIT_MS = 1000 * 60 * 120;
const ACTIVITY_KEY = "polaris.auth.lastActivityAt";
const CHECK_INTERVAL_MS = 30000;

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/email-confirmation-pending" ||
    pathname === "/auth/reset-password" ||
    pathname === "/accept-invite"
  );
}

function parseTimestamp(raw: string | null): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
}

export function SessionGuardian() {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = useMemo(() => isPublicPath(pathname), [pathname]);
  const isSigningOutRef = useRef(false);
  const lastActivityAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    async function signOutForInactivity() {
      if (isSigningOutRef.current) {
        return;
      }
      isSigningOutRef.current = true;
      await supabase.auth.signOut();
      localStorage.removeItem(ACTIVITY_KEY);
      router.replace("/login?timeout=1");
    }

    async function ensureSessionOrRedirect() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!isPublicRoute) {
          const next = `${window.location.pathname}${window.location.search}`;
          router.replace(`/login?next=${encodeURIComponent(next)}`);
        }
        return;
      }

      const stored = parseTimestamp(localStorage.getItem(ACTIVITY_KEY));
      lastActivityAtRef.current = stored;
      if (Date.now() - stored >= INACTIVITY_LIMIT_MS) {
        await signOutForInactivity();
      }
    }

    void ensureSessionOrRedirect();

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(ACTIVITY_KEY);
        if (!isPublicRoute) {
          const next = `${window.location.pathname}${window.location.search}`;
          router.replace(`/login?next=${encodeURIComponent(next)}`);
        }
        return;
      }

      if (!session) {
        return;
      }

      const now = Date.now();
      lastActivityAtRef.current = now;
      localStorage.setItem(ACTIVITY_KEY, String(now));
    });

    return () => {
      authSub.subscription.unsubscribe();
    };
  }, [isPublicRoute, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    const touch = () => {
      const now = Date.now();
      lastActivityAtRef.current = now;
      localStorage.setItem(ACTIVITY_KEY, String(now));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ACTIVITY_KEY) {
        return;
      }
      lastActivityAtRef.current = parseTimestamp(event.newValue);
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, touch, { passive: true })
    );
    window.addEventListener("storage", handleStorage);

    const intervalId = window.setInterval(async () => {
      if (isPublicRoute || isSigningOutRef.current) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        const next = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      if (Date.now() - lastActivityAtRef.current >= INACTIVITY_LIMIT_MS) {
        isSigningOutRef.current = true;
        await supabase.auth.signOut();
        localStorage.removeItem(ACTIVITY_KEY);
        router.replace("/login?timeout=1");
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("storage", handleStorage);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, touch)
      );
    };
  }, [isPublicRoute, router]);

  return null;
}
