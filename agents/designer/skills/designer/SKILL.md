---
name: designer-ops
description: Playbooks operacionais, templates e checklists para Designer — discovery, interface design, interação, arquitetura de informação, prototipação, design system, acessibilidade e validação com usuários.
---

# Designer — Playbooks Operacionais

## Triagem (2 min)

Checklist universal antes de abrir o Figma:
1. Qual é o objetivo (Goal) real do usuário nesta tela?
2. Como eliminamos o "Gulf of Execution" (como ele sabe o que fazer)?
3. Como eliminamos o "Gulf of Evaluation" (como ele sabe se deu certo)?
4. Esta decisão é reversível (Two-way door) ou irreversível (One-way door)?

Risco e postura:
- Baixo risco (mudança visual menor): postura ágil, teste rápido pós-lançamento
- Alto risco (fluxo de checkout, arquitetura core): exija protótipo e teste moderado antes de codar

Com dados faltantes:
- Declare: "Assumo que o usuário prefere X porque Y, mas precisamos validar no teste de usabilidade."
- Reversíveis: aja com a melhor hipótese e meça
- Irreversíveis: invista tempo proporcional ao custo de errar

## Playbooks

### P1 — Continuous Discovery (Hábito Semanal)
Quando usar: sempre. Para manter o produto alinhado com a realidade.
Objetivo: co-criação constante com clientes.
Entradas mín.: Trio de produto (Designer, PM, Engenheiro).
Passos:
1. Recrute usuários semanalmente
2. Faça entrevistas focadas em histórias reais, não opiniões
3. Identifique oportunidades (dores/necessidades)
4. Mapeie na Opportunity Solution Tree (OST)
Saídas: árvore de oportunidades atualizada.
Origem: Teresa Torres–Continuous Discovery Habits.

### P2 — Double Diamond (Problema Certo)
Quando usar: no início de grandes iniciativas.
Objetivo: divergir para explorar o problema e convergir na definição real antes de desenhar.
Passos:
1. Discovery: pesquise sem restrições
2. Define: sintetize o problema real
3. Develop: explore múltiplas soluções
4. Deliver: refine e teste a melhor
Origem: British Design Council / Don Norman–The Design of Everyday Things.

### P3 — DIY Usability Testing (Teste "Surgery")
Quando usar: uma vez por mês, sem falta.
Objetivo: encontrar os problemas mais graves de usabilidade.
Entradas mín.: 3 usuários, um protótipo, uma manhã.
Passos:
1. Defina tarefas críticas
2. Peça ao usuário para "pensar em voz alta"
3. Observe sem interferir
4. Debriefing com o time no almoço
5. Decida o que corrigir até o próximo mês
Alertas: ignore "problemas de caiaque" (erros que o usuário corrige sozinho rápido).
Origem: Steve Krug–Don't Make Me Think / Rocket Surgery Made Easy.

### P4 — Goal-Directed Design (Modelagem)
Quando usar: redesign completo ou produto novo.
Objetivo: criar uma estrutura baseada em objetivos, não em features.
Passos:
1. Pesquisa etnográfica
2. Criação de Personas baseadas em comportamento
3. Definição de Requisitos (o que a persona precisa)
4. Interaction Framework (esqueleto)
5. Refinamento visual
Origem: Alan Cooper–About Face.

### P5 — IA Ecology (Arquitetura de Informação)
Quando usar: quando a navegação ou busca está confusa.
Objetivo: equilibrar Usuários, Conteúdo e Contexto.
Passos:
1. Entenda as metas de negócio (Contexto)
2. Analise a granularidade e volume dos dados (Conteúdo)
3. Pesquise comportamentos de busca e navegação (Usuários)
4. Projete taxonomias e sitemaps
Origem: Rosenfeld/Morville–Information Architecture.

## Templates

### T1 — Opportunity Solution Tree (OST)
Estrutura para alinhar o time:
```
- Outcome (Métrica de negócio desejada)
  - Opportunity 1 (Necessidade do usuário validada)
    - Solution A (Ideia de feature)
      - Assumption Test (Experimento barato)
    - Solution B
  - Opportunity 2...
```
Origem: Teresa Torres–Continuous Discovery Habits.

### T2 — Context Scenario (Storytelling)
Use para descrever a experiência ideal antes de desenhar telas:
```
"No cenário de [Nome da Persona], o objetivo é [Objetivo].
Ela abre o app e imediatamente vê [Informação Crítica],
o que permite que ela [Ação].
O sistema confirma que [Feedback]
e ela se sente [Objetivo de Experiência]."
```
Origem: Alan Cooper–About Face.

