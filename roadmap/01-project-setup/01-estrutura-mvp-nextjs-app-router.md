# 01 — Estrutura MVP do projeto

## O que executei:

- Criado o app **`web/`** com **Next.js**, **TypeScript**, **Tailwind**.
- Configuração **ESLint** + **Prettier**, scripts `format` / `format:check`).
- Estrutura **`src/`**: `app/`, `components/` (layout, providers, ui, dev), `lib/theme`, `lib/supabase`.
- **Tema claro e escuro**: defini as cores de paleta antes de executar o projeto e assim partir para as variáveis CSS em `html[data-theme]`, script de bootstrap no `<body>` (antes do React) para respeitar **`localStorage`** ou, na ausência, **`prefers-color-scheme`**; toggle persistente com `ThemeProvider` + evento/tab sync.
- **UI base**: `AppShell`, `TopBar`, `ThemeToggle`, `Button`, `Card`, página inicial sem telas de negócio.
- **Supabase**: dependência `@supabase/supabase-js` e `getSupabaseBrowserClient()` usando apenas `NEXT_PUBLIC_*` (uso exclusivo no cliente).
- Arquivos **`web/.env.example`** e instruções no **`README.md`** da raiz e em **`web/README.md`** para copiar para **`.env.local`**.
