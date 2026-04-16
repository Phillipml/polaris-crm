# PolarisCRM

## Descrição do projeto

**PolarisCRM** é um CRM focado em **SDR** (prospecção e qualificação de leads). Neste repositório o **MVP front-end** está em `web/`, construído com **Next.js (App Router)**, **TypeScript** e **Tailwind CSS**, com **tema claro/escuro**, shell de layout (`AppShell`, barra superior, componentes de UI base) e preparação para **Supabase** no navegador. Outros pacotes (por exemplo uma API em Node) podem coexistir na raiz do monorepo.

## Tecnologias utilizadas

| Área | Ferramentas / serviços |
|------|-------------------------|
| Framework web | Next.js 15 (App Router), React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4, PostCSS |
| Qualidade | ESLint (config Next), Prettier |
| Backend-as-a-service (cliente) | `@supabase/supabase-js` (cliente browser; variáveis `NEXT_PUBLIC_*`) |
| Versionamento / docs internas | Git; pasta `roadmap/` com entregas incrementais |

## Decisões técnicas

### Por que escolheu determinada estrutura de banco de dados

**Ainda não há esquema de banco versionado neste repositório.** A direção planejada é **PostgreSQL via Supabase** (Row Level Security, políticas por tenant quando o multi-tenancy existir). A escolha de estrutura de tabelas (contas, leads, pipelines, etc.) será documentada aqui quando o modelo for definido e migrado.

### Como estruturou a integração com LLM

**Não aplicável no estado atual do MVP.** Quando houver integração (por exemplo assistente de qualificação ou resumo de conversas), esta seção descreverá: provedor, limites de contexto, onde roda a inferência (edge, servidor dedicado) e como dados sensíveis são filtrados ou anonimizados.

### Como implementou o multi-tenancy

**Ainda não implementado.** A intenção típica para CRM B2B é **isolamento por organização** (`org_id` ou equivalente) no PostgreSQL, com **RLS** no Supabase e claims de JWT alinhados ao tenant. Isso será detalhado após a primeira versão de autenticação e modelo de dados.

### Desafios encontrados e como resolveu

- **Divergência de tema entre SSR e cliente (hidratação):** o tema vinha de `localStorage` / `prefers-color-scheme` no script antes do React, enquanto o servidor não refletia o mesmo estado. **Solução:** tema inicial no servidor via cookie (`getServerTheme`) e headers `Accept-CH` / `Vary` no `next.config.ts`; script de bootstrap só ajusta o DOM quando há valor válido em `localStorage` e sincroniza cookie; `ThemeProvider` recebe `initialTheme` alinhado ao servidor. Detalhes em `roadmap/02-correcao-hidratacao-tema-layout.md`.

## Funcionalidades implementadas

### Obrigatórios (MVP base)

- [x] App Next.js em `web/` com App Router e TypeScript
- [x] Tailwind CSS v4 e estilos globais
- [x] ESLint + Prettier e scripts de formatação
- [x] Tema claro/escuro com persistência (cookie + `localStorage`) e toggle na UI
- [x] Layout shell (`AppShell`, `TopBar`, `ThemeToggle`) e componentes base (`Button`, `Card`)
- [x] Cliente Supabase no browser (`getSupabaseBrowserClient`) e `.env.example` documentado

### Diferenciais / próximos passos (não entregues neste escopo)

- [ ] Autenticação e perfis de usuário
- [ ] Modelo de dados e migrations Supabase
- [ ] Multi-tenancy e RLS
- [ ] Telas de negócio SDR (cadastros, pipeline, tarefas)
- [ ] Integração com LLM

---

## Web (Next.js) — desenvolvimento rápido

Na pasta `web/`:

```bash
cd web
npm install
npm run dev
```

- **App:** http://localhost:3000  

### Variáveis de ambiente (Supabase)

1. Entre na pasta `web/`.
2. Copie `web/.env.example` para `web/.env.local` e ajuste os valores.
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Reinicie o servidor de desenvolvimento.

Mais detalhes: `web/README.md`.

### Scripts úteis (`web/`)

| Comando | Descrição |
|--------|------------|
| `npm run dev` | Next.js em modo desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

### Pastas

- `web/` — Next.js App Router (TypeScript, tema, cliente Supabase no browser)
- `roadmap/` — registro incremental do que foi entregue
