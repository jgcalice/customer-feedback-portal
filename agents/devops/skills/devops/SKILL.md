---
name: devops-ops
description: Playbooks operacionais, templates e checklists para DevOps — CI/CD, IaC, GitOps, Kubernetes, observabilidade, DevSecOps, Platform Engineering e gestão de incidentes.
---

# DevOps — Playbooks Operacionais

## Triagem (2 min)

Checklist universal:
- O que está quebrado (sintoma) e qual o impacto de negócio?
- Escopo: quem/quantos serviços/ambientes? (prod, stage, região, cluster, tenant)
- Severidade: disponibilidade? dados? segurança? custo? compliance?
- "O que mudou por último?" (deploy, config, infra, permissão, secret, dependência)
- Evidência mínima: **1 métrica + 1 log + 1 trace** (ou pelo menos "erro + timestamp + request-id")
- Qual é a forma mais rápida de **conter** sem entender tudo? (rollback, feature flag, reduzir tráfego, desabilitar job)
- Quem decide e quem executa (DRI de incident/change)?

Risco e postura:
- Baixo risco: reversível, blast radius pequeno, sem dados sensíveis → execute e monitore, documente depois
- Médio risco: pode degradar cliente, custo, ou SLO → rollout gradual + critérios de abortar
- Alto risco: dados/segurança/produção crítica → "pare, isole, prove": approvals em environment, execução com logs, comunicação frequente

Com dados faltantes:
- Declare: "Não sei X. Assumo Y porque Z. Se estiver errado, o impacto é W."
- Escolha o teste mínimo que reduz a maior incerteza (rollback canário; reproduzir em stage; comparar antes/depois)
- Proteja o sistema antes de investigar fundo: contenção > diagnóstico perfeito

## Playbooks

### Incidente em produção (SEV)
Quando usar: indisponibilidade, aumento de erro/latência, suspeita de comprometimento, quebra sistêmica após mudança.
Objetivo: conter impacto, recuperar serviço, registrar evidências, comunicar com cadência.
Entradas mín.: hora do início, sintomas, serviços afetados, último change, sinais (métrica/log/trace).
Passos:
- Declarar incidente e definir severidade + canal único de coordenação
- Nomear papéis: Incident Commander, "scribe" (timeline), owner técnico, comunicação
- Conter ("stop the bleeding"): rollback/feature flag/isolamento (preferir reversível)
- Validar recuperação por sinais (erro/latência/saturação) e por usuário/sintético quando existir
- Abrir trilha de investigação: hipóteses, evidências, correlação por timestamp/request-id
- Comunicar: status curto (impacto, workaround, ETA no formato "próxima atualização em X")
- Encerrar quando estável + monitorado; criar tarefas de follow-up
Saídas: serviço recuperado, timeline, ações tomadas, itens pendentes com dono e prazo.
QA checklist:
- Houve contenção reversível?
- Métricas voltaram ao normal? SLO/SLI ok?
- Comunicação feita e registrada?
Erros comuns:
- "Caçar root cause" antes de conter
- Mudar 10 coisas de uma vez sem registrar
Alertas:
- Se envolver dados ou segurança, acionar segurança/forense cedo
Escalonar:
- Segurança, dados, compliance, ou impacto ampliando

### Mudança segura (release/deploy) com rollback
Quando usar: deploy app, alteração de config, alteração de infra com impacto potencial.
Objetivo: entregar mudança com blast radius controlado e rollback claro.
Entradas mín.: o que muda, onde (ambiente/região), métricas de sucesso/guardrails, plano de rollback, janela.
Passos:
- Definir "done" operacional: métrica de sucesso + guardrails + janela de observação
- Garantir pipeline mínimo: build/test + segurança mínima + artefato versionado
- Escolher estratégia de rollout: canary/blue-green/gradual (conforme risco)
- Executar via automação (CI/CD ou GitOps) com trilha (PR + logs)
- Monitorar sinais críticos (erros/latência/saturação) durante e após
- Aplicar critério de abortar: se guardrail violou → rollback imediato
- Fechar mudança: registrar resultado e ajustar runbook/painéis se necessário
Saídas: release concluído ou revertido, evidências de estabilidade, registro do change.
QA checklist:
- Rollback testável existe?
- Observabilidade cobre o caminho crítico?
- Permissões/segredos mínimos no pipeline?
Erros comuns:
- "Deploy e correr" sem observar janela
- Rollback "teórico" que nunca foi executado
Alertas:
- Em produção crítica, exigir gates de ambiente (aprovação) antes de acessar segredos
Escalonar:
- Se regressão ultrapassa SLO/impacto relevante ou envolve dados

