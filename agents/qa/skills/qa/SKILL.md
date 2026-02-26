---
name: qa-ops
description: Operational playbooks, templates, and checklists for the QA Engineer — test strategy, E2E with Playwright, performance testing with K6, accessibility audits, security testing, contract testing, flaky test debugging, and mutation testing.
---

# QA — Operational Playbooks

## Triage (2 min)

Universal checklist:
1. What is the symptom: failing test, production bug, regression, flaky test, performance, accessibility?
2. Impact scope: how many tests/flows/users affected? Is it a critical flow?
3. Timeline: "when did it start?" "what changed?" (commit, dependency, CI config, test data, infra)
4. Reproducibility: can I reproduce locally? In CI? With specific data?
5. Classification: code bug, test bug, environment issue, data issue, or timing (flaky)?
6. Immediate action: quarantine flaky; create bug report with steps-to-reproduce; escalate if critical flow.

Risk posture:
- **Low**: unit test failing due to refactor, no prod impact → fix test, verify it covers behavior
- **Medium**: secondary flow bug, workaround possible → detailed bug report, regression test, prioritized fix
- **High**: critical flow bug (login, payment, data) without workaround → escalate, hotfix with regression test, postmortem

With missing data:
- "Can't reproduce. Assuming timing/race condition because it only fails in CI with parallelism. Will isolate with controlled retry and instrument logs for 24h."
- If bug reported without steps: ask for screenshot/video/console-log before investigating blind.

## Playbooks

### Test Strategy for New Project
When: new project, rewrite, or existing project without defined strategy.
Goal: define Testing Trophy, risk matrix, coverage targets, and tooling.
Required inputs: functional requirements, critical flows, tech stack, timeline, team.

Steps:
1. Map critical business flows (login, checkout, main CRUD, integrations). Classify by risk (impact × failure frequency).
2. Define Testing Trophy: integration > unit > E2E. Static analysis (TypeScript, ESLint) as the base.
3. Select tools: Vitest (unit/integration), Testing Library (component), Playwright (E2E), MSW (API mock), K6 (performance), axe-core (a11y).
4. Set realistic targets: coverage as guardrail (e.g. > 70% on business logic), not absolute goal. Mutation score > 60% on critical modules.
5. Configure CI: unit/integration on every PR (< 5 min); E2E on merge to main (< 15 min with sharding); performance on schedule/release.
6. Create test plan with risk matrix and ownership.
7. Establish conventions: naming (`should [action] when [condition]`), structure (arrange/act/assert), file locations.

Output: test plan, CI configured, tools installed, conventions documented, risk matrix.
QA checklist: critical flows covered? CI runs < 10 min? tools integrated? conventions reviewed by team?
Common mistakes: starting with E2E (expensive and brittle); focusing on coverage number vs quality; not configuring CI parallelism.
Escalate: if no agreement on what is "critical" → PM + Tech Lead.

---

### Production Bug Investigation
When: bug reported by user, detected by monitoring, or found in exploratory testing.
Goal: reproduce, isolate cause, fix, and prevent regression.
Required inputs: bug description, steps to reproduce (when available), logs/traces, affected environment.

Steps:
1. Confirm the bug: reproduce locally or in staging with the same data/conditions. If can't reproduce, instrument (logs, feature flag for canary).
2. Isolate: which layer fails? (frontend, API, DB, third-party, data). Use `git bisect` if recent regression.
3. Find root cause: not "where it breaks" but "why this state occurs" (invalid input, race condition, inconsistent state, edge case).
4. Write regression test BEFORE the fix: test must fail with the bug and pass with the fix.
5. Apply minimal, focused fix — avoid "refactoring while fixing" in a hotfix.
6. Validate: regression test passes, full suite passes, manual spot-check on affected flow.
7. Document: update bug report with root cause and prevention; review risk matrix.

Output: fix + regression test + updated bug report + documented prevention.
QA checklist: reproducible? regression test exists? fix doesn't introduce regression? root cause addressed (not symptom)?
Escalate: if can't reproduce in 30 min; if multiple services involved; if security/data issue.

---

### E2E Setup with Playwright
When: new project needs E2E, Cypress migration, or existing E2E is brittle/slow.
Goal: reliable, fast (parallel), CI-integrated E2E with page objects and fixtures.
Required inputs: mapped critical flows, staging/preview environment, frontend stack.

Steps:
1. Install Playwright and configure `playwright.config.ts`: browsers (chromium minimum), baseURL, global timeout, retries (0 local, 1 CI).
2. Create folder structure: `e2e/`, `e2e/fixtures/`, `e2e/pages/`, `e2e/helpers/`.
3. Implement Page Object Model for main pages: encapsulate selectors and actions, use `getByRole`/`getByLabel`/`getByText` (accessibility-first).
4. Create custom fixtures: authenticated user, seeded data, API intercepts with `page.route()`.
5. Write tests by critical flow: login, main CRUD, checkout, navigation. One `test()` per scenario, descriptive names.
6. Configure parallelism: `fullyParallel: true`, sharding in CI (`--shard=1/4`).
7. Integrate in CI: run on merge/PR with sharding; store traces and screenshots on failure as artifacts.