### T3 — Matriz MECE para IA
Para organizar conteúdos sem sobreposição:
```
- Categoria A: [Excludente e Exaustiva]
- Categoria B: [Excludente e Exaustiva]
```
Erro comum: categorias que se sobrepõem (ex: "Frutas" e "Alimentos Saudáveis").
Origem: Jenifer Tidwell–Designing Interfaces.

### T4 — Spec de tela / componente
```
## Tela: [Nome]
Persona: [Nome da persona]
Objetivo do usuário: [Goal]
Outcome esperado: [Métrica]

### Estados
- Default: [descrição]
- Loading: [descrição]
- Empty: [descrição]
- Error: [descrição]
- Hover/Focus: [descrição]

### Interações
- [Elemento] → [Ação] → [Feedback] → [Resultado]

### Tokens
- Cores: [referência ao design system]
- Tipografia: [referência ao design system]
- Espaçamento: [referência ao design system]

### Animações
- [Elemento]: [timing]ms [easing] on [trigger]

### Acessibilidade
- [ ] Contraste mínimo AA (4.5:1 texto, 3:1 elementos)
- [ ] Navegação por teclado funcional
- [ ] Labels em todos os inputs
- [ ] Alt text em imagens informativas
```

## Validação / Anti-burrice

Fato vs inferência (rotule sempre):
- Fato: "O usuário clicou no botão X" (comportamento observado)
- Inferência: "O usuário gostou do botão X" (hipótese — valide com comportamento)

Checks obrigatórios:
- O teste do "Por Quê": se você não sabe por que esse botão está aí além de "achamos que seria bom", volte para o discovery
- Pre-mortem: "Se este design falhar daqui a 6 meses, qual terá sido o motivo?". Antecipe falhas de modelo mental
- Formato de suposição: "Assumo [X] porque [Y]. Se [Z acontecer], impacto [W]. Vou validar com [T]."
- Exemplo: "Assumo que o usuário entende o ícone de engrenagem como 'Configurações' porque é uma convenção de mercado"

## Estilo Sênior

Perguntas que destravam:
- "Qual é o problema real que estamos tentando resolver aqui?"
- "Como o usuário faz isso hoje sem a nossa solução?"

Dizer não sem ser bloqueador:
- "Não vamos adicionar essa feature agora porque ela aumenta a carga cognitiva sem atingir o outcome prioritário."

Negociar escopo:
- "Podemos lançar este fluxo com menos opções para validar a hipótese central antes de construir o painel completo."

## Índice Rápido

| Problema | Playbook |
|----------|----------|
| Ninguém clica no botão | P3 (Teste de Usabilidade) + cheque Signifiers |
| Não sabemos o que construir | P1 (Continuous Discovery) + P2 (Double Diamond) |
| Pessoas se perdem no app | P5 (IA Ecology) + Heurística de Signposts |
| Redesign completo / produto novo | P4 (Goal-Directed Design) |
| Navegação ou busca confusa | P5 (IA Ecology) |
| Precisamos validar hipótese rápido | P1 (Discovery) + T2 (Context Scenario) |

## Glossário

- **Affordance**: propriedade física/visual que sugere ação
- **Outcome**: mudança de comportamento que gera valor
- **Excise**: trabalho extra que o usuário faz e que não contribui para o objetivo
- **Mental Model**: a crença do usuário sobre como o sistema funciona
- **Posture**: o nível de atenção que um app demanda (Sovereign ou Transient)
- **Signifier**: sinal que indica onde a affordance está (ex: o rótulo de um botão)
- **Satisficing**: comportamento de aceitar o "bom o suficiente" em vez do ótimo
- **Implementation Model**: como o sistema é construído tecnicamente
- **Information Ecology**: intersecção entre Usuários, Conteúdo e Contexto
- **Taxonomy**: sistema de classificação e organização de informação
- **Gulf of Execution**: distância entre a intenção do usuário e a ação disponível
- **Gulf of Evaluation**: distância entre o estado do sistema e a percepção do usuário
- **JTBD**: Jobs to Be Done — o "trabalho" que o usuário contrata o produto para fazer
- **OST**: Opportunity Solution Tree — árvore de oportunidades e soluções
- **MECE**: Mutually Exclusive, Collectively Exhaustive — sem sobreposição, sem lacuna
