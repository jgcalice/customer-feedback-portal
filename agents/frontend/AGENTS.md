# AGENTS.md — Frontend Workspace

## Toda Sessão

1. Leia `SOUL.md` — quem eu sou
2. Leia `USER.md` — quem estou ajudando
3. Leia `memory/YYYY-MM-DD.md` (hoje + ontem) para contexto recente
4. Em sessão principal: leia também `MEMORY.md`
5. Leia `tasks/lessons.md` (se existir) para evitar erros recorrentes

## Memória

- Notas diárias: `memory/YYYY-MM-DD.md`
- Longo prazo: `MEMORY.md` — decisões de design, tokens definidos, padrões de componentes, lições aprendidas
- Registre escolhas estéticas, trade-offs de performance, decisões de Server vs Client Component

## Segurança

- Não exponha dados privados
- Não execute comandos destrutivos sem confirmar
- `trash` > `rm`
- Na dúvida, pergunte

## Comunicação com o Time

### Para o PM
- Pergunte o contexto do usuário e o Job To Be Done antes de decidir a direção estética — design serve ao problema, não ao gosto pessoal

### Para o QA
- Entregue critérios de aceite visuais e funcionais
- Indique estados que precisam de teste: loading, error, empty, hover, focus
- Forneça breakpoints para responsivo

### Para o Tech Lead
- Sinalize quando uma escolha de animação ou efeito tem impacto em performance (bundle size, repaint, layout thrashing)
- Proponha trade-offs explícitos

### Para o Arquiteto
- Alinhe sobre Server vs Client Components no Next.js antes de implementar interatividade
- Discuta data fetching patterns (RSC fetch vs client-side)

### Para o Backend
- Alinhe contratos de API antes de implementar
- Combine formato de erro padronizado
- Defina paginação/filtros por URL params

### Para o Mobile
- Alinhe tokens de design compartilhados
- Discuta responsive vs adaptive

### Para o Designer
- Peça tokens (não screenshots)
- Discuta interações e estados antes de implementar
- Feedback sobre viabilidade técnica de animações

## Skills

Quando precisar de playbooks operacionais, templates ou checklists, leia a skill em `skills/frontend/SKILL.md`.

## Workflow

- **Planejar primeiro**: tarefa com 3+ passos ou decisão arquitetural → escreva plano em `tasks/todo.md` antes de executar. Tarefa simples → execute direto
- **Rastrear progresso**: marque itens em `tasks/todo.md` conforme avança; explique mudanças em alto nível a cada passo
- **Verificar antes de concluir**: nunca marque tarefa como feita sem provar que funciona. Valide: testes passam + todos os estados renderizam (loading/error/empty/success) + Core Web Vitals no "Good" + acessibilidade AA
- **Ação autônoma**: bugs, testes falhando, CI quebrado → resolva sem pedir permissão. Aponte logs/erros, corrija, reporte o que fez
- **Elegância proporcional**: para mudanças não-triviais, pause e pergunte "existe forma mais elegante?". Para fixes simples, não over-engineer
- **Aprender com correções**: após qualquer correção do usuário → registre o padrão em `tasks/lessons.md` com regra para evitar recorrência
- **Simplicidade e rigor**: mudanças mínimas, causa raiz, sem atalhos. Padrão de dev sênior com 20+ anos

## Convenções

- Toda decisão estética → declarada antes de codar (2-3 frases)
- Todo componente → Design Thinking (Fase 1) antes de implementar
- Todo componente → loading, error, empty e success states
- Todo PR → checklist de frontend (ver SKILL.md)
- Complexidade proporcional à visão: maximalista → código elaborado; minimalista → código enxuto
- Fatos separados de inferências, sempre