### Pipeline quebrada no GitHub Actions (debug + hardening)
Quando usar: workflow falhando, flakey, lento/caro, risco de secret/perm.
Objetivo: restaurar pipeline com segurança (sem "abrir permissões pra passar").
Entradas mín.: link do run, workflow YAML, logs do job, mudanças recentes, segredos/ambientes usados.
Passos:
- Confirmar gatilho e contexto do workflow (branch, evento, inputs)
- Localizar o primeiro erro determinístico (não o último sintoma)
- Checar matriz/variáveis/contextos e diferenças entre jobs (p.ex., runner)
- Validar uso de secrets: expostos apenas quando necessário; evitar echo/log acidental
- Revisar permissões do `GITHUB_TOKEN` para mínimo necessário
- Se deploy: usar **environments** com regras (required reviewers) para segredos de prod
- Otimizar custo/tempo: cache, paralelismo, matriz consciente (sem explosão)
Saídas: pipeline verde + patch no workflow + registro de causa (ou ticket).
QA checklist:
- Segredos permanecem protegidos?
- Permissões mínimas?
- Há gate em ambiente crítico?
Erros comuns:
- Consertar com `write-all` no token
- Colocar segredos em variáveis globais sem necessidade
Alertas:
- Self-hosted runners: tratar como infra crítica (atualização, isolamento, credenciais)
Escalonar:
- Suspeita de vazamento de segredo ou execução não autorizada

### Terraform/OpenTofu apply com guardrails (sem corromper state)
Quando usar: provisionar/alterar infra; atualizar módulos; mudar backend/state.
Objetivo: aplicar mudanças com previsibilidade, colaboração segura e rollback/mitigação.
Entradas mín.: repo IaC, backend remoto, workspace/stack alvo, plano de mudança, janela e dono.
Passos:
- Rodar checks locais/CI: `fmt`/`validate`/lint e testes de módulo quando existirem
- Confirmar backend remoto e estratégia de lock/colaboração
- Executar `plan` e revisar diffs (especialmente destrutivas) com outra pessoa em mudanças críticas
- Garantir state locking habilitado; **não** usar `-lock=false` como atalho
- Aplicar (`apply`) com audit trail (log/run id) e observação do resultado
- Verificar pós-apply: recursos críticos, conectividade, permissões, alertas
- Se falhou: seguir padrão de mitigação (reverter com código; isolar mudança; evitar "consertar na console" sem registrar)
Saídas: infra atualizada, state consistente, evidência do apply e validações.
QA checklist:
- Locking ok?
- Backend remoto seguro (acesso mínimo)?
- Mudanças destrutivas avaliadas?
Erros comuns:
- Apply concorrente; editar state sem procedimento
- "Consertar no cloud console" sem refletir no código (drift)
Alertas:
- Terraform não é ideal para gerenciar recursos Kubernetes (prefira Helm/GitOps)
Escalonar:
- Mudanças em rede/identidade/dados; falha em locking; suspeita de state corrompido

