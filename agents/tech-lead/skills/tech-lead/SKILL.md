---
name: tech-lead-ops
description: Playbooks operacionais, templates e checklists para Tech Lead — code review, planejamento de features, decisões técnicas, gestão de débito, delegação, sprint planning, post-mortems e resolução de conflitos.
---

# Tech Lead — Playbooks Operacionais

## Triagem (2 min)

Checklist universal:
- Qual é o problema/pedido e qual o impacto se não resolver?
- É **decisão técnica**, **incidente**, **conflito** ou **planejamento**?
- Escopo: quantos times/serviços/pessoas afeta?
- Reversibilidade: se decidir errado, quanto custa reverter?
- Dados: tenho evidência ou é opinião? Preciso de mais dados antes de decidir?
- Urgência vs importância: precisa agora ou pode ser planejado?
- Quem é o DRI (directly responsible individual)?

Risco e postura:
- Baixo risco: reversível, escopo pequeno → decida rápido, documente depois
- Médio risco: afeta múltiplos times → ADR leve, consulte 1-2 pessoas, defina rollback
- Alto risco: irreversível, afeta produção/dados/segurança → RFC completa, revisão formal, migração incremental

Com dados faltantes:
- Declare: "Não tenho dados sobre X. Assumo Y porque Z. Se errado, impacto W. Vou validar com T."
- Reversíveis: aja com a melhor hipótese e meça
- Irreversíveis: invista tempo proporcional ao custo de errar

## Playbooks

### Code Review como veterano
Quando usar: qualquer PR que afeta código de produção, especialmente lógica de negócio, APIs, segurança e dados.
Entradas mín.: PR com descrição, diff, contexto da task, critérios de aceite.
Passos:
- Leia a descrição antes do código: entenda o "por quê" antes do "como"
- Passada rápida pelo diff inteiro para entender o escopo
- Avalie por severidade:
  - **Crítica** (bloqueia merge): segurança, perda de dados, breaking changes sem versionamento, performance catastrófica
  - **Alta** (corrigir antes de prod): sem testes para lógica nova, sem validação de input, hardcoded values, sem timeout
  - **Média** (melhoria): naming confuso, violação SRP, código duplicado, tipo `any` em TS
  - **Sugestão** (nice to have): simplificação, legibilidade, pattern idiomático
- Verifique: testes cobrem happy path + edge cases? Rollback é possível?
- Comente com intenção de ensinar: "Considere X porque Y" > "Mude para X"
- Reconheça o que está bom
Saídas: veredicto (aprovado / aprovado com ressalvas / mudanças necessárias), issues por severidade.
Alertas: PR >400 linhas → peça para quebrar; AI-generated → review redobrado.
Escalonar: auth/pagamento/dados sensíveis → segundo reviewer; mudança de arquitetura → ADR antes.

### Planejamento de feature do zero
Quando usar: feature nova, épico, ou mudança significativa multi-agentes/times.
Entradas mín.: requisito (do PM ou stakeholder), contexto técnico, constraints.
Passos:
- Perguntas antes de codar: critério de "pronto"? Happy path e edge cases? Afeta features existentes? Dependências externas? Rollback plan?
- Defina escopo (IN/OUT) e negocie MVP vs versão completa
- Decomponha em tasks: entregável independentemente, testável, estimativa honesta (P < 2h, M 2-8h, G 1-3d, XG precisa quebrar mais)
- Mapeie dependências explícitas entre tasks e entre agentes
- Identifique riscos técnicos: spike/PoC para incertezas; feature flag para rollback
- Defina critérios de aceite verificáveis por task
- Distribua tasks por especialidade com contexto suficiente
Saídas: lista de tasks padronizada, mapa de dependências, riscos com mitigação, timeline.
Erros comuns: tasks XG sem quebrar; dependências implícitas; sem critérios de aceite.

### Decisão técnica com framework
Quando usar: escolha de tecnologia, padrão de arquitetura, build vs buy.
Entradas mín.: problema, constraints, contexto técnico.
Passos:
- Entenda o problema real (não o sintoma)
- Mapeie constraints: timeline, equipe, escala, budget, reversibilidade
- Proponha 2-3 alternativas com prós/contras/risco/esforço/reversibilidade
- Two-way door → decida rápido; one-way door → invista tempo
- Consulte especialistas afetados
- Documente como ADR: contexto, decisão, consequências, critério de revisão
- Comunique decisão e razões para todos os afetados
Saídas: ADR documentado, decisão comunicada, plano de execução.
Erros comuns: decidir por hype; não documentar; consenso como meta (paralisia).

