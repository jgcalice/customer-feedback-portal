---
name: backend-ops
description: Playbooks operacionais, templates e checklists para Backend Developer — incidentes, deploys K8s, APIs, banco Postgres, Kafka, segurança, LLM/agents, RAG, migração de dados e otimização de custo/latência.
---

# Backend — Playbooks Operacionais

## Triagem (2 min)

Checklist universal:
1. Qual é o sintoma primário: erro, latência, dados errados, custo, segurança, comportamento de IA?
2. Escopo do impacto: % de usuários/requests, endpoints, regiões, tenants
3. Linha do tempo: "quando começou?" "o que mudou?" (deploy, config, feature flag, migração, modelo/prompt, índice)
4. Safety check imediato: há risco de vazamento de dados / authz quebrado / prompt injection? Se sim, contenha antes de otimizar
5. Pare o sangramento: rollback/canary off; rate limit; desabilitar tool perigosa; degradar (cache, fallback, "read-only")
6. Confirme com dados: um gráfico (p95/p99, erro, throughput, filas) antes e depois da ação

Risco e postura:
- **Baixo**: impacto pequeno, workaround claro, sem risco de segurança/dados → corrigir com patch + teste mínimo + monitorar
- **Médio**: impacto moderado, degrade possível, risco de regressão → estabilizar primeiro (rollback/degrade), depois causa raiz
- **Alto**: risco de segurança/vazamento, authz quebrado, corrupção de dados, indisponibilidade grande, custo fora de controle → "containment" > "correção elegante"; envolver segurança/DBA/SRE; registrar decisões

Com dados faltantes:
- Declare suposições: "Assumo X porque Y; vou validar com Z em 10 min."
- Use a menor intervenção reversível para criar sinal (reduzir concorrência, subir log-level por 5 min, habilitar sampling)
- Se a hipótese não é falsificável com dados atuais, crie instrumentação antes de mexer no sistema

## Playbooks

### Incidente de latência/erro em produção
Quando usar: p95/p99 sobe, 5xx/4xx anormais, timeouts, saturação, reclamação de usuário.
Objetivo: restaurar SLO/experiência rápido, reduzir blast radius e capturar evidências.
Entradas mín.: dashboard (latência/erro/tráfego), última mudança, acesso a logs/traces, runbook de rollback.
Passos:
1. Confirme impacto e prioridade (alto risco? segurança? dados?) e declare "owner" do incidente
2. Identifique "o que mudou" (deploy/config/flag/downstream/model/prompt/index)
3. Faça containment reversível (rollback, desabilitar flag, reduzir concorrência, rate limit)
4. Verifique filas/backlogs (DB pool, consumer lag, threads, queue depth)
5. Reduza fan-out e chamadas a downstream (circuit breaker/fallback/degrade)
6. Colete "snapshot" de evidências (traces top N, queries lentas, endpoints piores)
7. Após estabilizar: ataque 1 hipótese por vez; valide com antes/depois
8. Escreva atualização executiva (status, impacto, mitigação, próximos passos)

Saídas: serviço estabilizado; timeline; hipótese primária; lista de ações pós-incidente.
QA checklist: rollback funciona; alarmes voltaram ao normal; não há degrada escondida.
Erros comuns: "caçar causa raiz" antes de estabilizar; mudar 5 coisas ao mesmo tempo; esquecer custo (IA).
Escalonar: se risco alto (segurança/dados), se >30 min sem melhoria, se multi-time.

### Deploy seguro no Kubernetes com rollback rápido
Quando usar: novo release, hotfix, mudança de config/recursos, migração controlada.
Objetivo: reduzir blast radius, permitir reversão rápida, observar impacto real.
Entradas mín.: manifest/helm, estratégia (rolling/canary), métricas SLI, plano de rollback, budgets.
Passos:
1. Defina SLI(s) de release (erro, p95, saturação, fila)
2. Faça mudança pequena (um serviço/uma rota/um tenant) e com feature flag se possível
3. Configure limites e requests adequados e verifique HPA/escala
4. Canary: 1–5% + monitoramento; avance só se SLI estável
5. Se piorar: rollback imediato (não "investigar no canary" com usuários sofrendo)
6. Após sucesso: aumente tráfego gradualmente; capture baseline novo
7. Registre o aprendizado (o que foi observado e thresholds)

