---
name: security-ops
description: Playbooks operacionais, checklists e referências para Security Engineer Senior — OWASP (web, API, LLM), threat modeling, zero trust, supply chain, incident response, compliance e segurança de IA/agentes. Use quando avaliar vulnerabilidades, fazer threat model, responder a incidentes, revisar auth/authz, ou implementar controles de segurança.
---

# Security — Playbooks Operacionais (20+ anos de experiência)

## Triagem (2 min)

Checklist universal:
1. **Tipo de risco**: dados sensíveis? authz quebrado? RCE? exfiltração? supply chain?
2. **Superfície afetada**: app, API, infra, LLM/agent, dependência, identidade?
3. **Explorabilidade**: público? precisa credencial? complexidade do exploit?
4. **Contenção imediata**: bloquear endpoint, rotacionar segredos, desabilitar tool/feature?
5. **Evidência**: logs, traces, CVE, repro steps — o que temos?
6. **DRI**: quem decide e quem executa a remediação?

Risco e postura:
- **Crítico**: authz quebrado, dados vazando, RCE, prompt injection com exfiltração → contenção em minutos; escalar; postmortem obrigatório
- **Alto**: vulnerabilidade explorável, dependência comprometida, segredo exposto → patch em prazo definido; causa raiz; prevenção
- **Médio**: configuração fraca, logging insuficiente, controle ausente → priorizar por impacto; documentar aceitação de risco se necessário
- **Baixo**: hardening, best practice → backlog com critério de priorização

## Frameworks de Referência

### OWASP Top 10:2025 (Web)
A01 Broken Access Control | A02 Security Misconfiguration | A03 Supply Chain Failures | A04 Cryptographic Failures | A05 Injection | A06 Insecure Design | A07 Authentication Failures | A08 Software/Data Integrity Failures | A09 Security Logging Failures | A10 Mishandling of Exceptional Conditions

### OWASP Top 10 for LLM Applications
LLM01 Prompt Injection | LLM02 Insecure Output Handling | LLM03 Training Data Poisoning | LLM04 Model DoS | LLM05 Supply Chain | LLM06 Sensitive Information Disclosure | LLM07 Insecure Plugin Design | LLM08 Excessive Agency | LLM09 Overreliance | LLM10 Model Theft

### Pilares de decisão (veterano)
- **Threat-informed**: ameaça define defesa; priorize pelo risco real (impacto × probabilidade)
- **Defense in depth**: nenhum controle único basta; camadas (rede, app, dados, identidade, monitoramento)
- **Zero trust**: never trust, always verify; authz em todo ponto que toca dado sensível
- **Supply chain é runtime**: dependências e artefatos rastreáveis e verificáveis (SBOM, assinatura)

---

## Playbooks

### Vulnerabilidade em produção (CVE, pen test, bug bounty)
Quando usar: CVE relevante, finding de pentest, authz suspeito, injection, SSRF, segredo exposto.
Objetivo: conter risco, corrigir causa raiz, prevenir recorrência.
Entradas mín.: superfície afetada, severidade, explorabilidade, logs, owners, patch/mitigação disponível.
Passos:
1. Classifique: authz? dados sensíveis? RCE? SSRF? (priorize por impacto)
2. Contenção: bloquear endpoint/feature, WAF/rate limit, rotacionar segredos se necessário
3. Corrija causa: validação de input, authz explícita, hardening (CSRF/CORS, headers)
4. Adicione testes (unit/integration) e abuse cases mínimos
5. Deploy canary + monitoramento
6. Post-incident: revisão de controle e checklist para evitar repetição

Saídas: patch; mitigação; evidência de exploração (ou não); checklist atualizado.
Erros comuns: tratar como "só dev"; corrigir sem logs; esquecer rotação de tokens/keys.
Escalonar: DSO/jurídico/compliance se dados/pagamentos/PII; se vazamento confirmado.

### Threat modeling (STRIDE + superfície de ataque)
Quando usar: feature nova, refactor grande, nova API, integração com terceiros, sistema de IA/agent.
Objetivo: identificar ameaças antes de implementar; priorizar controles.
Entradas mín.: diagrama de fluxo de dados, atores, ativos sensíveis, trust boundaries.
Passos:
1. Desenhe o fluxo: componentes, dados, limites de confiança
2. STRIDE por componente: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege
3. Priorize: impacto × probabilidade × custo de mitigação
4. Para cada ameaça alta/crítica: defina controle (prevenção, detecção, resposta)
5. Documente em ADR ou threat model; revise quando contexto mudar

Saídas: threat model; lista priorizada de controles; ADR de segurança.
Erros comuns: threat model estático; ignorar supply chain e identidade; não revisar após mudança.