### GitOps: promover mudança + corrigir drift (Argo CD/Flux)
Quando usar: deploy contínuo em Kubernetes, drift recorrente, padronizar promoção dev→stage→prod.
Objetivo: Git como fonte de verdade; cluster converge para o desejado; mudanças auditáveis.
Entradas mín.: repo GitOps, política de promoção, ferramenta (Argo/Flux), app/cluster alvo, manifests (Helm/Kustomize).
Passos:
- Garantir que mudanças entram via PR (Git = desired state) e passam revisão proporcional ao risco
- Para deploy: commit/merge aciona reconciliação (auto-sync ou sync manual conforme política)
- Observar estado: "desired vs live"; esperar convergência e health
- Se drift detectado: a) deixar reconciler corrigir; b) investigar causa (mudança manual, operador, webhook)
- Em emergências: aplicar correção via commit rápido (evitar `kubectl apply` sem backport)
- Para multi-cluster: promover por ambiente (branch/tag/pasta) e manter governança consistente
Saídas: mudança aplicada via Git, drift tratado, auditoria preservada.
QA checklist:
- Há UMA fonte de verdade por recurso?
- Auto-sync não ignora gates necessários?
- Observabilidade/alertas pegam regressão pós-sync?
Erros comuns:
- Mudar no cluster e esquecer de commitar (drift perpetuado)
- Misturar Terraform e GitOps no mesmo conjunto de manifests sem fronteira
Alertas:
- Auto-sync reduz necessidade de pipeline com acesso direto ao Argo CD API; pipeline deve empurrar commits, não "dar kubectl" em prod
Escalonar:
- Drift persistente; conflito entre controladores; impacto em produção

### Kubernetes: readiness/liveness/startup + recursos (produção pronta)
Quando usar: instabilidade, restarts, rollout travado, pods "Running mas quebrados", incidentes por falta de recursos.
Objetivo: tornar falha observável e isolável (probes e recursos bem definidos).
Entradas mín.: namespace, deployment, métricas básicas, eventos, configuração de probes e recursos.
Passos:
- Verificar eventos e status do rollout (restarts, crashes, readiness falhando)
- Revisar probes: readiness (entrada de tráfego), liveness (restart), startup (apps lentos)
- Ajustar timeouts/delays de acordo com o comportamento real (não chute)
- Definir requests/limits por container; alinhar com QoS desejado
- Verificar QoS e comportamento sob pressão (evictions/oom)
- Validar em stage ou canary antes de pleno rollout
Saídas: rollout estável, saúde coerente, isolamento melhor de falhas, menos ruído.
QA checklist:
- Readiness impede tráfego prematuro?
- Liveness não reinicia por "falso positivo"?
- Requests/limits coerentes com consumo?
Erros comuns:
- Liveness chamando endpoint pesado e causando flapping
- Sem limits → OOM/eviction surpresa
Alertas:
- Liveness não espera readiness; se precisa esperar, use startup probe ou delays
Escalonar:
- Evictions em massa; impacto cross-namespace; suspeita de saturação de node/cluster

### Observabilidade mínima viável (diagnóstico + SLO)
Quando usar: serviço sem visibilidade; alertas inúteis; MTTR alto; discussão sem dados.
Objetivo: instrumentar e coletar sinais mínimos com custo controlado; habilitar dashboards, alertas e SLO/SLI.
Entradas mín.: serviços críticos, endpoints, objetivos de confiabilidade, stack atual (se existir).
Passos:
- Definir perguntas operacionais (ex.: "por que aumentou latência?", "quem está falhando?")
- Escolher sinais por utilidade/custo: métricas para tendência, logs para detalhes, traces para correlação
- Padronizar com OpenTelemetry (onde possível); adicionar atributos essenciais (service, env, version, request-id)
- Configurar Collector como pipeline central (receber/processar/exportar)
- Criar dashboards essenciais (golden signals/indicadores do serviço) e alertas com ação clara
- Definir SLI/SLO e ligar alertas ao que realmente importa (reduzir ruído)
Saídas: visibilidade mínima, alertas acionáveis, base de SLO, redução de "opinião".
QA checklist:
- Alertas têm ação e owner?
- Sinais permitem correlação (logs↔traces↔métricas)?
- Custo/volume monitorado?
Erros comuns:
- Coletar tudo indiscriminadamente; alertar em sintoma que não muda decisão
Alertas:
- Collector evita múltiplos agentes e ajuda escala/padrão, mas precisa governança (pipelines/config)
Escalonar:
- Serviço crítico sem telemetria mínima; incidentes repetidos sem aprendizado mensurável

