---
name: frontend-ops
description: Playbooks operacionais, templates e checklists para Frontend Developer — construção de componentes, Core Web Vitals, Server Components, acessibilidade, estado/data fetching, migração de frameworks, design system e debugging visual.
---

# Frontend — Playbooks Operacionais

## Triagem (2 min)

Checklist universal:
- Qual é o sintoma: visual (layout quebrado, CLS), funcional (não responde, erro), performance (lento, travando)?
- Escopo: um componente, uma página, todas as rotas, só mobile, só desktop?
- Reproduzível: sempre, intermitente, só em produção, só em dev?
- "O que mudou?" — deploy, dependência, API, feature flag, dados?
- Evidência mínima: screenshot/vídeo + console errors + network tab + Core Web Vitals.
- Contenção rápida: feature flag off, rollback, fallback UI, cache anterior.
- Quem é afetado: % de usuários, navegadores, dispositivos.

Risco e postura:
- Baixo: bug visual em edge case, um navegador, sem dados afetados → fix no próximo sprint + teste.
- Médio: funcionalidade quebrada para segmento de usuários, CLS alto, erro em formulário → hotfix + monitorar.
- Alto: app não carrega, perda de dados (form submit), erro de segurança (XSS), acessibilidade bloqueante → contenção imediata + rollback.

Com dados faltantes:
- Declare: "Assumo que é regressão de deploy porque [timestamp bate]. Vou validar comparando build anterior em 5 min."
- Use menor intervenção reversível: feature flag, A/B, hard refresh, limpar cache.
- Se não reproduz local: verifique CDN, cache, service worker, edge middleware.

## Playbooks

### Construção de componente do zero (do design ao merge)
Quando usar: novo componente, nova feature de UI, implementação de design system.
Objetivo: componente acessível, tipado, testável, com estados completos e identidade visual.
Entradas mín.: spec/design (ou briefing), tokens de design, contexto de uso, requisitos de acessibilidade.
Passos:
- Aplique Design Thinking (Fase 1 do SOUL.md): propósito, tom, restrições, elemento marcante.
- Defina a interface (props) com TypeScript antes de implementar — contrato primeiro.
- Implemente Server Component por padrão; adicione `'use client'` apenas se necessário.
- Implemente todos os estados: loading (skeleton), error (mensagem + retry), empty, success.
- Aplique tokens de design via CSS variables; use Tailwind para utilitários de layout.
- Adicione acessibilidade: roles, aria-labels, foco visível, contraste AA.
- Adicione animações com Motion ou CSS, respeitando `prefers-reduced-motion`.
- Exporte com types, storybook/playground (se existir), e sugira testes para QA.
Saídas: componente funcional, tipado, acessível, com todos os estados, pronto para review.
QA checklist:
- Renderiza sem erro em server e client?
- Todos os estados cobertos (loading/error/empty/success)?
- Acessibilidade: roles, labels, foco, contraste?
- Responsivo: mobile/tablet/desktop?
- Dark mode (se aplicável)?
Erros comuns:
- Codar antes de definir props/interface.
- Esquecer empty state ou error state.
- `'use client'` em componente que não precisa.
Alertas:
- Se o componente usa dados async: considere Suspense + Error Boundary.
Escalonar:
- Se precisa de animação complexa (shared layout, gesture); se precisa de integração nativa (canvas, WebGL).

