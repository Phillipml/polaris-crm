import { APP_THEME_STORAGE_KEY } from "./constants";

/**
 * Executa antes da hidratação: só ajusta o DOM se houver preferência em localStorage.
 * Caso contrário, mantém `data-theme` vindo do SSR (cookie / Client Hint).
 * Também grava cookie para alinhar próximos requests ao valor do storage.
 */
export function getThemeBootstrapScript(): string {
  return `(function(){try{var k=${JSON.stringify(APP_THEME_STORAGE_KEY)};var s=localStorage.getItem(k);if(s==="light"||s==="dark"){document.documentElement.setAttribute("data-theme",s);document.cookie=k+"="+encodeURIComponent(s)+";path=/;max-age=31536000;SameSite=Lax";}}catch(e){}})();`;
}