Saídas: deploy concluído ou revertido; evidência de SLI; decisão documentada.
QA checklist: rollback testado; readiness/liveness corretos; logs/traces com versão; alertas revisados.
Erros comuns: canary sem métrica; CPU "ok" mas latência explode; requests/limits errados → throttling/OOM.
Escalonar: se não há rollback; se recurso OOM/restart loop; se impacto multi-serviço.

### Mudança de API sem quebrar clientes
Quando usar: alterar payload, status codes, autenticação, semântica, versionamento, rate-limit.
Objetivo: evoluir API com compatibilidade e previsibilidade (contrato como produto).
Entradas mín.: spec OpenAPI/JSON Schema, lista de consumidores, plano de depreciação.
Passos:
1. Classifique mudança: compatível vs breaking (explícito)
2. Se breaking: proponha versão nova (ou nova rota/campo) + janela de migração
3. Documente contrato e exemplos; atualize spec
4. Faça "server-first compatibility": aceite antigo e novo; responda novo de forma tolerante
5. Adicione métricas por versão/cliente; monitore adoção
6. Comunique prazos, forneça guia de migração
7. Só remova versão antiga quando métricas provarem baixa dependência e prazo cumprido

Saídas: spec atualizada; plano de migração; telemetria de adoção; mudança implementada.
QA checklist: testes de contrato; exemplos válidos; backward compatibility validada; erros coerentes.
Erros comuns: esconder breaking change em "minor"; mudar sem comunicar; não medir adoção.
Escalonar: se API pública/parceiros; se compliance; se impacto grande em receita.

### Banco Postgres lento, locks, ou queda de performance
Quando usar: p95/p99 sobe com IO/CPU, pool estoura, queries lentas, deadlocks, migrar schema.
Objetivo: estabilizar, reduzir lock contention, corrigir query/index, evitar mistakes recorrentes.
Entradas mín.: top queries (tempo/contagem), plano de execução, métricas de conexões/locks, janela de manutenção.
Passos:
1. Containment: reduzir concorrência, aplicar rate limit, fallback read-only
2. Identifique query(s) culpadas por tempo total (tempo × frequência)
3. Verifique locks e transações longas; encerre com cuidado (risco de rollback grande)
4. Ajuste o mínimo: índice pontual, rewrite de query, reduzir payload, paginar
5. Se migração: passos reversíveis (add column nullable → backfill → switch reads → enforce)
6. Valide com antes/depois (latência + carga)
7. Documente o "mistake" e adicione guardrails (linters, limites, QA)

Saídas: performance estabilizada; causa provável; patch; plano de hardening.
QA checklist: sem corrupção; migração reversível; backups ok; monitoramento pós-fix.
Erros comuns: "VACUUM resolve tudo"; aumentar recursos sem entender; alterar schema em pico.
Escalonar: DBA/infra se risco de perda de dados; se precisa de tuning estrutural; se envolve upgrades.

### Kafka com backlog/consumer lag/instabilidade de streaming
Quando usar: consumer lag cresce; throughput cai; mensagens duplicadas; timeouts; rebalance thrash.
Objetivo: restaurar fluxo, preservar ordenação/semântica, evitar perda e caos operacional.
Entradas mín.: métricas de lag por consumer group, taxa produce/consume, configs (retention, partitions), logs.
Passos:
1. Confirme se o problema é producer, broker ou consumer (onde a taxa cai)
2. Se consumer lag cresce: escale consumers (respeitando partitions) e verifique hot partitions
3. Procure "poison pill" (mensagem que sempre falha) e isole (DLQ/quarantine)
4. Confira commit semantics e idempotência; evite "processou mas não commitou" sem estratégia
5. Revise timeouts/heartbeat/session para evitar rebalance constante
6. Valide throughput e estabilidade; documente anti-pattern detectado