Output: E2E suite running in CI, page objects, fixtures, parallelism configured, failure artifacts.
QA checklist: tests independent (no order dependency)? parallelism without data conflicts? artifacts on failure? reasonable timeout (< 30s per test)?
Common mistakes: CSS class selectors (brittle); order-dependent tests; no data cleanup; timeout too high (hides slowness).
Escalate: if staging environment is unstable → DevOps.

---

### Performance and Load Testing
When: before launch, after significant change, when SLO is defined, when bottleneck is suspected.
Goal: validate the system handles expected load, identify bottlenecks, establish baselines.
Required inputs: SLOs (p95, p99, throughput), usage scenarios (endpoints, flows), representative environment.

Steps:
1. Define scenarios: most-used endpoints (80/20), critical flows, expected peaks.
2. Configure K6: `options` with stages (ramp-up, steady, ramp-down), thresholds (`http_req_duration['p(95)'] < 500`), VUs.
3. Create baseline: run under normal load and record metrics (latency p50/p95/p99, throughput, error rate).
4. Load test: gradually increase to expected load; observe where degradation begins.
5. Stress test: exceed expected load; identify breaking point and how the system degrades (graceful vs crash).
6. Identify bottlenecks: slow DB queries? CPU-bound? Memory leak? Connection pool? External API?
7. Document results: compare to SLOs, identify actions, prioritize by impact.

Output: performance report with baselines, identified bottlenecks, prioritized actions.
QA checklist: representative environment? realistic data? SLOs defined? repeatable results?
Common mistakes: testing in non-representative environment; no warmup; ignoring error rate; no baseline.
Escalate: if bottleneck is infra (DB, network, cloud) → DevOps/Backend. If SLO needs renegotiation → PM.

---

### Accessibility Audit
When: new project, pre-release, after redesign, user complaint, legal requirement.
Goal: identify and fix accessibility violations; achieve WCAG 2.2 AA minimum.
Required inputs: pages/flows to audit, criteria (WCAG 2.2 A/AA), available tools.

Steps:
1. Run axe-core automated on all pages/components (integrate in CI: `@axe-core/playwright` or `jest-axe`).
2. Classify violations by severity: critical (full blocker), serious (significant barrier), moderate, minor.
3. Manual keyboard test: Tab, Enter, Escape, arrow key navigation. All interactive elements reachable? Focus visible?
4. Screen reader test (NVDA/VoiceOver): critical flow end-to-end. Does content make sense without visuals?
5. Check color contrast: minimum 4.5:1 ratio (normal text), 3:1 (large text).
6. Verify: images with alt text, forms with labels, landmarks (header/nav/main/footer), ARIA only when necessary.
7. Document issues with screenshot, WCAG violation, severity, and fix suggestion.

Output: accessibility report with classified violations, prioritized actions, CI check configured.
QA checklist: zero critical/serious on main flows? keyboard-only functional? screen reader tested? CI check exists?
Common mistakes: relying only on automated tools (catch ~30-40% of problems); unnecessary ARIA; testing only with mouse.
Escalate: significant redesign → Designer. Legal/compliance requirement → PM + Legal.

---

### Security Testing for Frontend / API
When: new endpoint, auth flow, user input, pre-release, pen test finding.
Goal: validate OWASP top risks are covered by automated tests.
Required inputs: endpoints/flows to test, auth mechanism, user inputs, relevant OWASP checklist.

Steps:
1. Map attack surface: user inputs, auth endpoints, file upload, redirects, API responses rendered.
2. Test XSS: inject `<script>`, event handlers, SVG payloads in all inputs; validate output is sanitized.
3. Test CSRF: mutating endpoints require token? Cookies with SameSite? Referrer validation?
4. Test auth/authz: no-token access returns 401? Access to other user's resource returns 403? Expired token rejected? Privilege escalation blocked?
5. Test input validation: SQL injection patterns, path traversal, oversized payloads, invalid types. Validate API rejects with correct status (400/422).
6. Test rate limiting: sensitive endpoints (login, password reset) have throttling?
7. Validate security headers: Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security.

Output: security report, automated tests for regression, prioritized issues.
QA checklist: OWASP top 10 covered? auth flow tested? inputs validated server-side? headers configured?
Common mistakes: testing only frontend (easily bypassed); ignoring authz (testing only authn); not testing with another user's token.
Escalate: active production vulnerability → Backend + Security immediately.

---

### Flaky Test Debugging
When: intermittently failing test, unstable CI, decreasing suite confidence.
Goal: find root cause, fix or quarantine, restore suite confidence.
Required inputs: identified flaky tests, CI logs (passes and failures), environment (local vs CI).

