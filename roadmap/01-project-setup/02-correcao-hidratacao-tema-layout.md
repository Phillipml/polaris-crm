# 02 — Correção de hidratação no layout (tema)

## Problema

O script de bootstrap alterava `data-theme` no `<html>` com base em `localStorage` / `prefers-color-scheme` **antes** da hidratação, enquanto o servidor renderizava `<html>` **sem** `data-theme` (ou com valor diferente), gerando divergência SSR ↔ cliente.

## Ajustes

- **`data-theme` no SSR**: `RootLayout` assíncrono usa `getServerTheme()` — cookie `polaris-theme` ou header `Sec-CH-Prefers-Color-Scheme`, com fallback `light`.
- **Script**: só altera o DOM quando existe valor válido em `localStorage` (e sincroniza cookie); caso contrário mantém o tema vindo do servidor.
- **`ThemeProvider`**: recebe `initialTheme` alinhado ao servidor; `applyTheme` grava `localStorage` + **cookie**.
- **`next.config.ts`**: headers `Accept-CH` / `Vary` para o browser enviar preferência de esquema de cores.
- **`next/script`** com `strategy="beforeInteractive"` + **`suppressHydrationWarning`** em `<html>` e `<body>` como rede de segurança.