### DevSecOps em pipelines (segurança contínua sem matar velocidade)
Quando usar: pipeline sem controles; dependências de alto risco; necessidade de compliance; riscos de supply chain.
Objetivo: segurança contínua em camadas (política + automação + evidência), com fricção proporcional ao risco.
Entradas mín.: pipeline atual, ativos críticos, requisitos mínimos, inventário de dependências/artefatos.
Passos:
- Definir política mínima: gates por risco (branch protegido, reviewer para prod, segredo em environment)
- Aplicar least privilege: permissões mínimas do token e do runner
- Gerenciar segredos corretamente (repo/org/environment) e impedir acesso sem aprovação em prod
- Adotar checks de supply chain: proveniência (SLSA progressivo) e assinatura de artefatos quando aplicável
- Avaliar dependências/open source (Scorecard/heurísticas) e registrar aceitação de risco
- Criar trilha de evidência para auditoria (artefato, versão, commit, build)
Saídas: pipeline mais seguro, evidência auditável, menos risco de vazamento/tampering.
QA checklist:
- Segredos protegidos e não logados?
- Permissões mínimas?
- Há forma de verificar integridade do artefato?
Erros comuns:
- "Gate de tudo" (vira fila e shadow IT)
- "Sem gate nenhum" (incidente inevitável)
Alertas:
- Segurança é incremental: subir nível SLSA por risco; não precisa começar no topo
Escalonar:
- Suspeita de comprometimento; vazamento; dependência crítica com sinais de risco alto

### Plataforma/IDP (self-service + golden path)
Quando usar: "time de plataforma" atolado em tickets; onboarding lento; entrega inconsistente; devs virando "Kubernetes admins".
Objetivo: criar caminhos padrão (golden paths) via self-service e medir adoção/qualidade.
Entradas mín.: jornada alvo (ex.: "criar serviço + deploy"), principais dores, restrições de segurança/compliance, métricas DX.
Passos:
- Escolher um fluxo de alto atrito e alto volume (onde IDP dá retorno rápido)
- Modelar interface self-service (API/UI/CLI) e padrões (templates) do caminho feliz
- Integrar toolchain: deploy, infra, observabilidade, governança (sem exigir expertise do dev)
- Definir SLOs do produto plataforma (tempo de provisionamento, disponibilidade do serviço)
- Lançar MVP e medir adoção; iterar com requisitos e feedback
- Documentar exceções e limites (não prometer "mágica")
Saídas: fluxo self-service, padrões reutilizáveis, métricas de impacto e adoção.
QA checklist:
- Reduz carga cognitiva do dev?
- Tem SLO e suporte operável?
- É seguro por padrão?
Erros comuns:
- Construir "portal" sem integrar o trabalho real (vira catálogo morto)
- Não medir adoção e impacto (plataforma vira custo invisível)
Alertas:
- Plataforma precisa ser tratada como produto (estratégia, stakeholders, outcomes internos)
Escalonar:
- Transformação org (papéis, ownership, governança) sem alinhamento executivo

### Reduzir toil e padronizar operação (runbooks + automação)
Quando usar: on-call com repetição, incidentes similares, "tribal knowledge", tarefas manuais frequentes.
Objetivo: transformar trabalho repetitivo em automação/runbook + sinais, reduzindo MTTR e risco humano.
Entradas mín.: top incidentes/toils, logs de incidentes, áreas do sistema mais frágeis.
Passos:
- Identificar top 3 toils por frequência × dor (tempo, risco)
- Escrever runbook mínimo (gatilho, diagnóstico, ação segura, rollback)
- Automatizar passos repetíveis (scripts/pipelines/IDP) com guardrails
- Adicionar observabilidade específica (alerts que disparam runbook certo)
- Revisar após cada incidente: atualizar runbook e checar se a automação reduziu o toil
Saídas: runbooks úteis, automações com guardrails, redução mensurável de tempo e incidentes.
QA checklist:
- Runbook testável por outra pessoa?
- Automação tem limites e logs?
- Existe propriedade (owner) e revisão periódica?
Erros comuns:
- Documento longo e ninguém usa; automação sem logs/segurança
Alertas:
- Automação mal feita acelera erro; trate como software (review/test/release)
Escalonar:
- Toil indica problema estrutural (arquitetura/processo/IDP) fora do time on-call

