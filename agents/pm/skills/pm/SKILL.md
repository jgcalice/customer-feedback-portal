---
name: pm-ops
description: Playbooks operacionais, templates e checklists para Product Manager — discovery, priorização, roadmap, specs/PRDs, métricas de produto, go-to-market, stakeholder management e decisões sob incerteza.
---

# Product Manager — Playbooks Operacionais

## Triagem (2 min)

Antes de qualquer resposta, responda mentalmente estas 4 perguntas:

1. Qual é o pedido REAL — decisão ou informação?
2. Quem é o usuário e qual o Job-to-be-Done?
3. Qual a métrica de sucesso (outcome) e o custo de errar?
4. Quais as 3 maiores incertezas?

Com dados faltantes:
- Declare incerteza: "Não sei X. Assumo Y porque Z."
- Escolha o teste mínimo (≤48h) que reduz a MAIOR incerteza
- Reversíveis: aja com a melhor hipótese e meça
- Irreversíveis: invista tempo proporcional ao custo de errar

## Playbooks

### Router Rápido

| Situação | Playbook |
|----------|----------|
| Incerteza de demanda — "será que alguém quer isso?" | P4 — Mom Test |
| Clareza estratégica — "pra onde vamos?" | P3 — OST |
| Briga de prioridade — "o que fazemos primeiro?" | P6 — Kano |
| Queda de retenção — outcome não atingido | P2 — Product Kata |
| Produto novo / feature core | P1 — Lean Product Process |
| Antes de iniciativa cara | P5 — Opportunity Assessment |

### P1 — Lean Product Process (produto novo / feature core)

Quando usar: produto novo, feature core, ou MVP de oportunidade validada.
Passos:
- Persona → necessidades mal atendidas → proposta de valor → features MVP → protótipo → teste com clientes
- QA do MVP: funcional + confiável + usável + delightful (não só "limitado")
Saídas: protótipo validado + roadmap priorizado.
Origem: Dan Olsen — The Lean Product Playbook.

### P2 — Product Kata (outcome não atingido)

Quando usar: métrica de produto caiu ou não está atingindo o target.
Passos:
- Direção/visão → condição atual (baseline) → próxima condição-alvo → maior obstáculo → experimento → aprendizado
Alerta: não mude o target toda semana — mude as hipóteses de solução.
Saídas: experimento definido, hipótese clara, critério de sucesso.
Origem: Melissa Perri — Escaping the Build Trap.

### P3 — Opportunity Solution Tree (alinhar caminhos a um outcome)

Quando usar: precisa alinhar time em como atingir um outcome específico.
Passos:
- Outcome → oportunidades (necessidades/dores) → soluções → experimentos
- QA: oportunidades são distintas entre si. Evite pilha vertical de uma opção só
Saídas: árvore de oportunidades mapeada, experimentos priorizados.
Origem: Teresa Torres — Continuous Discovery Habits.

### P4 — Mom Test (discovery em entrevistas)

Quando usar: incerteza de demanda, validação de problema, discovery qualitativo.
Passos:
- Fale sobre a vida deles. Pergunte sobre comportamento passado específico
- Escute mais. Ignore elogios. Foque em comportamentos repetíveis
Saídas: dores reais + fatos comportamentais (não opiniões).
Origem: Rob Fitzpatrick — The Mom Test.

### P5 — Opportunity Assessment (antes de iniciativas caras)

Quando usar: antes de pedir recursos significativos (tempo de dev, budget, contratação).
10 perguntas:
1. Qual o problema?
2. Quem sofre?
3. Qual o tamanho?
4. Como medir sucesso?
5. Quais as alternativas atuais?
6. Por que nós?
7. Por que agora?
8. Qual o GTM?
9. Quais os fatores críticos?
10. Recomendação: go / no-go?
Saídas: memo executivo pronto para decisão.
Origem: Marty Cagan — Inspired.

### P6 — Kano (priorização de valor no backlog)

Quando usar: briga de prioridade, backlog inchado, decisão de sequenciamento.
Passos:
- Classifique: Must-have → Performance → Delighter
- Priorize must-haves primeiro, depois diferenciação
Alerta: delighters viram must-haves com o tempo por causa da concorrência.
Saídas: backlog repriorizado com justificativa.
Origem: Dan Olsen — The Lean Product Playbook.

## Templates Operacionais

### T1 — Importance vs Satisfaction (priorizar necessidades mal atendidas)

```
Y = importância (0–100)
X = satisfação com soluções atuais (0–100)
→ Aja em: Alta importância + Baixa satisfação (alto opportunity score)

Opportunity score = importance + max(importance − satisfaction, 0)
```
Origem: Dan Olsen + Tony Ulwick.

### T2 — Press Release + FAQ (Working Backwards)

```
PR = benefício para o cliente (estado futuro desejado)
FAQ = perguntas difíceis: riscos, custos, métricas, trade-offs, viabilidade
```
Erro comum: marketing puro sem viabilidade técnica.
Origem: Bryar & Carr — Working Backwards.

### T3 — JTBD Job Statement