### Otimização de Core Web Vitals (LCP, CLS, INP)
Quando usar: Lighthouse score baixo, CLS visível, LCP > 2.5s, INP > 200ms, reclamação de performance.
Objetivo: atingir "Good" em todos os Core Web Vitals com evidência medida.
Entradas mín.: relatório Lighthouse/PageSpeed, URL(s) afetada(s), RUM data (se existir), bundle analysis.
Passos:
- Meça baseline: Lighthouse CI + CrUX + `web-vitals` library em produção.
- LCP: identifique o elemento LCP; otimize (preload de fontes/imagens, server-side rendering, cache).
- CLS: audite imagens sem dimensões, injeções dinâmicas, fontes FOUT/FOIT, ads/embeds.
- INP: identifique handlers lentos (> 50ms); use `startTransition`, debounce, web workers, `requestIdleCallback`.
- Bundle: analise com `@next/bundle-analyzer`; elimine dependências pesadas; code-split por rota.
- Imagens: use `next/image` com `priority` no LCP; WebP/AVIF; lazy load abaixo do fold.
- Fontes: `next/font` com `display: swap` e `preload`; subset para caracteres usados.
- Terceiros: adie scripts não críticos (`next/script` com `afterInteractive`/`lazyOnload`).
- Meça depois: compare com baseline; garanta melhoria em p75.
Saídas: Core Web Vitals "Good" ou melhoria mensurável; relatório antes/depois; monitoramento.
QA checklist:
- Lighthouse score melhorou?
- CLS < 0.1, LCP < 2.5s, INP < 200ms?
- Sem regressão funcional?
- Mobile e desktop verificados?
Erros comuns:
- Otimizar Lighthouse lab score e ignorar RUM (field data).
- Preload de tudo (piora LCP se bloquear bandwidth).
- `layout="fill"` sem container com dimensões (CLS).
Alertas:
- Third-party scripts são a causa #1 de INP alto — verifique sempre.
Escalonar:
- Se problema é infra (TTFB alto); se precisa de CDN/edge; se envolve refactor de data fetching.

### Server Components vs Client Components (decisão e migração)
Quando usar: novo projeto Next.js 15, migração de Pages Router para App Router, decisão de onde colocar `'use client'`.
Objetivo: maximizar RSC para reduzir JS no cliente; usar Client Components apenas quando necessário.
Entradas mín.: árvore de componentes, requisitos de interatividade, dados necessários.
Passos:
- Mapeie componentes por necessidade: dados estáticos → RSC; interatividade/hooks → Client.
- Empurre `'use client'` para as folhas da árvore (não no layout raiz).
- Dados: fetch em RSC e passe como props para Client Components (evite `useEffect` + fetch).
- Forms: use Server Actions (`'use server'`) para mutações; progressive enhancement.
- Estado: URL params + cookies (server-readable) > Zustand/context (client-only).
- Streaming: use `loading.tsx` e Suspense para feedback rápido sem bloquear a página.
- Validação: teste com JS desabilitado — RSC deve funcionar; Client Components fazem progressive enhancement.
Saídas: app com boundary client/server otimizado; menos JS no bundle; SSR funcional.
QA checklist:
- Hydration errors no console?
- Funciona sem JS (progressive enhancement)?
- Bundle size reduziu?
Erros comuns:
- `'use client'` em layout.tsx (força tudo abaixo a ser client).
- Passar funções não-serializáveis como props de RSC para Client.
- `useEffect` para fetch que deveria ser server-side.
Alertas:
- Libs que usam `createContext` forçam Client Component — isole em wrapper.
Escalonar:
- Se lib de UI inteira é client-only e precisa de RSC; se precisa de streaming com auth.

