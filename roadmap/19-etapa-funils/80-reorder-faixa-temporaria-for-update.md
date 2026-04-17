# 80 — Reordenar etapas: faixa temporária alta + bloqueio de linhas

## Problema

Ainda ocorria `duplicate key value violates unique constraint "funnel_stages_workspace_id_position_key"` ao usar Subir/Descer, mesmo com fase de posições negativas, em alguns cenários (dados legados, ordem de avaliação do `UPDATE` ou concorrência).

## Solução

Nova migração `20260420100000_funnel_stages_reorder_shift_lock.sql` substitui `reorder_funnel_stages` por:

1. `SELECT … FOR UPDATE` em todas as linhas de `funnel_stages` do workspace (serializa reordenação concorrente).
2. Primeiro `UPDATE`: `position = (max(position) + 100000) + ordem` (faixa temporária sempre acima das posições atuais e sequência única).
3. Segundo `UPDATE`: `position = ordem` final (1…N).

## Deploy

`npx supabase@latest db push` no projeto linkado.
