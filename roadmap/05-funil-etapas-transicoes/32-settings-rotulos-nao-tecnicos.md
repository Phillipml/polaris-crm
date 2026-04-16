# 32 — Rótulos legíveis nas telas de configuração (campos e obrigatoriedades)

## Contexto

Em `/settings/stage-required-fields` e `/settings/lead-fields` a interface expunha termos de modelo de dados (`field_kind`, `field_key`, `key`, `label`, `type`, `standard`/`custom`), pouco claros para quem não é desenvolvedor.

## O que foi feito

- **Obrigatoriedades por etapa:** import de `STANDARD_LEAD_FIELD_LABELS`, labels “Tipo de campo” / “Qual campo”, opções “Campo padrão do lead” e “Campo personalizado”, selects e tabela mostrando nomes amigáveis (padrão via mapa; personalizado via `label` das definições). Descrição do card reescrita em linguagem de uso.
- **Campos do lead:** labels “Identificador interno”, “Nome na tela”, “Tipo de resposta”; textos de ajuda e descrição do card; cabeçalhos da tabela alinhados; coluna de tipo com rótulos em português (incl. “Sim ou não”, “Lista de opções”); mensagens de validação sem jargão “key”; identificador na tabela com estilo secundário em vez de destaque tipo código.

## Resultado

As duas configurações passam a falar em linguagem de negócio, mantendo os mesmos valores persistidos no banco.