Saídas: lag controlado; causa provável; patch (config/código); runbook atualizado.
QA checklist: reprocessamento seguro; DLQ operável; métricas por tópico/partition.
Erros comuns: "aumentar partitions" como reflexo; ignorar idempotência; não ter DLQ.
Escalonar: time de plataforma/infra se brokers afetados; se risco de perda/retention.

### Vulnerabilidade de segurança em backend web
Quando usar: CVE relevante, incidente, pen test finding, authz suspeito, input injection, SSRF.
Objetivo: reduzir risco imediato, corrigir, prevenir recorrência.
Entradas mín.: superfície afetada, severidade, exploitability, logs de acesso, owners, patch/mitigação.
Passos:
1. Classifique risco: authz? dados sensíveis? RCE? SSRF? (priorize)
2. Containment: bloquear endpoint/feature, WAF/rate limits, rotacionar segredos se necessário
3. Corrija a causa: validação de input, authz explícita, hardening (CSRF/CORS/etc.)
4. Adicione testes (unit/integration) e "abuse cases" mínimos
5. Faça deploy canary + monitoramento
6. Post-incident: revisão de controle e checklist para evitar repetição

Saídas: patch; mitigação; evidência de exploração (ou não); checklist atualizado.
QA checklist: authz testada; logs/auditoria; segredo protegido; rollback disponível.
Erros comuns: tratar como "só dev"; corrigir sem logs; esquecer rotação de tokens/keys.
Escalonar: segurança/DSO imediatamente se dados/pagamentos/PII; jurídico/compliance se vazamento.

### Incidente de LLM/Agent — alucinação, vazamento, custo ou tool misuse
Quando usar: respostas incorretas "com confiança", dados sensíveis no output, chamadas de tools indevidas, custo/token explode, latência alta.
Objetivo: conter dano, restaurar comportamento seguro, criar avaliação para evitar regressão.
Entradas mín.: exemplos de conversas, trace com contexto + tools, versão do prompt/modelo, métricas de custo/latência, regras de segurança.
Passos:
1. Classifique: segurança (prompt injection/data exfil) vs qualidade vs custo vs disponibilidade
2. Containment: desligar tool arriscada, reduzir escopo de dados, limitar tokens/iterações, fallback para workflow determinístico
3. Audite "por que respondeu": qual contexto (docs/chunks) e quais tools foram chamadas
4. Se RAG: verifique retriever (recall/precision), chunking, filtros, query rewriting e triagem
5. Se prompt injection: trate input/output handling (escape/allowlist), tool allowlist, separação de instruções vs dados
6. Reproduza com test set mínimo e adicione avaliação automatizada (offline + canary)
7. Reative gradualmente com monitoramento (qualidade + segurança + custo)

Saídas: mitigação; patch (prompt/rules/retriever); suite de avaliação; runbook.
QA checklist: não vaza segredos; tools com allowlist e auth; logs/traços completos; limites de custo; rollback.
Erros comuns: só "mexer no prompt"; ignorar retrieval; não registrar contexto; esquecer iteração limite do agente.
Escalonar: segurança se suspeita de exfil; finops se custo; produto/legal se impacto externo.

### Construir/operar RAG com rastreabilidade e qualidade
Quando usar: chatbot interno, busca semântica, Q&A corporativo, suporte, análise de docs.
Objetivo: melhorar grounding, reduzir alucinação, aumentar rastreabilidade e performance.
Entradas mín.: fontes de dados, política de acesso, definição de "resposta boa", métricas (recall/faithfulness), orçamento de latência/custo.
Passos:
1. Defina o objetivo: "responder com citação do trecho" vs "resumo geral" (importa para avaliação)
2. Modele ingestão: limpeza, chunking, metadados (tenant, permissão, recência)
3. Retrieval: comece simples e mensurável; depois adicione reranking/híbrido se necessário
4. Adicione triagem (quando buscar, o que buscar) e query rewriting quando pergunta for ambígua
5. Aplique filtros de acesso (authz) antes de recuperar e antes de responder
6. Logue e versione: prompt, modelo, embeddings, índices, top-k, chunks retornados
7. Adote GraphRAG/knowledge graph quando precisa de completude/relacionamentos e rastreabilidade

