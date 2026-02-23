---
name: mobile-ops
description: Playbooks operacionais, templates e checklists para Mobile Developer — setup de projeto, arquitetura, performance, offline-first, release management, debugging, push notifications, animações, integração nativa, testes, deep links e acessibilidade mobile.
---

# Mobile Developer — Playbooks Operacionais

## Triagem (2 min)

Checklist universal:
1. Qual é o sintoma primário: crash, ANR, performance, tela branca, store rejection, push não chega, deep link quebrado?
2. Escopo do impacto: % de usuários, plataforma (iOS/Android/ambos), versão do app, versão do OS, device específico?
3. Linha do tempo: "quando começou?" "o que mudou?" (release, OTA update, mudança de API, nova dependência)
4. É reproduzível? Em qual device/OS? Simulador ou device real?
5. Safety check: há risco de dados do usuário? Dados sensíveis expostos em logs/crash reports?
6. Pare o sangramento: rollback OTA, disable feature flag, reverter store release, degradar gracefully

Risco e postura:
- **Baixo**: bug visual, edge case em device raro, impacto cosmético → fix no próximo release cycle + monitor
- **Médio**: performance degradada, funcionalidade parcialmente quebrada, crash reproduzível → OTA fix (se JS-only) ou fast-track store release + monitor
- **Alto**: crash generalizado, data loss, segurança comprometida, store rejection → rollback OTA imediato; halt store rollout; expedited review; comunicar stakeholders

Com dados faltantes:
- "Não consigo reproduzir" → verifique: device real? mesmo OS version? mesma versão do app? rede? estado do storage?
- Colete breadcrumbs do Sentry: navegação do usuário, estado da rede, memória disponível
- Crash sem stacktrace: verifique source maps (uploadados?), symbolication (dSYMs/Proguard mappings)

Causa → efeito (mapas rápidos):
- Trabalho pesado no JS thread → frame drops → scroll janky → UX "lenta" → rating cai
- Sem offline handling → erro/tela branca em túnel/elevador → frustração → desinstalação
- Bundle grande → cold start lento → first impression ruim → abandono
- OTA sem rollback → bug propagado para 100% → crash-free rate despenca
- Images sem resize/cache → memory spikes → OOM → crash em devices low-end
- Re-renders excessivos → JS thread saturado → animações competem por frames → jank
- Deep link mal configurado → usuário cai na home ao invés do conteúdo → perda de conversão

## Playbooks

### Setup de projeto React Native/Expo
Quando usar: novo projeto mobile, migração de stack, kickoff.
Objetivo: projeto estruturado, navegável, testável e pronto para CI/CD desde o dia 1.
Entradas mín.: requisitos de produto, plataformas alvo, decisão managed vs bare.
Passos:
1. Inicialize com `npx create-expo-app@latest` com Expo SDK 52+ e template TypeScript
2. Configure `tsconfig.json` com strict mode e path aliases
3. Estruture por features: `app/` (Expo Router screens), `src/features/`, `src/shared/`, `src/services/`
4. Configure Expo Router v4 com file-based routing e layouts
5. Setup state management: Zustand para client state, TanStack Query para server state
6. Configure MMKV para storage local persistente
7. Setup EAS: `eas.json` com profiles (development, preview, production), `eas build` e `eas submit`
8. Configure Sentry para crash reporting (upload source maps via EAS build hooks)
9. Setup Jest + React Native Testing Library; configure Detox para E2E
10. Configure ESLint + Prettier com regras específicas para React Native
Saídas: projeto buildável em iOS/Android; CI/CD com EAS; estrutura escalável; testes rodando.
QA checklist: build funciona em ambas plataformas; testes passam; TypeScript sem erros; Sentry recebendo eventos.
Erros comuns: não configurar path aliases; esquecer source maps; não testar build nativo cedo.
Alertas: teste build nativo no primeiro dia; "funcionar no Expo Go" não é garantia.
Escalonar: se precisar de módulo nativo não suportado, avalie Expo Modules API antes de eject.