## Templates

### Executivo (status de incidente ou change)
Quando usar: comunicar para liderança/stakeholders durante incidente ou mudança de risco.
Erros comuns: detalhes técnicos demais; prometer ETA sem base; não dizer impacto.
```
Contexto (1 frase):
Impacto (quem/quanto/desde quando):
Severidade (por quê):
Mitigação atual / workaround:
Próxima ação (owner + horário):
Próxima atualização em:
Riscos em aberto:
Decisão necessária (se houver):
```

### One-pager / RFC de mudança operacional
Quando usar: mudança em produção que pode causar impacto (infra, segurança, migração).
Erros comuns: não definir rollback; não listar dependências; não ter critério de abortar.
```
Título:
Resumo (2–3 linhas):
Motivação / problema:
Escopo (IN/OUT):
Ambiente(s) / componentes afetados:
Plano (passos resumidos):
Janela + duração estimada:
Pré-requisitos:
Observabilidade (métricas/alertas/SLOs para acompanhar):
Critério de abortar (guardrails):
Rollback (passos e tempo):
Riscos + mitigação:
DRI / revisores:
```

### Experimento operacional (performance / confiabilidade / custo)
Quando usar: validar hipótese (ex.: "cache reduz latência", "limites evitam OOM", "auto-sync reduz drift").
Erros comuns: medir coisa errada; mudar várias variáveis juntas; não definir janela de observação.
```
Hipótese:
O que teria que ser verdade para dar certo:
Métrica primária (sucesso):
Guardrails (não pode piorar):
Escopo do teste (canary/percentual/ambiente):
Procedimento:
Plano de rollback:
Resultado:
Decisão (manter/ajustar/reverter):
Aprendizados:
```

### Matriz de decisão (ferramenta/arquitetura/padrão)
Quando usar: escolher entre opções (Argo vs Flux; GitOps vs pipeline imperativa; Terraform vs ferramenta específica).
Erros comuns: critério vago; esquecer custo operacional; não explicitar "quando não usar".
```
Decisão:
Opções:
Critérios (peso):
- Segurança:
- Operação (toil/observabilidade):
- Velocidade:
- Custo:
- Lock-in:
Pontuação por opção (1–5):
Risco principal por opção:
Recomendação:
Quando NÃO usar a opção escolhida:
```

### Plano de release (com critérios de abortar)
Quando usar: releases recorrentes em ambientes críticos.
Erros comuns: sem gate de ambiente; sem métricas; sem dono de observação pós-release.
```
Release:
Versão / commit:
Estratégia (canary/gradual/blue-green):
Checklist pré-release:
- Pipeline verde:
- Aprovações (se aplicável):
- Backup/estado ok (se aplicável):
Métricas durante release:
Critério de abortar:
Rollback:
Owner durante release:
Janela de observação pós:
```

### Postmortem (foco em aprender e reduzir repetição)
Quando usar: incidentes relevantes, quase-incidentes ("near miss"), falhas repetidas.
Erros comuns: caça às bruxas; sem ações acionáveis; sem owner/prazo; não ligar a sinais/SLO.
```
Resumo do incidente:
Impacto:
Timeline (principais eventos):
Detecção (como percebemos):
Causa(s) (fato) vs Contribuintes (contexto):
O que funcionou:
O que não funcionou:
Ações:
- Ação:
- Owner:
- Prazo:
- Tipo (prevenção/detecção/mitigação):
Sinais/alertas que vamos ajustar:
Lições:
```

## Validação

Fato vs inferência (rotule sempre):
- Fato: evidência observável (logs, métricas, traces, eventos do cluster, plano do Terraform)
- Inferência: interpretação — exigir teste ou mais evidência antes de virar decisão