### Acessibilidade (auditoria e correção)
Quando usar: auditoria inicial, preparação para compliance, bugs de acessibilidade, novo componente.
Objetivo: WCAG 2.2 AA compliance com evidência automatizada e manual.
Entradas mín.: componentes/páginas alvo, requisitos de compliance, ferramentas (axe-core, screen reader).
Passos:
- Rode axe-core (via browser extension ou `@axe-core/react`) e corrija erros críticos.
- Navegação por teclado: Tab order lógico, foco visível, sem "focus traps" indesejadas.
- Screen reader: teste com VoiceOver (macOS) ou NVDA (Windows); verifique landmarks, headings, live regions.
- Contraste: verifique com DevTools ou Colour Contrast Analyser; mínimo 4.5:1 texto, 3:1 UI.
- Imagens: `alt` descritivo para conteúdo; `alt=""` + `aria-hidden` para decorativo.
- Formulários: labels visíveis, `aria-describedby` para instruções, erros com `aria-invalid` + `aria-errormessage`.
- Motion: `prefers-reduced-motion` respeitar; `prefers-contrast` para alto contraste.
- Touch targets: mínimo 44x44px em mobile.
- Teste com zoom 200% — layout não deve quebrar.
Saídas: relatório de compliance, issues corrigidas, testes automatizados adicionados.
QA checklist:
- axe-core 0 violations?
- Teclado: todos os interativos acessíveis?
- Screen reader: conteúdo faz sentido sem visual?
- Contraste AA em todos os textos?
Erros comuns:
- `aria-label` duplicando texto visível (redundância).
- `div` com `onClick` em vez de `button` (sem semântica).
- Esconder erros de form sem `aria-live`.
Alertas:
- Acessibilidade é contínua: adicione `jest-axe` no CI para prevenir regressão.
Escalonar:
- Se compliance AAA necessário; se envolve conteúdo dinâmico complexo (drag-and-drop, rich text).

### Estado e data fetching (TanStack Query + Zustand + Server State)
Quando usar: decisão de estado, refactor de estado global, migração de Redux, otimização de refetching.
Objetivo: estado mínimo, previsível, com cache inteligente e UX responsiva.
Entradas mín.: mapa de estados atuais, fontes de dados, requisitos de real-time, padrões de uso.
Passos:
- Classifique cada estado: server state (TanStack Query) vs client state (Zustand/URL) vs derivado (computed).
- Server state (90% dos casos): TanStack Query com staleTime/gcTime adequados; prefetch em RSC.
- Client state local: `useState`/`useReducer` — não globalize sem necessidade.
- Client state global (raro): Zustand store mínimo; selectors para evitar re-render.
- URL state: searchParams para filtros/paginação (compartilhável + SSR-friendly).
- Optimistic updates: `useMutation` com `onMutate` para UX instantânea + rollback em erro.
- Real-time: SSE ou WebSocket com invalidação de cache via TanStack Query.
Saídas: estado limpo, sem duplicação, cache controlado, UX responsiva.
QA checklist:
- Sem estado duplicado (server e client)?
- Cache invalidado corretamente após mutations?
- Loading/error states em todos os fetches?
- Sem waterfall de requests?
Erros comuns:
- `useEffect` + `useState` para dados do servidor (use TanStack Query).
- Zustand store gigante com dados do servidor.
- `staleTime: 0` em tudo (refetch excessivo).
Alertas:
- Se precisa de real-time, avalie SSE antes de WebSocket (mais simples, HTTP-friendly).
Escalonar:
- Se precisa de offline-first (considere IndexedDB + sync); se arquitetura event-driven.

### Migração de framework/lib (Pages→App Router, CRA→Next.js, CSS-in-JS→Tailwind)
Quando usar: migração de roteamento, de stack de estilo, de estado, de versão major.
Objetivo: migração incremental sem interrupção de entrega.
Entradas mín.: codebase atual, framework/lib alvo, lista de dependências, cobertura de testes.
Passos:
- Inventário: quantos arquivos, quais padrões, dependências incompatíveis.
- Defina estratégia: strangler fig (novo em nova stack, antigo mantido) vs big bang (apenas para projetos pequenos).
- Crie codemods ou scripts para transformações repetitivas.
- Migre por rota/feature (não por "tipo de arquivo").
- Cada PR: migra um pedaço + testes + review; deploy independente.
- Feature flag para rotas migradas vs legado (A/B em produção).
- Métricas: bundle size, Lighthouse, tempo de build, flaky tests.
- Remova código legado apenas após confirmação de estabilidade.
Saídas: migração concluída ou parcial com caminho claro; evidência de estabilidade.
QA checklist:
- Paridade funcional entre novo e antigo?
- Performance não degradou?
- Testes passam em ambos os caminhos?
Erros comuns:
- Big bang em codebase grande.
- Migrar sem testes (sem rede de segurança).
- Misturar estilos antigos e novos sem cleanup.
Alertas:
- Next.js App Router suporta coexistência com Pages Router — use como strangler fig.
Escalonar:
- Se envolve mudança de bundler; se precisa de SSR onde não havia; se equipe grande precisa de coordenação.