Saídas: pipeline RAG; avaliação; telemetria; runbook.
QA checklist: citações corretas; sem vazamento entre tenants; latência dentro do budget; reindex guideline.
Erros comuns: indexar lixo; chunk grande demais; ignorar permissão; não versionar embeddings.
Escalonar: se precisa de KGs/GraphRAG; se compliance; se multi-fonte complexa.

### Migração de dados sem downtime (schema + backfill)
Quando usar: mudar schema, split de tabela, novo índice, mudança de formato em evento/API.
Objetivo: mudar com reversibilidade e sem interrupção.
Entradas mín.: plano de passos reversíveis, flags de leitura/escrita, janela e estratégia de backfill.
Passos:
1. Adicione novo campo/tabela de forma compatível (nullable; sem constraints agressivas)
2. Dupla escrita (quando possível) ou job de backfill idempotente
3. Valide integridade (amostragem + checks)
4. Troque leitura para o novo caminho (feature flag/canary)
5. Mantenha compatibilidade por um período; monitore
6. Só então enforce constraints e remova caminho antigo

Saídas: schema novo operando; rollback possível nas fases iniciais; métricas.
QA checklist: backfill idempotente; limites de carga; plano de rollback; auditoria de alterações.
Erros comuns: backfill sem limite; constraint cedo demais; esquecer consumer/event replay.
Escalonar: DBA/Plataforma em migrações grandes; se risco de corrupção.

### Redução de custo e latência em endpoints de alto volume
Quando usar: custo subindo, p95/p99 alto, billing inesperado (inclui tokens/LLM).
Objetivo: cortar custo/latência sem quebrar semântica; focar em maior impacto.
Entradas mín.: top endpoints por custo e por tempo total; perfil de latência; dependências downstream.
Passos:
1. Aplique regra 80/20: ataque top 1–3 rotas por "custo total" (freq × custo)
2. Separe latência em componentes: rede, CPU, IO, DB, downstream, LLM
3. Reduza payload e trabalho desnecessário (campos, joins, N+1)
4. Cache onde é seguro; defina TTL/invalidação; use "negative caching" quando aplicável
5. Aplique colocation/particionamento/limites quando útil
6. Para LLM: reduzir tokens (prompt/context), limitar tools, usar modelos menores onde possível, cache de respostas para perguntas repetidas
7. Meça antes/depois e defina guardrails para regressão

Saídas: melhoria mensurada; documentação do trade-off; alarmes.
QA checklist: sem regressão funcional; staleness aceitável; custo menor verificado.
Erros comuns: otimizar micro-coisas; cache sem métrica; redução de tokens que destrói qualidade.
Escalonar: se precisa de redesign; se envolve contratos externos ou índice/DB.

## Templates

### Executivo (update de incidente / decisão)
Quando usar: incidente, status report, decisão de trade-off, alinhamento com líderes.
```
Título: [INCIDENTE/DECISÃO] — [serviço] — [data/hora]
Impacto: [quem/quanto; SLO/receita/usuários]
Status agora: [estável / degradado / investigando]
O que sabemos (fatos):
- [Fato 1]
- [Fato 2]
O que achamos (inferências):
- [Inferência 1 — por quê]
Ações tomadas:
- [ação] → [efeito observado]
Próximas ações (com dono e ETA):
- [ação] — [dono] — [quando]
Riscos/pendências: [segurança/dados/capacidade]
Decisão necessária: [sim/não; opções A/B]
```