### Arquitetura de app mobile
Quando usar: definir estrutura do app, refatorar app existente, escalar equipe.
Objetivo: arquitetura que escala com features e time sem virar monólito de telas.
Entradas mín.: escopo de features, requisitos offline, complexidade de navegação.
Passos:
1. Organize por feature, não por tipo:
```
src/
  features/
    auth/          # screens, hooks, components, api, store
    home/
    profile/
  shared/
    components/    # design system
    hooks/
    utils/
    services/      # api client, storage, notifications
app/               # Expo Router file-based routes
  (tabs)/
    index.tsx
    profile.tsx
  auth/
    login.tsx
  _layout.tsx
```
2. Defina camadas: UI (componentes puros) → Hooks (lógica) → Services (IO/API/storage)
3. Server state com TanStack Query: queries, mutations, optimistic updates, prefetching
4. Client state com Zustand: mínimo, só UI state que não vem do servidor
5. Navegação com Expo Router: layouts aninhados, type-safe routes, deep link config
6. Defina convenções: naming, exports, barrel files (com moderação para tree-shaking)
Saídas: arquitetura documentada; feature template; convenções de time.
QA checklist: features isoladas; sem dependência circular; navegação type-safe; state management claro.
Erros comuns: "shared" virando dump de tudo; state global para tudo; navegação hardcoded.
Alertas: barrel files (`index.ts` re-exporting) podem prejudicar tree-shaking; use com critério.
Escalonar: arquiteto se precisar de decisão de monorepo ou micro-frontends mobile.

### Performance optimization
Quando usar: frame drops, cold start lento, memória alta, bundle grande, scroll janky, ANR.
Objetivo: atingir e manter 60fps, cold start <2s, bundle otimizado.
Entradas mín.: métricas atuais (FPS, cold start, bundle size, memory), Sentry performance data, profiling.
Passos:
1. Meça antes de otimizar: use React Native Performance Monitor, Flipper, Sentry Performance
2. JS thread — identifique trabalho pesado (serialização, cálculos, re-renders):
   - Use `React.memo`, `useMemo`, `useCallback` com critério (não em tudo)
   - Mova cálculos pesados para `InteractionManager.runAfterInteractions()`
   - Elimine `console.log` em produção (babel plugin `transform-remove-console`)
3. Listas — substitua `FlatList` por `FlashList`; configure `estimatedItemSize`:
```typescript
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={80}
  keyExtractor={keyExtractor}
/>
```
4. Imagens — use `expo-image` com placeholder, caching e resize automático:
```typescript
import { Image } from 'expo-image';
<Image
  source={uri}
  style={{ width: 200, height: 200 }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>
```
5. Bundle size: analise com `npx expo export --dump-sourcemap` + source-map-explorer; remova deps não usadas; lazy imports para telas pesadas
6. Cold start: minimize inicialização síncrona; lazy loading para features não críticas; MMKV > AsyncStorage
7. Memory: monitore com Xcode Instruments / Android Profiler; limpe listeners em cleanup; evite closures com referências grandes
8. Hermes: confirme que está ativo (bytecode precompilado); verifique compat de libs
Saídas: métricas antes/depois; patches aplicados; baseline documentado.
QA checklist: 60fps em scroll e animações; cold start <2s; sem memory leaks; bundle analisado.
Erros comuns: `React.memo` em tudo; otimizar sem medir; ignorar device low-end.
Alertas: teste em device real low-end (não só flagship); simulador não reflete performance real.
Escalonar: se problema é no native layer (Fabric/TurboModules); se precisa de profiling nativo.

### Offline-first com sincronização
Quando usar: app precisa funcionar sem rede (total ou parcialmente), dados locais com sync.
Objetivo: UX resiliente sem rede; dados consistentes quando reconectar; conflitos tratados.
Entradas mín.: quais fluxos precisam funcionar offline, modelo de dados, política de conflitos.
Passos:
1. Defina "offline capability matrix": quais features funcionam offline (read/write/ambos)
2. Storage local com MMKV (dados simples/config) ou SQLite via `expo-sqlite` (dados relacionais)
3. Queue de operações pendentes:
```typescript
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  payload: unknown;
  createdAt: number;
  retryCount: number;
}
```
4. Detecção de rede: `@react-native-community/netinfo` para estado e tipo de conexão
5. Sync engine: quando online, processe queue em FIFO; retry com backoff; marque como synced
6. Conflict resolution: defina estratégia (last-write-wins, server-wins, merge, ou manual)
7. Optimistic UI: aplique mutation localmente; rollback se sync falhar
8. TanStack Query com `networkMode: 'offlineFirst'` e `gcTime` adequado para cache persistente
9. Indicadores visuais: mostre estado de sync (synced, pending, error) para o usuário
Saídas: fluxos offline funcionando; sync confiável; UX com feedback de estado.
QA checklist: app usável sem rede; sync funciona ao reconectar; conflitos tratados; sem data loss.
Erros comuns: não testar "avião mode" real; sync sem retry; conflitos ignorados; queue sem limite.
Alertas: teste com conexão intermitente (não só on/off); considere partial sync para datasets grandes.
Escalonar: backend para API de sync/conflict resolution; arquiteto se precisar de CRDT ou sync protocol.