### Design System: tokens, componentes e governança
Quando usar: projeto com múltiplas páginas/apps, inconsistência visual, equipe crescendo.
Objetivo: criar base de tokens e componentes reutilizáveis com governança clara.
Entradas mín.: paleta/tipografia existente, componentes mais usados, plataformas alvo.
Passos:
- Defina tokens primitivos: cores, espaçamentos, tipografia, border-radius, shadows, breakpoints.
- Implemente como CSS custom properties (`:root` + `[data-theme]`).
- Crie componentes base: Button, Input, Card, Badge, Modal, Toast — com variantes e acessibilidade.
- Documente com Storybook: cada variante, estado, prop e exemplo de uso.
- Defina API de componente (props) pensando em composição (slots/children > props booleanas).
- Versionamento semântico: breaking changes em major; novos tokens em minor.
- Governance: PR review obrigatório para mudanças em tokens; changelog.
Saídas: design system funcional, documentado, versionado e com governança.
QA checklist:
- Tokens consistentes com design?
- Componentes acessíveis?
- Storybook atualizado?
- Dark mode funciona?
Erros comuns:
- Tokens demais no início (comece com ~20-30 e expanda).
- Componentes com API gigante (muitas props booleanas).
- Design system sem adoption metrics.
Alertas:
- Se usa Tailwind: tokens viram `theme.extend` + CSS vars (não replace).
Escalonar:
- Se multi-plataforma (web + mobile); se precisa de white-label/multi-tenant.

### Debugging de problema visual/layout em produção
Quando usar: layout quebrado em prod, CLS reportado, componente desalinhado, fonte errada.
Objetivo: identificar e corrigir a causa raiz do problema visual com evidência.
Entradas mín.: screenshot/vídeo, URL, navegador/dispositivo, console errors.
Passos:
- Reproduza: mesmo navegador + viewport + dados + cache state.
- DevTools: inspecione computed styles, box model, CSS cascade order.
- Se CLS: use Performance tab → Layout Shifts para identificar elemento e causa.
- Se fonte errada: verifique network tab (fallback carregando?), `font-display`, preload.
- Se responsivo: verifique breakpoints, container queries, overflow hidden cortando conteúdo.
- Se animação: verifique repaint/reflow com Paint Flashing; layers com Layers panel.
- Corrija com especificidade mínima; evite `!important` como solução.
- Adicione teste visual (screenshot) ou teste de regressão para prevenir recorrência.
Saídas: fix deployado, causa documentada, teste de regressão.
QA checklist:
- Reproduz consistentemente?
- Fix não afeta outros componentes?
- Mobile e desktop ok?
Erros comuns:
- "Funciona no meu computador" — verifique cache, CDN, service worker.
- Fix com `!important` que causa cascata de problemas.
Alertas:
- Se problema é intermitente: pode ser race condition de loading (fonts, images, scripts).
Escalonar:
- Se é bug de navegador; se envolve third-party embed; se precisa de polyfill.

## Templates

### Spec de componente
Quando usar: antes de implementar componente novo ou refatorar existente.
Erros comuns: não definir estados; não pensar em acessibilidade; API de props ambígua.
```
Nome:
Propósito (1 frase):
Direção estética (tom/personalidade):
Props (interface):
- prop: tipo — descrição — default
Estados:
- Loading:
- Error:
- Empty:
- Success:
Acessibilidade:
- Role:
- Aria-labels:
- Keyboard interaction:
Responsivo:
- Mobile:
- Tablet:
- Desktop:
Animações (se houver):
Dependências:
Edge cases:
Critérios de aceite:
```