### One-pager / PRD técnico (backend/IA)
Quando usar: feature nova, refactor grande, nova API, novo pipeline RAG/agent.
```
1) Problema: [dor do usuário/negócio]
2) Objetivo mensurável: [métrica + alvo + prazo]
3) Não-objetivos: [o que não será feito]
4) Escopo: [requisitos funcionais]
5) Requisitos não-funcionais: [SLO, segurança, custo, privacidade, observabilidade]
6) Design proposto: [arquitetura em texto; fluxos; dependências]
7) Contratos: [API/event/schema; compatibilidade e versionamento]
8) Falhas esperadas e mitigação: [timeouts, retries, fallback, DLQ, rate limits]
9) Plano de release: [canary, flags, rollback]
10) Avaliação (se IA): [test set, métricas, red-team, monitoramento, custo]
11) Riscos e trade-offs: [consistência vs latência; custo vs qualidade; agente vs workflow]
12) Plano de observabilidade: [logs, métricas, tracing, alertas]
```

### Experimento (latência, confiabilidade, IA)
Quando usar: validar hipótese com risco controlado; tuning; mudanças em retrieval/prompt/modelo.
```
Hipótese: "Se eu mudar X, então Y melhora porque Z."
Métrica primária: [ex.: p95, erro, custo/req, quality@k]
Métricas de guardrail: [ex.: 5xx, p99, segurança, drift]
População: [% tráfego / tenants / dataset]
Método: [A/B, canary, offline eval + online shadow]
Duração: [tempo ou nº de eventos]
Critério de sucesso: [threshold]
Plano de rollback: [como desfazer]
Resultados: [antes/depois]
Decisão: [ship/iterate/revert]
```

### Matriz de decisão
Quando usar: escolher DB/cache/arquitetura; adotar agent; adotar GraphRAG/KG; escolher modelo.
```
Decisão: [ex.: "agent vs workflow"]
Opções: A / B / C
Critérios (peso):
- Confiabilidade ( )
- Latência ( )
- Custo ( )
- Segurança/privacidade ( )
- Complexidade operacional ( )
- Time-to-market ( )
- Manutenibilidade ( )
Notas e evidências por opção:
- A: [prós/contras + evidência]
- B: [prós/contras + evidência]
Escolha e por quê: [texto]
Quando revisitar: [trigger]
```

### Plano de release
Quando usar: qualquer mudança com risco, especialmente API/DB/k8s/IA.
```
Mudança: [o que vai]
Pré-checks: [migração? config? flags?]
Estratégia: [canary/blue-green/rolling]
SLIs monitorados: [erro, latência, custo, segurança]
Passos:
1) [deploy canary]
2) [monitorar X min]
3) [expandir]
Rollback: [comando/passo]
Comunicação: [canal, frequência]
Pós-release: [verificação e cleanup]
```

### Postmortem (sem caça às bruxas)
Quando usar: incidente relevante (impacto, segurança, custo, repetição).
```
Resumo: [o que aconteceu + impacto]
Linha do tempo: [eventos e ações]
Detecção: [como detectou; tempo até detectar]
Mitigação: [o que funcionou; tempo até mitigar]
Causa raiz (multi-camada): [técnica, processo, humano]
Fatores contribuintes: [ex.: falta de alarme, mudança grande, falta de teste]
O que deu certo: [ ]
O que falhou: [ ]
Ações corretivas (com dono e prazo):
- Quick fix: [ ]
- Hardening: [ ]
- Prevenção: [ ]
Como vamos medir prevenção: [métrica/alarme/teste]
```

## Validação

Fato vs inferência (rotule sempre):
- **Fato**: observável, reproduzível, tem fonte (log/trace/métrica)
- **Inferência**: hipótese explicativa; deve dizer "por quê" e "como vou validar"

Checks mínimos antes de "concluir":
1. Há um gráfico/medida de impacto? (erro/latência/custo)
2. Há um "antes/depois" da mitigação?
3. Você mudou apenas 1 variável? Se não, você não sabe o que funcionou
4. Você registrou versão/config/modelo/prompt/index? (IA e backend)

Testes mínimos por categoria:
- **API**: teste de contrato + compatibilidade + casos de erro
- **DB/migração**: idempotência + rollback por etapas + limite de carga
- **Eventos**: reprocessamento + DLQ + idempotência
- **K8s**: readiness/liveness + rollback + monitorar p95/erro após deploy
- **IA**: conjunto de testes + avaliação offline + canary/monitoramento + custo/latência + testes de segurança (prompt injection/red-team básico)

