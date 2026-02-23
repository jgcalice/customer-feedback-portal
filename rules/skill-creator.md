---
description: "Criador de Skills — Guia para criar e atualizar skills eficazes que estendem as capacidades dos agentes com conhecimento especializado, workflows e integrações. Ative quando precisar criar uma nova skill ou atualizar uma existente."
globs: ["rules/*.md", "skills/**", "SKILL.md"]
alwaysApply: false
---

# Criador de Skills

Guia para criar skills eficazes para os agentes do time.

## O que são Skills

Skills são pacotes modulares e autocontidos que estendem as capacidades dos agentes com conhecimento especializado, workflows e ferramentas. Funcionam como "guias de onboarding" para domínios específicos — transformam um agente genérico em um especialista equipado com conhecimento operacional.

### O que Skills Fornecem

1. **Workflows especializados** — Procedimentos multi-etapa para domínios específicos
2. **Expertise de domínio** — Conhecimento específico de empresa, schemas, lógica de negócio
3. **Recursos bundled** — Scripts, referências e assets para tarefas complexas e repetitivas

## Princípios Core

### Concisão é Fundamental

A janela de contexto é um bem público. Skills dividem o contexto com tudo que o agente precisa: system prompt, histórico de conversa, metadados de outras skills e o pedido do usuário.

**Premissa: o agente já é muito inteligente.** Adicione apenas contexto que ele não possui. Para cada parágrafo, pergunte: "O agente realmente precisa desta explicação?" e "Este trecho justifica seu custo em tokens?"

Prefira exemplos concisos a explicações verbosas.

### Graus de Liberdade Apropriados

Ajuste a especificidade à fragilidade e variabilidade da tarefa:

- **Alta liberdade** (instruções em texto): Quando múltiplas abordagens são válidas e o contexto guia a decisão
- **Média liberdade** (pseudocódigo/scripts com parâmetros): Quando existe um padrão preferido com variação aceitável
- **Baixa liberdade** (scripts específicos): Quando operações são frágeis, consistência é crítica ou uma sequência exata deve ser seguida

### Anatomia de uma Skill

Toda skill consiste em um arquivo `.md` com frontmatter YAML:

```
skill-name.md
├── YAML frontmatter (obrigatório)
│   ├── description: (obrigatório — gatilho principal)
│   ├── globs: (opcional — padrões de arquivo)
│   └── alwaysApply: (opcional — default false)
└── Corpo Markdown (instruções)
```

#### Frontmatter

- **description**: Mecanismo principal de ativação. Inclua o que a skill faz E quando deve ser usada. Seja claro e abrangente.
- **globs**: Padrões de arquivo que ativam a skill contextualmente.
- **alwaysApply**: Se `true`, a skill é sempre carregada. Use com moderação.

#### Corpo Markdown

Instruções operacionais para o agente. Estrutura recomendada:

```markdown
# Nome do Role

## Identidade Operacional
Missão, escopo, fora do escopo, barra de qualidade, trade-offs, heurísticas.

## Modelo Mental Sênior
Pilares, red flags, early signals, causa→efeito.

## Triagem (2 min)
Checklist universal, risco e postura, como agir com dados faltantes.

## Playbooks
Playbooks operacionais por situação (quando usar, passos, saídas, QA checklist, erros comuns).

## Templates
Templates copy/paste para documentos operacionais.

## Validação / Anti-burrice
Fato vs inferência, checks obrigatórios, testes mínimos.

## Estilo Sênior
Perguntas que destravam, A/B caminhos, dizer não, negociar escopo.

## Comunicação com Outros Agentes
Como se comunicar com cada role do time.

## Índice Rápido
Problema → playbook, lista de templates, mini-glossário.
```

### O que NÃO Incluir

- README.md, CHANGELOG.md, INSTALLATION_GUIDE.md
- Documentação auxiliar sobre o processo de criação
- Informações que o agente já sabe (conceitos básicos de programação, definições óbvias)
- Comentários narrativos ("agora vamos fazer X")

## Processo de Criação

### 1. Entender o Domínio com Exemplos Concretos

Antes de escrever, entenda como a skill será usada:
- Que tipo de pedidos o agente vai receber?
- Quais são os cenários mais comuns?
- Que conhecimento especializado é necessário que o agente não tem por padrão?

### 2. Planejar o Conteúdo

Para cada exemplo concreto, identifique:
- Que workflow o agente deve seguir?
- Que heurísticas de decisão são necessárias?
- Que playbooks cobrem os cenários mais frequentes?
- Que templates economizam tempo e padronizam qualidade?

### 3. Escrever a Skill

**Diretrizes de escrita:**
- Use forma imperativa/infinitiva
- Mantenha abaixo de 500 linhas (ideal: 200-400)
- Priorize conteúdo operacional (decisões, diagnóstico, execução) sobre teórico
- Cada seção deve justificar seu custo em tokens
- Inclua "Origem:" para fundamentar práticas quando relevante
- Use português brasileiro para o conteúdo, inglês para código

### 4. Validar

Checklist de qualidade:
- [ ] Frontmatter YAML com description clara e globs relevantes
- [ ] Missão e escopo bem definidos
- [ ] Heurísticas operacionais (não teóricas)
- [ ] Playbooks com: quando usar, passos, saídas, QA checklist, erros comuns
- [ ] Templates copy/paste úteis
- [ ] Seção de comunicação com outros agentes do time
- [ ] Abaixo de 500 linhas
- [ ] Sem informação que o agente já sabe
- [ ] Sem artefatos de geração (citeturn, entity[], meta-notas)

### 5. Iterar

Após uso real, refine:
1. Observe onde o agente travou ou errou
2. Identifique gaps nos playbooks ou heurísticas
3. Implemente melhorias e teste novamente

## Anti-padrões

- **Skill enciclopédica**: Mais de 500 linhas de teoria sem aplicação prática
- **Skill genérica**: Conteúdo que o agente já sabe sem contexto específico
- **Skill sem playbook**: Heurísticas soltas sem processo de aplicação
- **Skill sem comunicação**: Agente isolado que não sabe como interagir com o time
- **Skill com ruído**: Artefatos de citação, meta-instruções vazadas, formatação inconsistente