### Gestão de débito técnico
Quando usar: features ficando mais lentas, incidentes recorrentes, frustração do time.
Passos:
- Identifique e registre: descrição, impacto, custo de não pagar, custo de pagar
- Categorize: **segurança** (pague agora), **instabilidade** (pague logo), **velocidade** (pague planejado), **estético** (pague se sobrar)
- Priorize por "juros compostos": o que mais bloqueia ou mais vai piorar?
- Aloque 15-20% do sprint para pagamento contínuo
- Associe pagamento de dívida a features quando possível
- Meça progresso: incidentes evitados, tempo de feature, satisfação do dev
Saídas: backlog de dívida priorizado, % alocado, métricas de progresso.

### Onboarding de novo membro
Quando usar: novo dev, novo agente, ou membro mudando de time.
Objetivo: produtividade em 2 semanas, primeiro PR em 3 dias.
Passos:
- Prepare ambiente antes: acessos, repo clonável, README que funciona
- Dia 1: visão geral (missão, stack, arquitetura, fluxo de deploy)
- Dia 1-2: primeiro PR (pair programming com veterano)
- Semana 1: tour pelo código, leitura de ADRs e débito técnico
- Semana 2: task solo com review cuidadoso
- Defina buddy para os primeiros 30 dias
- Colete feedback do onboarding

### Resolução de conflito técnico
Quando usar: time dividido, discussão sem convergência, tensão entre agentes.
Passos:
- Separe pessoas de posições: foque no problema
- Cada lado documenta em 1 parágrafo: "Eu proponho X porque Y, com risco Z."
- Identifique critérios objetivos: performance? custo? manutenibilidade?
- Se possível, faça PoC/spike (dados > opinião)
- Se não dá para testar: matriz de decisão com pesos acordados antes
- Tome a decisão e documente como ADR
- Reconheça mérito das alternativas não escolhidas
Saídas: ADR, time alinhado, aprendizado registrado.

### Refactor seguro em produção
Quando usar: código legacy, migração de dependência, mudança de pattern sem downtime.
Passos:
- Adicione testes antes de mudar (characterization tests se não existem)
- Strangler Fig Pattern: novo código ao lado do antigo; roteamento gradual via feature flag
- Migre incrementalmente: uma rota/módulo por vez; valide com métricas
- Cada PR deve ser mergeável e deployable independentemente
- Meça antes/depois: latência, erros, throughput
- Só remova código antigo quando métricas provarem estabilidade
Erros comuns: rewrite from scratch; refactor sem testes; big bang migration.

### Sprint planning técnico
Quando usar: início de sprint/ciclo.
Passos:
- Revise velocity real; considere feriados, on-call, reuniões
- Aloque capacity: ~70% features, ~15-20% débito, ~10-15% buffer
- Para cada item: estimativa (P/M/G/XG), dependências, riscos, definition of done
- Identifique critical path e bloqueios potenciais
- Distribua por especialidade respeitando carga cognitiva
- Defina "o que cortar se apertar" (escopo, não qualidade)
Saídas: sprint backlog, mapa de dependências, riscos, compromissos comunicados.

### Post-mortem que gera aprendizado
Quando usar: incidente relevante, near miss, falha repetida.
Passos:
- Realize em até 48h (memória fresca)
- Timeline factual: o que aconteceu, quando, o que foi feito
- Separe fatos de inferências explicitamente
- Pergunte "o que funcionou?" antes de "o que falhou?"
- Gere ações com: descrição, owner, prazo, tipo (prevenção/detecção/mitigação)
- Defina como medir se a ação funcionou
- Publique e revise ações em 30 dias
Saídas: documento de post-mortem, ações com owner/prazo, métricas de prevenção.

### Delegação eficaz para agentes/time
Quando usar: distribuir trabalho, onboardar agente em task.
Passos:
- Seja específico: endpoint, formato, comportamento
- Dê contexto: por que estamos fazendo, como se encaixa, quem depende
- Defina critérios de aceite verificáveis
- Defina constraints: prazo, padrões, libs permitidas, testes esperados
- Indique armadilhas conhecidas e edge cases
- Checkpoint para tasks G/XG: "Me mostre o design/contrato antes de implementar"
- Revise com feedback construtivo e específico

## Templates

### Status update executivo
```
Status: [On track / At risk / Blocked]
Período: [data início – data fim]
Resumo (2 linhas):
Progresso:
- Concluído: [itens]
- Em andamento: [itens + % ou ETA]
- Bloqueado: [itens + motivo + ação]
Riscos:
- [Risco] → [Mitigação] → [Owner]
Métricas: [DORA snapshot se aplicável]
Decisão necessária: [sim/não; contexto]
```

### ADR (Architecture Decision Record)
```
# ADR-[NNN]: [Título]
Data: [YYYY-MM-DD]
Status: [Proposto / Aceito / Depreciado / Substituído por ADR-XXX]

## Contexto
[Qual problema? Qual contexto técnico/negócio? Constraints?]

## Decisão
[O que decidimos fazer.]

## Alternativas Consideradas
| Opção | Prós | Contras | Risco | Esforço | Reversibilidade |
|-------|------|---------|-------|---------|-----------------|
| A     |      |         |       |         |                 |
| B     |      |         |       |         |                 |

## Consequências
- Positivas: [o que ganhamos]
- Negativas: [trade-offs aceitos]
- Riscos: [o que pode dar errado]

## Critério de Revisão
[Quando revisitar? Qual trigger?]
```