### Release management (App Store/Play Store)
Quando usar: novo release, hotfix, staged rollout, OTA update.
Objetivo: releases previsíveis, controláveis e reversíveis; crash-free rate >99.5%.
Entradas mín.: changelog, versão, build profiles (EAS), critérios de go/no-go, rollout plan.
Passos:
1. Versionamento: semver (`major.minor.patch`); `buildNumber` (iOS) / `versionCode` (Android) incrementados; configure em `app.config.ts`
2. Build com EAS:
```bash
eas build --platform all --profile production
```
3. Teste interno: distribua via EAS (internal distribution) ou TestFlight/Internal Testing Track
4. Submit:
```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```
5. Staged rollout (Android): comece com 5–10% → monitore 24–48h → aumente gradualmente
6. OTA updates para JS-only changes:
```bash
eas update --branch production --message "fix: resolve checkout crash"
```
7. Monitor pós-release: crash-free rate, ANR rate, store ratings, Sentry alerts
8. Rollback: OTA → publique update com bundle anterior. Store → halt rollout (Android) ou expedited review (Apple)
Saídas: release publicado; métricas de estabilidade; rollback plan testado.
QA checklist: build em ambas plataformas; staged rollout configurado; crash reporting ativo; source maps uploadados.
Erros comuns: versionCode não incrementado (rejeição Play Store); OTA com mudança nativa (crash); rollout 100% sem staging.
Alertas: Apple não tem staged rollout nativo (use phased release); OTA NÃO pode incluir mudanças nativas.
Escalonar: DevOps se pipeline precisa de ajuste; PM se precisa de decisão de go/no-go.

### Debugging de crash/ANR
Quando usar: crash em produção, ANR rate alto, bug não reproduzível, regression após release.
Objetivo: identificar, reproduzir e corrigir crash/ANR com evidências; prevenir regressão.
Entradas mín.: Sentry/Crashlytics reports, device/OS info, versão do app, steps to reproduce.
Passos:
1. Confirme: é JS crash (error boundary catch) ou native crash (signal/exception)?
2. Para JS crashes: verifique source maps (uploadados e corretos?); analise stacktrace no Sentry
3. Para native crashes: verifique symbolication (dSYMs para iOS, Proguard/R8 mapping para Android)
4. Analise breadcrumbs: navegação do usuário, estado da rede, memória, últimas ações
5. Reproduza: mesmo device/OS? mesmo estado de dados? mesma sequência de navegação?
6. Para ANRs (Android): analise main thread blocked; verifique JS thread heavy work; procure sync operations em bridge
7. Use Hermes profiling para funções lentas:
```bash
npx react-native profile-hermes
```
8. Corrija, adicione teste de regressão, deploy via OTA (se JS-only) ou store release
Saídas: crash corrigido; teste de regressão; root cause documentada; métricas de impacto.
QA checklist: source maps corretos; crash não reproduzível após fix; teste em device afetado; crash-free rate recuperado.
Erros comuns: "não reproduzo no simulador" como desculpa; source maps desatualizados; não verificar symbolication.
Alertas: crashes sem source map são inúteis; configure upload automático no EAS build.
Escalonar: se crash é em módulo nativo de terceiro; se precisa de expertise iOS/Android nativo.

### Push notifications
Quando usar: implementar push, debug de notificações não chegando, notification channels, ações.
Objetivo: push confiável, bem categorizado, com deep link funcional e respeito à UX.
Entradas mín.: tipos de notificação, prioridades, deep links associados, plataformas.
Passos:
1. Setup com Expo Notifications:
```typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```
2. Solicite permissão pós-onboarding, com contexto (não no app launch):
```typescript
const { status } = await Notifications.requestPermissionsAsync();
```
3. Obtenha push token e envie ao backend:
```typescript
const token = await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig?.extra?.eas?.projectId,
});
```
4. Configure notification channels (Android):
```typescript
Notifications.setNotificationChannelAsync('orders', {
  name: 'Pedidos',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'default',
});
```
5. Handle notification tap (deep link):
```typescript
const lastNotificationResponse = Notifications.useLastNotificationResponse();
useEffect(() => {
  if (lastNotificationResponse) {
    const url = lastNotificationResponse.notification.request.content.data?.url;
    if (url) router.push(url);
  }
}, [lastNotificationResponse]);
```
6. Teste: push em foreground, background e killed state; teste em device real (simulador não recebe push)
Saídas: push funcional em ambas plataformas; deep links funcionando; channels configurados.
QA checklist: permissão com contexto; push em todos os estados; deep link abre tela correta; unsubscribe funciona.
Erros comuns: pedir permissão no primeiro launch; não testar killed state; ignorar channels no Android.
Alertas: Expo push tokens expiram — implemente refresh; iOS provisional notifications para soft-ask.
Escalonar: backend para FCM/APNs server-side; se precisar de rich notifications complexas.