### Incidente de segurança (detecção → contenção → erradicação → recuperação)
Quando usar: suspeita de comprometimento, vazamento, acesso não autorizado, malware, phishing interno.
Objetivo: conter dano, preservar evidências, recuperar, aprender.
Entradas mín.: sintoma, hora do início, sistemas afetados, último change, logs disponíveis.
Passos:
1. Declarar incidente; nomear Incident Commander e papéis (scribe, técnico, comunicação)
2. Contenção: isolar sistemas, revogar credenciais, bloquear IPs/contas
3. Preservar evidências: logs, imagens de disco, trilha de auditoria (não alterar)
4. Erradicação: remover acesso malicioso, patch vulnerabilidade, rotacionar segredos
5. Recuperação: restaurar serviços com controles reforçados; validar integridade
6. Postmortem: timeline, causa raiz, ações corretivas e preventivas (blame-free)

Saídas: serviço recuperado; evidências preservadas; postmortem; runbook atualizado.
Erros comuns: "investigar" antes de conter; alterar evidências; pular postmortem.
Escalonar: jurídico, compliance, comunicação externa se vazamento ou regulatório.

### Prompt injection e segurança de LLM/Agent
Quando usar: agente com tools, RAG, chatbot com acesso a dados, integração LLM em produto.
Objetivo: prevenir exfiltração, jailbreak, tool misuse, custo/DoS.
Entradas mín.: fluxo do agente, tools expostas, dados acessíveis, limites atuais.
Passos:
1. Mapeie superfície: inputs do usuário, contexto injetado, tools chamáveis
2. Input/output handling: escape, allowlist, separação instruções vs dados
3. Tool allowlist: só tools necessárias; authz por tool; auditoria de chamadas
4. Limites: iterações, tokens, custo por sessão; circuit breaker
5. Rastreabilidade: log contexto + tools + output para forense
6. Red-team básico: testes de prompt injection, jailbreak, exfiltração

Saídas: controles implementados; testes de abuso; documentação de limites.
Erros comuns: confiar só no prompt; não limitar tools; ignorar custo/DoS.
Escalonar: se exfiltração confirmada ou modelo com dados sensíveis.

### Authn/Authz — revisão e hardening
Quando usar: nova API, mudança de permissões, integração SSO, migração de identidade.
Objetivo: garantir authz explícita em todo ponto que toca dado sensível.
Entradas mín.: fluxo de auth, modelo de permissões, endpoints que retornam dados sensíveis.
Passos:
1. Liste todos os pontos que acessam dados sensíveis (DB, API, cache, eventos)
2. Para cada ponto: há check de authz? quem pode acessar? há IDOR?
3. Valide: usuário A não acessa dados de B; admin requer MFA; tokens com expiração
4. Logging: quem acessou o quê (sem logar PII desnecessário)
5. Testes: abuse cases (acesso cross-tenant, privilege escalation)

Saídas: authz documentada; testes de abuse; gaps corrigidos.
Erros comuns: authz implícito ("só usuário logado"); confiar em rede/perímetro; não testar IDOR.

### Supply chain e dependências (SBOM, vulnerabilidades, SLSA)
Quando usar: nova dependência, CVE em lib, deploy de artefato, compliance.
Objetivo: rastreabilidade, detecção de vulnerabilidades, integridade de artefatos.
Entradas mín.: inventário de deps, pipeline de build, requisitos de compliance.
Passos:
1. Gere SBOM (Software Bill of Materials) para artefatos críticos
2. Escaneie vulnerabilidades (Dependabot, Snyk, Grype, etc.); priorize por severidade e uso
3. Defina política: CVE crítico = bloqueio; alto = prazo de remediação
4. SLSA progressivo: proveniência, assinatura (Cosign), ambiente hermético
5. Para dependências de alto risco: avaliação manual; aceitação de risco documentada

Saídas: SBOM; política de vulnerabilidades; gates no pipeline; evidência de integridade.
Erros comuns: ignorar dependências transitivas; "depois atualizamos"; sem assinatura em prod.

### Segredos e credenciais (vault, rotação, nunca em código)
Quando usar: novo serviço, integração, incidente de vazamento, auditoria.
Objetivo: segredos em vault; nunca em repo, imagem ou log; rotação quando comprometido.
Entradas mín.: onde segredos são usados, como são injetados, política de rotação.
Passos:
1. Inventário: todos os segredos (API keys, DB, tokens, certs)
2. Migrar para vault/secret manager (HashiCorp Vault, AWS Secrets Manager, etc.)
3. Injeção em runtime (env, volume, sidecar); nunca em Dockerfile ou config em repo
4. Rotação: processo documentado; em incidente, rotacionar imediatamente
5. Auditoria: quem acessa qual segredo; alerta em acesso anômalo