### PR checklist de frontend
Quando usar: antes de abrir PR com mudanças de frontend.
Erros comuns: esquecer acessibilidade; não testar mobile; deploy sem verificar bundle.
```
## Checklist de PR — Frontend
- [ ] TypeScript sem errors/warnings
- [ ] Todos os estados: loading, error, empty, success
- [ ] Acessibilidade: roles, labels, foco, contraste AA
- [ ] Responsivo: mobile (375px), tablet (768px), desktop (1440px)
- [ ] Dark mode (se aplicável)
- [ ] Sem console.log/debugger
- [ ] Bundle size: sem aumento injustificado (verificar analyzer)
- [ ] Imagens: next/image, dimensões, alt text
- [ ] Animações: prefers-reduced-motion
- [ ] Server vs Client: 'use client' apenas quando necessário
- [ ] Testes: componente renderiza, interações, estados
- [ ] Lighthouse: LCP, CLS, INP sem regressão
```

### Relatório de performance (Core Web Vitals)
Quando usar: auditoria de performance, antes/depois de otimização, relatório para stakeholders.
Erros comuns: só lab data (Lighthouse) sem field data (CrUX/RUM).
```
Página/rota:
Data:
Ferramenta: [Lighthouse / PageSpeed / CrUX / web-vitals RUM]

Métricas (p75):
| Métrica | Antes | Depois | Meta | Status |
|---------|-------|--------|------|--------|
| LCP     |       |        | <2.5s| |
| CLS     |       |        | <0.1 | |
| INP     |       |        | <200ms| |
| TTFB    |       |        | <800ms| |
| FCP     |       |        | <1.8s | |

Bundle size:
| Chunk   | Antes | Depois |
|---------|-------|--------|

Top issues encontrados:
1.
2.
3.

Ações tomadas:
-
Ações pendentes (owner + prazo):
-
```

### Decisão técnica de frontend
Quando usar: escolha de lib/framework, mudança de pattern, adoção de nova ferramenta.
Erros comuns: escolher por hype; não medir impacto em bundle; ignorar DX do time.
```
Decisão:
Contexto:
Opções:
| Critério | Opção A | Opção B | Opção C |
|----------|---------|---------|---------|
| Bundle size | | | |
| DX (Developer Experience) | | | |
| Performance | | | |
| Acessibilidade | | | |
| Manutenção (community/updates) | | | |
| Curva de aprendizado | | | |
Recomendação:
Trade-off aceito:
Quando revisitar:
```

### Bug report visual/funcional
Quando usar: qualquer bug de UI reportado ou encontrado.
Erros comuns: sem screenshot; sem dados de reprodução; sem versão do navegador.
```
Título:
Severidade: [Crítica / Alta / Média / Baixa]
Página/componente:
Reprodução:
1.
2.
3.
Resultado esperado:
Resultado atual:
Screenshot/vídeo:
Navegador + versão:
Viewport/dispositivo:
Console errors:
Network errors:
Frequência: [Sempre / Intermitente / Primeira vez]
```

### Plano de migração frontend
Quando usar: migração de Pages→App Router, CRA→Next.js, CSS-in-JS→Tailwind, versão major.
Erros comuns: big bang; sem testes; sem rollback; sem métricas de comparação.
```
De → Para:
Motivação:
Escopo (rotas/componentes afetados):
Estratégia: [Strangler Fig / Big Bang / Incremental]
Fases:
1. [escopo] — [prazo] — [owner]
2.
3.
Coexistência: [como old e new coexistem]
Métricas de comparação:
- Bundle size antes/depois:
- Lighthouse antes/depois:
- Tempo de build antes/depois:
Feature flags:
Rollback plan:
Riscos:
```

## Validação

Fato vs inferência (rotule sempre):
- Fato: observável e reproduzível (Lighthouse score, bundle size, console error, CLS medido).
- Inferência: hipótese ("acho que é cache do CDN"). Deve ter teste para confirmar.

