# Capriche | Central de Marketing

MVP web para acompanhamento do plano inicial de marketing da Capriche Limpeza.

## Objetivo

Separar claramente duas frentes:

- **Conteúdo**: presença, autoridade, prova, processo e relacionamento.
- **Meta Ads**: mídia paga com foco em gerar conversas e oportunidades comerciais.

## Módulos

1. **Visão Geral** — progresso, próximos conteúdos e pendências da Luciana.
2. **Conteúdo** — calendário de 20 dias com filtros, status, briefing, copy e CTA.
3. **Materiais** — checklist do que a Capriche precisa enviar para destravar produção e anúncios.
4. **Campanhas** — plano inicial 100% Meta Ads, com etapas e ângulos de criativo.
5. **Resultados** — inputs simples e cálculo de CPC, custo por conversa, CPL e custo por oportunidade.
6. **Banco de Ideias** — pautas futuras com status.

## Tecnologia

Projeto propositalmente simples para GitHub Pages:

- HTML
- CSS
- JavaScript
- LocalStorage para o MVP

Não existe processo de build.

## Publicação no GitHub Pages

1. Criar um repositório chamado `capriche-central-marketing`.
2. Enviar os arquivos deste diretório para a branch `main`.
3. Em **Settings > Pages**:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
4. Salvar.

URL esperada:

`https://jeanmaisideias.github.io/capriche-central-marketing/`

## Persistência de dados

Nesta primeira versão, os status são salvos no navegador via `localStorage`.

Isso é ótimo para avaliação e protótipo, mas **não sincroniza** automaticamente entre o computador da Luciana e a Mais Ideias.

### Próxima etapa recomendada

Após validar a experiência, conectar o sistema ao Supabase para:

- login;
- dados compartilhados;
- observações em tempo real;
- histórico por mês;
- anexos/links de materiais;
- métricas centralizadas;
- permissões Cliente x Mais Ideias.

## Base do ciclo

Período: **15/09/2026 a 15/10/2026**

- Meta Ads: **R$ 950**
- Gestão: **R$ 1.000**
- Total mensal: **R$ 1.950**
- Conteúdo: 20 dias de calendário
- Foco comercial: construtoras, indústrias e grandes empresas/redes de Joinville e região próxima.

---

Estratégia e gestão: **Mais Ideias MKT**