### Animações de alta performance
Quando usar: animações durante gestos, transições de tela, scroll-driven, layout animations.
Objetivo: animações fluidas (60fps) no UI thread, sem bloquear JS thread.
Entradas mín.: tipo de animação, trigger (gesto/scroll/mount), complexidade, plataformas.
Passos:
1. Use Reanimated 3 com worklets (UI thread via JSI):
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const offset = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
}));
```
2. Gestos com Gesture Handler 2 integrado ao Reanimated:
```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const pan = Gesture.Pan()
  .onUpdate((e) => {
    offset.value = e.translationX;
  })
  .onEnd(() => {
    offset.value = withSpring(0);
  });
```
3. Layout animations para mount/unmount:
```typescript
<Animated.View entering={FadeIn.duration(300)} exiting={FadeOut} />
```
4. Shared element transitions (Expo Router):
```typescript
<Animated.Image sharedTransitionTag={`item-${id}`} source={source} />
```
5. Evite: `Animated` API legada para animações complexas; `setState` dentro de gesture handlers; `useNativeDriver` (obsoleto com Reanimated 3)
6. Teste FPS com React Native Performance Monitor ou Perf Monitor (dev menu)
Saídas: animações fluidas em device real; sem frame drops durante gesto; transições smooth.
QA checklist: 60fps em device real (não simulador); sem jank em device low-end; animações canceláveis.
Erros comuns: animar no JS thread; não testar em device low-end; animações que bloqueiam interação.
Alertas: Reanimated worklets têm limitações (sem acesso a estado React); use `useSharedValue`.
Escalonar: se precisar de animações nativas custom (Lottie, Skia); se problema é no native layer.

### Integração com APIs nativas
Quando usar: funcionalidade que não existe em Expo SDK; SDK nativo proprietário; bridge custom.
Objetivo: acessar funcionalidade nativa com type-safety e sem comprometer a experiência JS.
Entradas mín.: qual API nativa, plataformas, se existe módulo Expo/community, requisitos de performance.
Passos:
1. Verifique primeiro: existe no Expo SDK? Existe na community? (react-native-community, expo-community)
2. Se não existe, use Expo Modules API (preferível sobre bridge legada):
```typescript
// modules/my-native-module/index.ts
import { requireNativeModule } from 'expo-modules-core';
const MyModule = requireNativeModule('MyNativeModule');
export function doSomething(): string {
  return MyModule.doSomething();
}
```
3. Para New Architecture: use TurboModules (JSI-based, síncronos, type-safe via codegen)
4. Configure `expo-build-properties` para customizar native build settings sem eject
5. Teste em ambas plataformas; módulo que funciona em iOS pode não funcionar em Android
6. Documente: API surface, platform support, fallback para plataforma não suportada
Saídas: módulo nativo funcional; type-safe; testado em ambas plataformas.
QA checklist: funciona em iOS e Android; fallback para plataforma não suportada; não quebra build; sem memory leak.
Erros comuns: usar bridge legada quando Expo Modules API resolve; não testar ambas plataformas; módulo sem cleanup.
Alertas: cada módulo nativo aumenta complexidade de build; avalie ROI.
Escalonar: se precisar de expertise iOS (Swift/ObjC) ou Android (Kotlin/Java) nativo.

### Testes em mobile
Quando usar: setup de testes, definir estratégia, aumentar cobertura, CI.
Objetivo: confiança em releases; testes que pegam bugs reais sem flakiness excessiva.
Entradas mín.: stack atual, fluxos críticos, CI/CD setup, devices/simuladores disponíveis.
Passos:
1. Pirâmide de testes mobile: unit (muitos) → integration (médio) → E2E (poucos, críticos)
2. Unit/Integration com Jest + React Native Testing Library:
```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';

