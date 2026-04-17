# 83 — Página do lead: sem flash de “não encontrado” durante resolução do workspace

## Problema

Com `workspaceId` ainda `null` enquanto `useResolvedWorkspaceId` validava o `localStorage`, o efeito `loadLead` encerrava com `setIsLoadingLead(false)` sem buscar o lead. A UI tratava `!isLoadingLead && !lead` como “Lead não encontrado” antes do fetch real.

## Ajuste

- **`web/src/app/leads/[id]/page.tsx`**: uso de **`isResolving`**; se não há `workspaceId` mas a resolução ainda está em andamento, mantém **`isLoadingLead` true** e não conclui o carregamento; mensagem neutra quando não há workspace após resolver; erros de carregamento ou ID inválido em um bloco único com **`errorMessage`** ou fallback “Lead não encontrado” apenas quando há workspace e UUID válidos sem erro explícito.