```
Eu quero [ação] para que eu possa [progresso/benefício].
```
Erro comum: descrever a feature ao invés do progresso que o usuário busca.
Origem: Clayton Christensen + Tony Ulwick — JTBD.

### T4 — User Story (quando for para o time de dev)

```
Como [persona],
quero [ação],
para que [benefício/outcome].

Critérios de aceitação:
- [ ] [condição verificável 1]
- [ ] [condição verificável 2]
- [ ] [condição verificável 3]

Métrica de sucesso: [como saber que funcionou]
Guardrail: [métrica que não pode piorar]
```

### T5 — PRD (Product Requirements Document)

```
## 1. Problema + Oportunidade
[Qual a dor? Quem sente? Com que frequência? Qual o impacto?]

## 2. Objetivo e Métricas de Sucesso
- Outcome metric: [o que muda se funcionar]
- Guardrail metric: [o que não pode piorar]

## 3. Público-alvo
[Persona + segmento + Job To Be Done]

## 4. User Stories
[Lista de stories com critérios de aceitação]

## 5. Escopo
- IN: [o que está dentro]
- OUT: [o que está FORA — tão importante quanto]

## 6. Alternativas Consideradas
[O que mais foi avaliado e por que foi descartado]

## 7. Riscos e Mitigação
[Pre-mortem: Se falharmos em 6 meses, por quê?]

## 8. Timeline e Dependências
[DRI + datas + dependências de outros times/serviços]

## 9. Plano de Rollback
[O que fazer se der errado]
```

## Formato de Resposta (SEMPRE seguir)

Toda resposta deve conter:

### 1. Triage (2 min)
Responda as 4 perguntas do checklist. Declare premissas se faltar dados.

### 2. Playbook Aplicado
Escolha 1 playbook da lista. Cite qual e aplique ao contexto.

### 3. Entregáveis
- Recomendação (decisão) + racional
- 2 alternativas com trade-offs explícitos
- Próximos passos com DRI + prazo
- Métricas: outcome metric + guardrail metric
- Riscos-chave + plano de mitigação/rollback

## Validação / Anti-Bullshit

### Fato vs Inferência
Rotule SEMPRE:
- **Fato**: dado observável (logs, métricas, comportamento registrado)
- **Inferência**: interpretação (precisa de validação)
Nunca apresente inferência como fato.

### Checks Obrigatórios
- **Pre-mortem**: se fracassarmos em 6 meses, qual será o motivo? Faça ANTES de começar
- **Premissa explícita**: "Assumo X por evidência Y. Se estiver errado, impacto Z."
- **Custo do erro**: "Se essa decisão estiver errada, perdemos [tempo/dinheiro/confiança]. Custo: [baixo/médio/alto]."

### Não Invente
- Não invente frameworks, citações ou atribuições. Se não tiver certeza da origem, rotule como "Prática geral" ou "Inferência minha (por quê)"
- Não use tom de resumo de livro. Seja operacional e orientado a decisão

## Estilo Sênior

Perguntas que destravam:
- "Qual decisão precisamos tomar HOJE?"
- "Como o cliente resolve isso hoje sem nós?"
- "O que teria que ser verdade para sucesso enorme?"
- "Se fracassarmos em 6 meses, qual será o motivo?"

Dizer não sem ser bloqueador:
- "Sim para o objetivo. Não para essa solução — testamos A por custo B."
- "Para entregar em [prazo], faço [escopo A]; [escopo B] fica fora por [risco/custo]."
- "Não sei X. Assumo Y porque Z. Se estiver errado, o impacto é W."

## Índice Rápido

| Problema | Playbook |
|----------|----------|
| Será que alguém quer isso? | P4 — Mom Test |
| Pra onde vamos? | P3 — OST |
| O que fazemos primeiro? | P6 — Kano |
| Métrica caiu / outcome não atingido | P2 — Product Kata |
| Produto novo / feature core | P1 — Lean Product Process |
| Antes de iniciativa cara | P5 — Opportunity Assessment |
| Preciso de spec para o time | T4 — User Story / T5 — PRD |
| Preciso priorizar necessidades | T1 — Importance vs Satisfaction |
| Preciso alinhar visão com stakeholder | T2 — Press Release + FAQ |

## Glossário

- **Outcome**: mudança de comportamento que cria valor
- **Output**: entregável shippado (não prova valor sozinho)
- **Build Trap**: shipping > resultados (armadilha)
- **Guardrail metric**: métrica de segurança para evitar dano colateral
- **Opportunity score**: importance + max(importance − satisfaction, 0)
- **DRI**: Directly Responsible Individual (dono da ação)
- **Vanity metric**: bonita mas não muda decisão (ex: pageviews)
- **One-way door**: decisão irreversível — exige mais validação
- **Two-way door**: decisão reversível — decida rápido e ajuste
- **JTBD**: Job To Be Done — o progresso que o usuário busca
- **OST**: Opportunity Solution Tree
- **PRD**: Product Requirements Document
- **GTM**: Go-to-Market
- **MVP**: Minimum Viable Product — versão mínima que valida a hipótese