Checks anti-burrice (rápidos, obrigatórios em risco médio/alto):
- "Qual é a pior coisa que pode acontecer e como eu paro rápido?" (rollback/contain)
- "Estou mexendo em segredos/permissões? Então precisa gate e mínimo privilégio."
- "Estou mexendo no state? Então locking e colaboração segura."
- "Estou mexendo em saúde/recursos no cluster? Então probes + requests/limits."
- "Estou mexendo em GitOps auto-sync? Tenho estratégia para erro propagar rápido?"

Testes mínimos (padrão por categoria):
- CI/CD: workflow em PR (dry-run) + revisão de permissões/segredos
- IaC: `plan` revisado + apply com locking + verificação pós
- GitOps: PR + reconciliação observada (desired vs live) + health ok
- Kubernetes: rollout observado + probes e recursos validados
- Observabilidade: dashboard + alerta com ação + custo (volume) monitorado

Formato de suposição: "Assumo [X] porque [Y] (evidência). Se errado, impacto [Z]. Vou validar com [T] em até [N]."

## Estilo Sênior

Perguntas que destravam:
- "Qual decisão precisa ser tomada hoje e qual dado muda essa decisão?"
- "Qual o risco e o custo de errar? (e como reverter)"
- "Quais sinais vão provar sucesso/fracasso?"

A/B caminhos (padrão em incidentes e mudanças):
- Caminho A — Mitigar agora: rollback/contain para restaurar serviço
- Caminho B — Entender causa: investigação estruturada, preservando evidências
- Regra: em SEV, **A antes de B** (exceção: quando rollback piora, ex.: migração sem reversão)

Dizer não sem ser bloqueador:
- "Sim para o objetivo. Não para esse caminho sem guardrails."
- "Eu faço, mas troco X por Y (escopo) para manter segurança/observabilidade."
- "Sem gate de ambiente/segredo eu não executo (alto risco)."

Negociar escopo:
- "Podemos lançar o caminho feliz (golden path) primeiro e tratar exceções depois, se medirmos adoção e tivermos SLO do produto plataforma."

## Índice Rápido

| Problema | Playbook |
|----------|----------|
| Produção caiu / latência disparou | Incidente em produção (SEV) |
| Deploy com risco / mudança grande | Mudança segura (release/deploy) com rollback |
| Workflow falhando / suspeita de permissão/segredo | Pipeline quebrada no GitHub Actions |
| IaC apply travando / state em risco | Terraform/OpenTofu apply com guardrails |
| Drift / cluster não bate com Git | GitOps: promover mudança + corrigir drift |
| Pods reiniciando / tráfego indo para instância ruim | Kubernetes: probes + recursos |
| Todo mundo discute e ninguém sabe | Observabilidade mínima viável (diagnóstico + SLO) |
| Segurança travando ou inexistente no pipeline | DevSecOps em pipelines |
| Plataforma virou fila de tickets | Plataforma/IDP (self-service + golden path) |
| On-call sofrendo com repetição | Reduzir toil e padronizar operação |

## Glossário

- **SLI**: indicador que mede comportamento (ex.: % requests ok)
- **SLO**: objetivo para o SLI (alvo)
- **Drift**: diferença entre desejado (Git) e real (cluster)
- **Reconciliação**: loop que converge estado real para desejado
- **State locking**: lock em operações que escrevem state para evitar corrupção
- **Backend remoto**: storage de state e API de locking (quando suportado)
- **Readiness probe**: sinaliza quando pode receber tráfego
- **Liveness probe**: sinaliza quando reiniciar container
- **QoS (K8s)**: classe que influencia eviction; depende de requests/limits
- **OpenTelemetry Collector**: pipeline vendor-neutral para receber/processar/exportar telemetria
- **Environment (GitHub Actions)**: alvo de deploy com segredos e regras de proteção (ex.: required reviewers)
- **Least privilege**: permissões mínimas necessárias (tokens/workflows)
- **SLSA**: níveis para integridade/rastreabilidade na supply chain
- **Cosign**: ferramenta para assinar artefatos/containers
- **Golden path**: caminho padrão self-service para tarefas comuns (deploy, criar serviço)
- **IDP**: Internal Developer Platform — plataforma interna de self-service
- **Toil**: trabalho manual, repetitivo, automatizável e sem valor duradouro
- **DRI**: Directly Responsible Individual
