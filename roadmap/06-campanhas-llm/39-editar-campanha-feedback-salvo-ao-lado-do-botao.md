# 39 — Editar campanha: feedback de salvo ao lado do botão

## Ação

- `CampaignForm` aceita `successMessage` opcional e exibe o texto ao lado do botão de envio, com `aria-live="polite"` no agrupamento.
- `settings/campaigns/[id]/page.tsx` deixa de renderizar a mensagem no topo do formulário e repassa o estado para o formulário.

## Escopo de commit sugerido

- `web/src/components/campaigns/CampaignForm.tsx`
- `web/src/app/settings/campaigns/[id]/page.tsx`
- `roadmap/06-campanhas-llm/39-editar-campanha-feedback-salvo-ao-lado-do-botao.md`