Steps:
1. Identify: use CI analytics to find tests with failure rate > 0% and < 100%. Categorize.
2. Quarantine immediately: move to separate suite or mark as `skip` with a tracking ticket. Do not let it pollute the main suite.
3. Reproduce: run the test N times (`--repeat-each=20` in Playwright). If it doesn't fail locally, investigate environment differences (CI runners, parallelism, network, timing).
4. Classify root cause:
   - **Timing/race condition**: waitFor, polling, animation — use `expect.poll()`, `toBeVisible()`, `networkidle` carefully
   - **Shared state**: non-isolated tests, shared DB, persisting localStorage — ensure cleanup
   - **External dependency**: real API, DNS, third-party — mock at the boundary
   - **Resource contention**: parallelism competing for port, file, DB — isolate resources per worker
   - **Data-dependent**: random data triggers edge case — use fixed seeds or seeded Faker
5. Fix: apply a fix specific to the root cause (not "add retry and pray").
6. Validate: run 50+ times to confirm stability. Monitor for 1 week.
7. Remove from quarantine and document cause for team learning.

Output: flaky fixed or removed, cause documented, stable suite.
QA checklist: flaky rate < 1%? quarantine empty? causes documented? CI stable for 1 week?
Common mistakes: "add retry" as a fix; ignoring and coexisting; not isolating test data.
Escalate: if cause is CI infra (runner, network, resources) → DevOps.

---

### Mutation Testing with Stryker
When: validate that existing tests actually detect bugs; improve suite quality; critical code.
Goal: measure and improve test effectiveness (not just coverage, but real detection).
Required inputs: existing test suite, code to analyse (focus on business logic), Stryker configured.

Steps:
1. Install Stryker and configure: `stryker.conf.mjs` with relevant mutators, files/folders to mutate, thresholds.
2. Start with limited scope: a critical module, not the whole project (mutation testing is slow).
3. Analyse report: mutation score (% of mutants killed). Score < 60% = weak tests; > 80% = good.
4. Identify "survived mutants": these are bugs your tests don't detect. Prioritise by code criticality.
5. Write tests to kill survivors: focus on missing assertions, edge cases, boundary conditions.
6. Run again and compare score. Iterate.
7. Integrate in CI for critical modules (as guardrail, not absolute gate): alert if mutation score drops.

Output: mutation score report, improved tests, CI guardrail.
QA checklist: focused scope (not everything)? survived mutants analysed? score improved? CI integrated for critical modules?
Common mistakes: running on everything (too slow); targeting 100% score (diminishing returns); ignoring mutants in trivial code.
Escalate: if very low score indicates structural test problem → whole team needs alignment on testing practices.

---

## Templates

### Test Plan
```
Project/Feature:
Date:
Author:

Objective:

Scope (IN):
- [flow/feature 1]
- [flow/feature 2]

Out of scope (OUT):
- [what won't be tested and why]

Risk Matrix:
| Flow | Impact | Failure Probability | Priority |
|------|--------|---------------------|----------|
|      |        |                     |          |

Testing Trophy:
- Static: TypeScript + ESLint (all code)
- Unit: [what]
- Integration: [what]
- E2E: [critical flows only]
- Performance: [which endpoints, when]

Tools: Vitest / Playwright / MSW / K6 / axe-core

Coverage targets:
- Business logic: > [X]%
- Critical flows: E2E coverage
- Mutation score: > [X]% in [modules]

CI plan:
- On every PR: [which tests, expected time]
- On merge to main: [which tests]
- On release: [which tests]

Definition of done:
- [ ] Critical flows have E2E coverage
- [ ] No unaddressed critical/serious a11y violations
- [ ] Auth flows security-tested
- [ ] CI runs < [X] min
- [ ] Zero unquarantined flaky tests
```

### Bug Report
```
Title: [short description]
Severity: critical / high / medium / low
Affected flow: [login / checkout / CRUD / ...]

Steps to reproduce:
1.
2.
3.

Expected result:
Actual result:

Environment: [browser, OS, staging/prod, user role]
Reproducibility: always / intermittent (X/10 times)

Logs/screenshots: [attach]
First occurrence: [date/commit]
What changed: [deploy, config, data]

Regression test: [ ] exists / [ ] needs to be created
```

### Regression Test Checklist
```
[ ] Test reproduces the bug before fix
[ ] Test passes after fix
[ ] Test name describes the behaviour: "should [action] when [condition]"
[ ] Test is in the right layer (unit / integration / E2E)
[ ] No flaky behaviour (run 10+ times)
[ ] Test added to CI pipeline
[ ] Bug report updated with test reference
```

## Senior Heuristics

H1: "Test what the user does, not how the code works." — Testing Library philosophy
H2: "A flaky test is worse than no test — it destroys confidence in the suite."
H3: "Coverage is a thermometer, not a cure. 80% with bad tests is worse than 60% with good tests."
H4: "If the test doesn't fail when behaviour changes, it tests nothing." — Mutation testing philosophy
H5: "Shift-left: the earlier you detect, the cheaper to fix. Shift-right: monitor in production what you can't test before."
H6: "Arrange/Act/Assert — without this structure, the test is incomprehensible in 3 months."
H7: "Mock at the boundary, not in the middle. If you need to mock 5 things, the design is too coupled."
H8: "Test name is documentation: 'should display error when API returns 500' tells a story."
H9: "Parallelism and sharding are CI features, not luxuries. Slow suite = delayed feedback = bugs escape."
H10: "Accessibility is not a post-release checklist — it's an acceptance criterion from design."