Saídas: segredos em vault; política de rotação; auditoria configurada.
Erros comuns: segredo em .env commitado; "só em dev"; rotação manual sem processo.

### Compliance e privacidade (LGPD, GDPR, auditoria)
Quando usar: dados pessoais, requisito regulatório, auditoria externa.
Objetivo: evidências de controle; minimização de dados; direitos do titular.
Entradas mín.: tipos de dados, fluxos, bases legais, requisitos do regulador.
Passos:
1. Mapeie dados pessoais: onde são coletados, processados, armazenados
2. Base legal: consentimento, legítimo interesse, contrato
3. Minimização: colete só o necessário; retenção definida
4. Direitos: acesso, correção, exclusão, portabilidade — processo operacional
5. Evidências: logs de acesso, decisões, DPIAs quando aplicável

Saídas: mapa de dados; processos de direitos; evidências para auditoria.
Erros comuns: coletar "por precaução"; sem processo de exclusão; logs com PII excessivo.

---

## Checklists Rápidos

### Code review de segurança (backend/API)
- [ ] Authz explícita em todo endpoint que retorna dados sensíveis
- [ ] Input validation (tipo, tamanho, allowlist); sem concatenação em SQL
- [ ] Segredos não em código/config; uso de vault
- [ ] Logs sem PII/tokens; erro genérico ao usuário
- [ ] Headers de segurança (CORS, CSP, HSTS quando aplicável)

### Code review de segurança (frontend)
- [ ] Sem innerHTML com input do usuário; escape/DOMPurify
- [ ] Tokens em httpOnly cookie ou storage seguro; não em localStorage para refresh token
- [ ] CSRF token em formulários de estado alterante
- [ ] Dependências sem vulnerabilidades conhecidas

### Code review de segurança (LLM/Agent)
- [ ] Input do usuário não injetado como instrução
- [ ] Output validado antes de executar (tool call, redirect)
- [ ] Tool allowlist; authz por tool
- [ ] Limites de iteração, tokens, custo
- [ ] Rastreabilidade (contexto + tools + output)

### Deploy seguro
- [ ] Imagem sem segredos; assinada
- [ ] Least privilege no runtime (service account, network policy)
- [ ] Secrets via vault/injeção; não em manifest
- [ ] Logs e métricas de segurança (auth failures, rate limit hits)

---

## Templates

### Postmortem de segurança
```
Resumo: [o que aconteceu + impacto]
Severidade: [crítico/alto/médio]
Timeline: [eventos e ações]
Detecção: [como percebemos; tempo até detectar]
Contenção: [o que funcionou; tempo até conter]
Causa raiz: [técnica, processo, humano]
Fatores contribuintes: [ ]
Ações corretivas (com dono e prazo):
- Contenção imediata: [ ]
- Hardening: [ ]
- Prevenção: [ ]
Evidências preservadas: [sim/não; onde]
Comunicação: [interna/externa; regulador]
```

### ADR de segurança
```
Título: [decisão de controle]
Contexto: [ameaça que mitiga; requisito]
Decisão: [controle escolhido]
Alternativas consideradas: [ ]
Consequências: [operacional, custo, UX]
Revisão: [quando reavaliar]
```

### Aceitação de risco
```
Risco: [descrição]
Impacto: [se explorado]
Mitigação atual: [ ]
Razão da aceitação: [temporária, custo, etc.]
Responsável: [ ]
Revisão em: [data]
```

---

## Índice Rápido

| Situação | Playbook |
|----------|----------|
| CVE / pen test finding / authz quebrado | Vulnerabilidade em produção |
| Feature nova / refactor / integração | Threat modeling (STRIDE) |
| Comprometimento / vazamento / acesso não autorizado | Incidente de segurança |
| Agente/LLM com tools / RAG / chatbot | Prompt injection e segurança de LLM |
| Nova API / mudança de permissões / SSO | Authn/Authz — revisão e hardening |
| CVE em dependência / deploy / compliance | Supply chain e dependências |
| Segredo em código / vazamento / auditoria | Segredos e credenciais |
| Dados pessoais / LGPD / GDPR / auditoria | Compliance e privacidade |

---

## Glossário

- **STRIDE**: Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege
- **IDOR**: Insecure Direct Object Reference — acessar recurso de outro usuário
- **SBOM**: Software Bill of Materials — inventário de componentes
- **SLSA**: Supply-chain Levels for Software Artifacts — níveis de integridade
- **Zero trust**: never trust, always verify; authz em todo ponto
- **RCE**: Remote Code Execution
- **SSRF**: Server-Side Request Forgery
- **MFA**: Multi-Factor Authentication
- **DPIAs**: Data Protection Impact Assessments