test('shows error on invalid input', () => {
  render(<LoginForm />);
  fireEvent.changeText(screen.getByTestId('email-input'), 'invalid');
  fireEvent.press(screen.getByText('Login'));
  expect(screen.getByText('Email inválido')).toBeTruthy();
});
```
3. Teste hooks com `renderHook`; teste stores (Zustand) em isolamento
4. E2E com Detox para fluxos críticos (login, checkout, onboarding):
```typescript
describe('Login Flow', () => {
  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('user@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
```
5. Snapshot testing com moderação: útil para design system; frágil para telas complexas
6. Configure CI: Jest em todo PR; Detox em branch principal ou pre-release
7. Device farms (AWS Device Farm, Firebase Test Lab) para cobertura de devices reais
Saídas: suíte de testes rodando; CI configurado; fluxos críticos cobertos por E2E.
QA checklist: testes não flakey; CI <10min para unit; E2E cobre fluxos críticos; coverage tracked.
Erros comuns: testar implementação (não comportamento); E2E frágeis; não mockar network adequadamente.
Alertas: Detox E2E são lentos; reserve para happy paths críticos; use Testing Library para lógica.
Escalonar: QA para estratégia mais ampla; DevOps para device farm setup.

### Gerenciamento de deep links e universal links
Quando usar: deep links para conteúdo específico, marketing campaigns, push notifications, app-to-app.
Objetivo: usuário chega ao conteúdo correto em qualquer estado (installed/not installed, cold/warm).
Entradas mín.: rotas do app, URLs a mapear, plataformas, behavior para app não instalado.
Passos:
1. Configure scheme e universal links em `app.config.ts`:
```typescript
export default {
  scheme: 'myapp',
  ios: {
    associatedDomains: ['applinks:myapp.com'],
  },
  android: {
    intentFilters: [{
      action: 'VIEW',
      autoVerify: true,
      data: [{ scheme: 'https', host: 'myapp.com', pathPrefix: '/item' }],
    }],
  },
};
```
2. Expo Router mapeia automaticamente URLs para rotas:
   - `https://myapp.com/item/123` → `app/item/[id].tsx`
3. Configure apple-app-site-association (iOS) e assetlinks.json (Android) no domínio
4. Teste todos os cenários:
   - App instalado, em foreground (warm)
   - App instalado, fechado (cold start)
   - App não instalado (deferred → store → open)
5. Deferred deep links: use Expo Linking ou serviço externo (Branch, Adjust)
6. Teste com `npx uri-scheme open "myapp://item/123" --ios` e equivalente Android
Saídas: deep links funcionando em todos os cenários; universal links verificados; deferred configurados.
QA checklist: cold start ok; warm start ok; universal links validados; fallback para web.
Erros comuns: apple-app-site-association incorreto; não testar cold start; esquecer autoVerify no Android.
Alertas: universal links são frágeis; qualquer erro no AASA/assetlinks quebra silenciosamente.
Escalonar: backend/DevOps para AASA/assetlinks no domínio; marketing para estratégia de deep link.

### Acessibilidade mobile
Quando usar: sempre (desde o primeiro componente); audit de acessibilidade; compliance.
Objetivo: app usável por todos, incluindo pessoas com deficiência visual, motora e cognitiva.
Entradas mín.: guidelines (WCAG 2.2, Apple HIG, Material Design), fluxos críticos.
Passos:
1. Labels em todos os elementos interativos:
```typescript
<Pressable
  accessibilityLabel="Adicionar ao carrinho"
  accessibilityHint="Adiciona este item ao seu carrinho de compras"
  accessibilityRole="button"
  onPress={handleAddToCart}
>
  <Icon name="cart-plus" />
</Pressable>
```
2. Touch targets mínimo 44x44pt (Apple) / 48x48dp (Google):
```typescript
<Pressable style={{ minWidth: 48, minHeight: 48 }} hitSlop={8} />
```
3. Dynamic type (iOS) e font scaling (Android): use unidades relativas; teste com font size máximo
4. Reduced motion — respeite preferência do usuário:
```typescript
import { useReducedMotion } from 'react-native-reanimated';
const reducedMotion = useReducedMotion();
const duration = reducedMotion ? 0 : 300;
```
5. Screen reader: teste com VoiceOver (iOS) e TalkBack (Android); garanta ordem de leitura lógica
6. Contraste: mínimo 4.5:1 para texto normal, 3:1 para texto grande
7. Grouping: agrupe elementos relacionados com `accessibilityElementsHidden`, `importantForAccessibility`
8. Teste automatizado: `eslint-plugin-react-native-a11y` para catching básico em lint
Saídas: app acessível; audit passando; compliance documentado.
QA checklist: VoiceOver/TalkBack navegáveis; touch targets ok; contraste ok; font scaling não quebra layout.
Erros comuns: acessibilidade como "fase final"; labels genéricos; ignorar font scaling; não testar com screen reader.
Alertas: acessibilidade afeta ASO e é requisito legal em muitos mercados.
Escalonar: designer para contraste e hierarquia visual; QA para audit completo; legal para compliance.

## Templates

### Executivo (status de release/incidente mobile)
Quando usar: comunicar para stakeholders durante incidente, release ou decisão.
Erros comuns: detalhe técnico demais; não mencionar impacto em store rating; prometer fix sem timeline.
```
Título: [INCIDENTE/RELEASE] — [app] — [data/hora]
Plataformas afetadas: [iOS / Android / ambos]
Impacto: [% usuários, crash-free rate, store rating]
Versão(ões) afetadas: [ex.: 2.3.1 (build 45)]
Status agora: [estável / degradado / investigando / em rollout]
O que sabemos (fatos):
- [Fato 1]
- [Fato 2]
O que achamos (inferências):
- [Inferência 1 — por quê]
Ações tomadas:
- [ação] → [efeito observado]
Próximas ações (com dono e ETA):
- [ação] — [dono] — [quando]
Pode resolver via OTA? [sim/não — por quê]
Riscos: [store rejection, data loss, rating impact]
```

### Plano de release mobile
Quando usar: release para stores ou OTA update significativo.
Erros comuns: não incrementar buildNumber/versionCode; OTA com mudança nativa; sem staged rollout.
```
App: [nome]
Versão: [ex.: 2.4.0]
Build: [iOS buildNumber / Android versionCode]
Tipo: [Store release / OTA update]
Changelog:
- [feature/fix 1]
- [feature/fix 2]
Pré-checks:
- [ ] Build passa em ambas plataformas (EAS)
- [ ] Testes E2E passando
- [ ] Source maps uploadados no Sentry
- [ ] Crash-free rate da versão anterior ok
Estratégia de rollout:
- Android: [staged %] → [observar Xh] → [expandir]
- iOS: [phased release ou full]
- OTA: [branch] → [% target] → [expandir]
Métricas de sucesso:
- Crash-free rate: >99.5%
- ANR rate: <0.5%
- Store rating: sem queda
Rollback plan:
- OTA: publicar update com bundle anterior
- Store: halt rollout (Android) / solicitar expedited review (iOS)
Owner: [nome]
Janela de observação pós-release: [24h / 48h / 72h]
```

### Bug report mobile (com device info)
Quando usar: reportar bug com informação suficiente para reproduzir.
Erros comuns: sem device info; sem versão do app; sem steps to reproduce; "não funciona" sem contexto.
```
Título: [descrição curta do bug]
Severidade: [critical / high / medium / low]
App version: [ex.: 2.3.1 (build 45)]
Platform: [iOS / Android]
OS version: [ex.: iOS 18.2 / Android 15]
Device: [ex.: iPhone 15 Pro / Pixel 8]
Network: [WiFi / 4G / 5G / offline]
Steps to reproduce:
1. [passo 1]
2. [passo 2]
3. [passo 3]
Expected: [o que deveria acontecer]
Actual: [o que aconteceu]
Frequency: [always / sometimes / once]
Sentry event ID: [se disponível]
Screenshots/video: [anexar]
Logs relevantes: [se disponível]
```

### Checklist pré-release (App Store/Play Store)
Quando usar: antes de submeter para review nas stores.
Erros comuns: metadata desatualizada; screenshots errados; permissões não justificadas.
```
## Build & Code
- [ ] Version bumped (semver)
- [ ] buildNumber (iOS) / versionCode (Android) incrementado
- [ ] TypeScript sem erros
- [ ] Testes passando (unit + E2E)
- [ ] Source maps uploadados
- [ ] console.log removido (babel plugin)
- [ ] Sem API keys hardcoded

## App Store Specific (iOS)
- [ ] Info.plist: permissões com descrições claras (NSCameraUsageDescription, etc.)
- [ ] App Transport Security: exceções justificadas
- [ ] Screenshots atualizados (6.7", 6.5", 12.9" iPad se universal)
- [ ] Privacy nutrition labels atualizadas
- [ ] Sign in with Apple (se tem social login)

## Play Store Specific (Android)
- [ ] Permissões mínimas no AndroidManifest
- [ ] Target SDK atualizado (requisito Google)
- [ ] Data safety form atualizado
- [ ] Screenshots atualizados (phone + tablet se universal)
- [ ] Proguard/R8 rules ok (sem crash em release build)

## Funcional
- [ ] Deep links funcionando (cold + warm start)
- [ ] Push notifications funcionando
- [ ] Offline behavior testado
- [ ] Acessibilidade básica ok (VoiceOver/TalkBack)
- [ ] Performance ok em device low-end

## Release
- [ ] Staged rollout configurado (Android)
- [ ] OTA rollback testado
- [ ] Crash reporting ativo
- [ ] Stakeholders comunicados
```

### Performance audit report
Quando usar: auditoria periódica ou investigação de degradação de performance.
Erros comuns: medir só no flagship; não comparar com baseline; otimizar sem impacto mensurável.
```
App: [nome] — Versão: [ex.: 2.3.1]
Data: [dd/mm/yyyy]
Devices testados: [ex.: iPhone 12 (mid), Pixel 6a (mid), Galaxy A14 (low)]

## Métricas
| Métrica | Baseline | Atual | Target | Status |
|---------|----------|-------|--------|--------|
| Cold start (ms) | | | <2000 | |
| TTI (ms) | | | <3000 | |
| FPS (scroll) | | | ≥58 | |
| JS bundle (MB) | | | <5 | |
| Memory peak (MB) | | | <300 | |
| Crash-free rate | | | >99.5% | |
| ANR rate | | | <0.5% | |

## Findings
1. [finding: descrição + impacto + evidência]
2. [finding]

## Recommendations (priorizado por impacto)
1. [ação] — impacto estimado: [ex.: -200ms cold start]
2. [ação]

## Próxima auditoria: [data]
```

### Architecture decision (mobile-specific)
Quando usar: escolher lib/padrão/abordagem para funcionalidade mobile.
Erros comuns: escolher por popularidade sem avaliar trade-offs mobile-specific; não considerar bundle impact.
```
Decisão: [ex.: "FlashList vs FlatList vs SectionList"]
Contexto: [por que essa decisão é necessária agora]
Opções avaliadas:
- A: [opção + prós/contras]
- B: [opção + prós/contras]
Critérios (peso):
- Performance (bundle + runtime): ( )
- DX (developer experience): ( )
- Manutenibilidade: ( )
- Platform compatibility: ( )
- Community/support: ( )
Decisão: [escolha]
Por quê: [justificativa com evidência]
Impacto em bundle: [+/- KB]
Trade-offs aceitos: [o que perdemos]
Quando revisitar: [trigger]
```

### Checklist de acessibilidade mobile
Quando usar: audit de acessibilidade; antes de release; design review.
Erros comuns: checklist como "fase final"; não testar com screen reader real.
```
## Screen Reader (VoiceOver/TalkBack)
- [ ] Todos os elementos interativos têm accessibilityLabel
- [ ] Ordem de leitura é lógica (segue hierarquia visual)
- [ ] Imagens decorativas marcadas como accessibilityElementsHidden
- [ ] Imagens informativas têm descrição
- [ ] Formulários: labels associados a inputs
- [ ] Alertas/modais anunciados corretamente

## Touch & Motor
- [ ] Touch targets ≥44pt (iOS) / 48dp (Android)
- [ ] Gestos complexos têm alternativa simples
- [ ] Sem ações time-dependent que não podem ser estendidas

## Visual
- [ ] Contraste texto/fundo ≥4.5:1 (normal) / 3:1 (grande)
- [ ] Font scaling não quebra layout (até 200%)
- [ ] Informação não depende só de cor
- [ ] Dark mode acessível

## Motion
- [ ] Reduced motion respeitada
- [ ] Sem flash/strobe >3 por segundo
- [ ] Animações não bloqueiam interação

## Testing
- [ ] Testado com VoiceOver (iOS)
- [ ] Testado com TalkBack (Android)
- [ ] Testado com font size máximo
- [ ] Testado com high contrast mode
```

### Migration plan (version upgrade)
Quando usar: upgrade de React Native, Expo SDK, dependência major, ou migração de arquitetura.
Erros comuns: upgrade sem changelog review; pular versions; não testar em ambas plataformas; sem rollback.
```
Migração: [ex.: Expo SDK 51 → 52]
Motivação: [por que agora]
Breaking changes identificadas:
- [ ] [change 1 — impacto + ação]
- [ ] [change 2 — impacto + ação]
Dependências afetadas:
- [ ] [dep 1 — versão atual → nova]
Plano de execução:
1. [passo 1 — branch, atualizar deps]
2. [passo 2 — resolver breaking changes]
3. [passo 3 — rodar testes]
4. [passo 4 — build iOS/Android]
5. [passo 5 — testar em device real]
6. [passo 6 — staged rollout]
Rollback: [como voltar se der errado]
Riscos:
- [risco 1 — mitigação]
Timeline: [estimativa]
Owner: [nome]
```

## Validação/Anti-burrice

Fato vs inferência (regra de ouro):
- **Fato**: observável, reproduzível, tem fonte (Sentry report, device log, metrics dashboard, store console)
- **Inferência**: hipótese explicativa; deve dizer "por quê" e "como vou validar em device real"

Checks mínimos antes de "concluir" (especialmente em bugs mobile):
1. Reproduziu em device real (não só simulador)?
2. Testou em ambas plataformas (iOS + Android)?
3. Testou em device low-end (não só flagship)?
4. Source maps estão corretos (stacktrace legível)?
5. Mediu antes/depois (FPS, cold start, crash-free rate)?

Testes mínimos por categoria:
- **Performance**: meça FPS + cold start + memory em device real low-end antes e depois
- **Offline**: teste com airplane mode real; teste reconexão; teste sync queue
- **Release**: build em ambas plataformas; staged rollout; OTA rollback testado
- **Deep links**: teste cold start + warm start + app não instalado
- **Push**: teste foreground + background + killed state em device real
- **Acessibilidade**: teste com VoiceOver + TalkBack; teste font scaling máximo
- **Navegação**: teste back button (Android hardware back); teste gestos de swipe-back (iOS)

Formato de suposição: "Assumo [X] porque [Y evidência]. Se [Z acontecer/medir em device real], então a suposição cai e eu faço [W]."

## Estilo Sênior

Perguntas que destravam:
1. "Isso acontece em device real ou só no simulador?"
2. "Qual thread está bloqueada: JS ou UI?"
3. "Isso pode ser resolvido com OTA ou precisa de store release?"
4. "Qual é o impacto no cold start / bundle size?"
5. "Funciona offline? E quando reconecta?"

A/B caminhos:
- **Caminho A (estabilizar)**: rollback OTA / halt store rollout → medir crash-free rate → depois causa raiz
- **Caminho B (investigar)**: só quando impacto é baixo e não afeta store rating/crash-free rate

Dizer "não" sem ser bloqueador:
- "Posso entregar essa feature, mas sem offline support ela vai quebrar em 30% dos cenários mobile. Sugiro MVP online-only com degradação graceful e offline na v2."
- "Essa animação custom precisa de 3 dias a mais para rodar a 60fps. Sem isso, vai jankar em Android mid-range."
- Amarre no quality bar: "Sem staged rollout e sem crash reporting, vira roleta russa com a store rating."

Negociar escopo como operador:
- Troque features por garantias: "Posso entregar menos telas, mas com offline, acessibilidade e 60fps."
- Prefira "staged rollout para 5%" a "release 100% na sexta à noite."
- "Podemos usar OTA para iterar rápido no JS, mas mudanças nativas precisam de store cycle completo."

## Índice Rápido

| Problema | Playbook |
|----------|----------|
| Frame drops / scroll lento / jank | Performance optimization |
| App não funciona sem rede | Offline-first com sincronização |
| Crash em produção / ANR | Debugging de crash/ANR |
| Precisa lançar na store | Release management |
| Push não chega / deep link quebrado | Push notifications / Deep links |
| Animação travando / gesture lag | Animações de alta performance |
| Precisa de funcionalidade nativa | Integração com APIs nativas |
| Setup de testes / coverage baixa | Testes em mobile |
| App inacessível / audit de a11y | Acessibilidade mobile |
| Novo projeto / kickoff | Setup de projeto React Native/Expo |
| Refactor de arquitetura | Arquitetura de app mobile |
| Upgrade de SDK / React Native | Template Migration plan |

## Glossário

- **JSI**: JavaScript Interface — comunicação síncrona entre JS e native, base da New Architecture
- **Fabric**: novo rendering system do React Native; renderiza views via C++ com JSI
- **TurboModules**: módulos nativos lazy-loaded via JSI; substituem o bridge legado
- **Hermes**: engine JS otimizada para React Native; compila para bytecode ahead-of-time
- **Worklet**: função que roda no UI thread via Reanimated; evita bridge para animações
- **EAS Build**: serviço de build cloud da Expo; gera binários iOS/Android
- **EAS Update**: OTA updates para JS bundle e assets; sem store review
- **EAS Submit**: submissão automatizada para App Store/Play Store
- **OTA**: Over-The-Air update; atualiza JS/assets sem passar pela store
- **Cold start**: tempo do tap no ícone até app interativo; inclui native init + JS bundle load
- **ANR**: Application Not Responding (Android); main thread bloqueada >5s
- **FlashList**: substituição performática do FlatList; recicla cells como UITableView/RecyclerView
- **MMKV**: storage key-value ultrarrápido (síncrono, baseado em mmap)
- **Staged rollout**: liberar update gradualmente para % de usuários
- **Phased release**: equivalente iOS do staged rollout; liberação gradual ao longo de 7 dias
- **Deferred deep link**: deep link que funciona mesmo quando app não está instalado
- **Source maps**: mapeamento de bundle minificado para código original; essencial para debugging
- **Symbolication**: tradução de endereços de memória em nomes de função legíveis (native crashes)
