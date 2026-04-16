import { cookies, headers } from "next/headers";
import { APP_THEME_STORAGE_KEY } from "./constants";
import type { Theme } from "./types";

/**
 * Tema inicial no servidor: cookie (toggle) ou Client Hint (primeira visita).
 * Mantém o HTML alinhado ao que o browser tende a pintar, reduzindo hidratação quebrada.
 */
export async function getServerTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(APP_THEME_STORAGE_KEY)?.value;
  if (fromCookie === "light" || fromCookie === "dark") {
    return fromCookie;
  }

  const headerList = await headers();
  const ch = headerList.get("sec-ch-prefers-color-scheme");
  if (ch === "dark" || ch === "light") {
    return ch;
  }

  return "light";
}