Formato de suposição: "Assumo [X] porque [Y evidência]. Se [Z acontecer/medir], então a suposição cai e eu faço [W]."

## Estilo Sênior

Perguntas que destravam:
- "O que mudou recentemente e consigo reverter em 2 minutos?"
- "Qual evidência falsificaria minha hipótese em 10 minutos?"
- "Como isso falha em cascata?" (retries, filas, locks, downstream, tools/agents)

A/B caminhos:
- **Caminho A (estabilizar)**: rollback/degrade/containment → medir → depois causa raiz
- **Caminho B (investigar)**: só quando impacto é baixo e rollback não é necessário/possível

Dizer "não" sem ser bloqueador:
- "Não agora" com alternativa: "Para entregar em 2 semanas, faço X; Y fica fora por risco Z."
- Amarre no quality bar: "Sem rollback e sem avaliação (IA), vira risco operacional."

Negociar escopo como operador:
- Troque features por garantias: "Posso entregar menos endpoints, mas com observabilidade + limites + segurança."
- Prefira "reduzir blast radius" a "otimizar tudo" (ex.: canary por tenant)

Causa → efeito (mapas rápidos):
- Timeout alto + retries agressivos → amplificação de carga → queda geral (cascata)
- Cache sem invalidação/TTL → respostas incorretas "intermitentes" → bugs difíceis
- Mudança de API "sem versionar" → clientes quebram → incidentes fora do seu repo
- Índice/consulta ruim → lock/IO alto → latência explode → fila cresce → timeouts
- Agent sem limite de iteração/tools → loop caro e lento → incidente de budget/SLI
- RAG sem triagem/query rewriting → baixa recuperação → alucinação com confiança
- Prompt injection/insecure output handling → exfiltração / ações indevidas via tool calling

## Índice Rápido

| Problema | Playbook |
|----------|----------|
| p99 explodiu / 5xx subiu | Incidente de latência/erro |
| deploy travou / crashloop | Deploy seguro no Kubernetes |
| parceiro quebrou / 4xx aumentou | Mudança de API sem quebrar clientes |
| DB lenta / locks / pool estourando | Banco Postgres lento |
| consumer lag / backlog de eventos | Kafka com backlog/consumer lag |
| CVE / authz suspeito / SSRF | Vulnerabilidade de segurança |
| alucinação / vazamento / custo LLM | Incidente de LLM/Agent |
| respostas sem fonte / retrieval ruim | Construir/operar RAG |
| migração de schema com risco | Migração de dados sem downtime |
| custo/latência altos em rotas top | Redução de custo e latência |

| Situação | Template |
|----------|----------|
| Incidente / status report | Executivo |
| Feature nova / refactor | One-pager / PRD técnico |
| Validar hipótese / tuning | Experimento |
| Escolher tecnologia / abordagem | Matriz de decisão |
| Qualquer deploy com risco | Plano de release |
| Incidente relevante | Postmortem |

## Glossário

- **SLO**: objetivo de nível de serviço (ex.: 99.9% sucesso/30d)
- **SLI**: indicador medido (erro, latência)
- **Burn rate**: velocidade de consumo do error budget; útil para alertas
- **Blast radius**: quanto dá errado quando dá errado
- **Idempotência**: repetir operação sem efeito colateral extra
- **Backpressure**: reduzir entrada quando está saturando
- **DLQ**: fila de mensagens problemáticas para isolamento
- **Canary**: liberar para pequena fração e medir
- **RAG**: retrieval + geração para grounding em dados externos
- **GraphRAG**: usar knowledge graph para melhorar RAG (performance/traceability)
- **Prompt injection**: manipular instruções via input para burlar comportamento
- **Tool calling**: LLM chamando ferramentas (risco e poder)
- **MCP**: protocolo para conectar LLM apps a ferramentas/dados