Checks anti-burrice:
- "O bundle size aumentou? Verifiquei com analyzer?" (não assuma que tree-shaking resolveu).
- "Testei em mobile real (não só DevTools)?" (emulador ≠ device).
- "O componente funciona sem JavaScript?" (progressive enhancement / RSC).
- "Lighthouse rodei em Incognito sem extensions?" (extensions distorcem).
- "A fonte carregou ou está mostrando fallback?" (network tab + font-display).

Testes mínimos por categoria:
- Componente: renderiza, interações, estados (loading/error/empty), acessibilidade (jest-axe).
- Página: Lighthouse CI, visual regression, responsivo (3 breakpoints).
- Performance: CWV baseline + pós-mudança, bundle size diff.
- Migração: paridade funcional, sem hydration errors, bundle não cresceu.

Formato padrão para suposições:
- "Assumo [X] porque [Y evidência]. Se [Z acontecer], refaço com [W]."

## Estilo Sênior

Perguntas que destravam:
- "Esse componente precisa ser Client Component ou o hook pode ser isolado em um wrapper?"
- "Qual é o LCP element dessa página e estou otimizando para ele?"
- "Se eu remover essa animação, a UX piora de verdade ou só fica 'menos bonito' para devs?"
- "Esse estado é do servidor (TanStack Query) ou realmente precisa ser global (Zustand)?"
- "O usuário em 3G vai esperar quanto tempo por isso?"

A/B caminhos:
- Caminho A (pragmático): entregar funcional com design bom + iterar visual depois.
- Caminho B (perfecionista): investir em design impecável primeiro quando é landing page / primeira impressão.
- Regra: para apps internas/dashboards, A. Para produto público / marketing, B.

Como dizer "não":
- "Posso fazer essa animação, mas vai custar ~50KB de bundle e piorar INP. Aceita o trade-off?"
- "Esse componente como Client Component vai forçar tudo abaixo a ser client. Posso refatorar para isolar."
- "Sem design system, cada dev vai criar variantes. Invisto 2 dias em tokens agora ou aceito inconsistência."

Negociar escopo:
- "Entrego a versão mobile-first com 3 estados. Desktop e animações entram no sprint seguinte."
- "Se a deadline é fixa, corto animações e efeitos visuais — mas mantenho acessibilidade e performance."

## Índice Rápido

| Problema | Playbook |
|----------|----------|
| Preciso criar componente novo | Construção de componente do zero |
| Lighthouse score caiu / CLS / LCP ruim | Otimização de Core Web Vitals |
| Server ou Client Component? | Server Components vs Client Components |
| Acessibilidade com problemas | Acessibilidade (auditoria e correção) |
| Estado bagunçado / Redux legado | Estado e data fetching |
| Migrar Pages→App Router / CRA→Next | Migração de framework/lib |
| Inconsistência visual / escala | Design System |
| Layout quebrado em produção | Debugging de problema visual |

Lista de templates:
- Spec de componente
- PR checklist de frontend
- Relatório de performance (Core Web Vitals)
- Decisão técnica de frontend
- Bug report visual/funcional
- Plano de migração frontend

## Glossário

- **RSC**: React Server Component — renderiza no servidor, zero JS no cliente.
- **CWV**: Core Web Vitals — LCP, CLS, INP (métricas de UX medidas pelo Google).
- **LCP**: Largest Contentful Paint — tempo até o maior elemento visível renderizar.
- **CLS**: Cumulative Layout Shift — instabilidade visual durante carregamento.
- **INP**: Interaction to Next Paint — responsividade a interações do usuário.
- **Hydration**: processo de tornar HTML estático interativo no cliente.
- **Streaming**: enviar HTML em chunks conforme dados ficam prontos.
- **Suspense**: boundary para mostrar fallback enquanto dados carregam.
- **Server Action**: função server-side invocada do client via form/action.
- **Tree-shaking**: remoção de código não-usado pelo bundler.
- **Skeleton**: placeholder visual durante loading que mantém layout estável.
- **Token de design**: valor semântico (cor, spacing) reutilizável em todo o sistema.
- **Progressive enhancement**: funciona sem JS; JS adiciona interatividade.
