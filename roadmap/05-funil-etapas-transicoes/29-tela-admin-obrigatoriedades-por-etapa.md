# 29 - Tela admin de obrigatoriedades por etapa com preset

## Ação realizada

Foi implementada a tela de administração de regras por etapa em:

- `web/src/app/settings/stage-required-fields/page.tsx`

Principais pontos:

- acesso restrito a perfis `owner` e `admin` do workspace atual
- seleção da etapa do funil para edição das regras
- CRUD de `stage_required_fields` (`field_kind` e `field_key`)
- suporte a `field_kind` `standard` e `custom`
- botão de preset: **“Aplicar exemplo Lead Mapeado”**

Também foram adicionados:

- serviço `web/src/lib/stage-required-fields/stage-required-fields-service.ts`
- hook `web/src/hooks/use-stage-required-fields.ts`
- tipagem de `stage_required_fields` em `web/src/lib/supabase/database.types.ts`

A navegação para a nova tela foi ligada no dashboard e em settings de campos customizados.