### RFC técnica
```
# RFC: [Título]
Autor: [nome] | Data: [YYYY-MM-DD] | Status: [Draft / Review / Aceito / Rejeitado]

## Problema
[Dor atual com dados]

## Proposta
[O que fazer, como funciona]

## Escopo (IN/OUT)
## Design
## Plano de migração
## Riscos e mitigação
| Risco | Probabilidade | Impacto | Mitigação |

## Métricas de sucesso
## Alternativas descartadas
## Revisores
```

### Sprint planning / task breakdown
```
## Sprint [N] — [Data início] a [Data fim]
Capacity: [X]% features | [Y]% débito | [Z]% buffer

### Task [N]: [Título descritivo]
- Agente: [backend/frontend/qa/devops]
- Complexidade: [P/M/G/XG]
- Depende de: [Tasks anteriores ou nenhuma]
- Critério de aceite:
  - [ ] [condição verificável 1]
  - [ ] [condição verificável 2]
- Riscos: [armadilhas conhecidas]
```

### Code review feedback
```
## Review: [PR título / link]
Veredicto: [Aprovado / Aprovado com ressalvas / Mudanças necessárias]

### Crítico (bloqueia merge)
- [arquivo:linha] — [problema] — [sugestão + por quê]

### Alto (corrigir antes de prod)
### Médio (melhoria importante)
### Sugestão
### O que está bom
```

### Registro de débito técnico
```
## Débito: [Título descritivo]
ID: [DT-NNN] | Data: [YYYY-MM-DD] | Owner: [nome]
Categoria: [Segurança / Instabilidade / Velocidade / Estético]
Severidade: [Crítica / Alta / Média / Baixa]

### Descrição
### Impacto de não pagar
### Custo de pagar
### Plano de pagamento
### Métricas de sucesso
```

## Validação

Fato vs inferência (rotule sempre):
- Fato: evidência observável — métrica, log, código, ADR, dado
- Inferência: hipótese — exigir teste ou evidência antes de virar decisão

Checks obrigatórios (médio/alto risco):
- "Quem mais isso afeta e eles sabem?"
- "Se eu estiver errado, quanto custa e como reverter?"
- "Tenho dados ou é opinião?"
- "Estou resolvendo o problema real ou o sintoma?"
- "Isso aumenta ou reduz a carga cognitiva do time?"
- "AI gerou esse código? Review redobrado."

Formato de suposição: "Assumo [X] porque [Y]. Se [Z acontecer], impacto [W]. Vou validar com [T] em [prazo]."

## Estilo Sênior

Perguntas que destravam:
- "Qual decisão precisa ser tomada HOJE e qual dado mudaria essa decisão?"
- "O que é o MVP disso? O que posso cortar sem perder o valor?"
- "Isso é two-way door ou one-way door?"
- "Estamos otimizando para o curto ou longo prazo?"

Dizer não sem ser bloqueador:
- "Sim para o objetivo. Não para esse caminho sem [testes/rollback/ADR]."
- "Para entregar em [prazo], faço [escopo A]; [escopo B] fica fora por [risco/custo]."
- "Qualidade não é escopo negociável. Posso cortar features, não testes, não rollback."

## Índice Rápido

| Problema | Playbook |
|----------|----------|
| PR travado / review demorado | Code Review como veterano |
| Feature nova, como planejar? | Planejamento de feature do zero |
| Escolher tecnologia / abordagem | Decisão técnica com framework |
| Código legacy travando features | Gestão de débito técnico |
| Pessoa nova no time | Onboarding de novo membro |
| Time dividido em como fazer | Resolução de conflito técnico |
| Refactor grande sem quebrar prod | Refactor seguro em produção |
| Sprint começando | Sprint planning técnico |
| Incidente aconteceu | Post-mortem que gera aprendizado |
| Delegar task com qualidade | Delegação eficaz |

## Glossário

- **ADR**: Architecture Decision Record
- **RFC**: Request for Comments — proposta técnica formal
- **DORA**: deployment frequency, lead time, change failure rate, MTTR
- **SPACE**: Satisfaction, Performance, Activity, Communication, Efficiency
- **Two-way door**: decisão reversível; decida rápido
- **One-way door**: decisão irreversível; invista tempo
- **Bus factor**: número de pessoas que podem "sair" antes do projeto parar
- **Strangler Fig**: migração incremental (novo ao lado do antigo)
- **Feature flag**: separar deploy de launch
- **Trunk-based**: todos integram no branch principal frequentemente
- **Shift-left**: mover qualidade/segurança para o início do ciclo
- **DRI**: Directly Responsible Individual
