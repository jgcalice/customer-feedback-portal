# Walkthrough — Customer Feedback Portal

Este walkthrough mostra o estado atual da ferramenta e como validar os fluxos principais em poucos minutos.

## 1) Inicializar ambiente local

```bash
cd examples/customer-feedback-portal
cp .env.example .env
npm install
npm run db:init
npm run dev
```

Abra `http://localhost:3000`.

---

## 2) Fluxo de Login (magic link)

1. Acesse `/login`.
2. Informe seu e-mail (ex.: `admin@example.com` ou `customer@example.com`).
3. Clique em **Send magic link**.
4. Em desenvolvimento:
   - o link aparece na tela (quando e-mail provider nao estiver configurado),
   - e tambem fica logado no servidor.
5. Abra o link para autenticar.

Resultado esperado:
- Toast de sucesso no envio.
- Redirecionamento para `/problems` apos callback.

---

## 3) Dashboard inicial

Em `/`:
- cards com metricas (problemas, roadmap, interesses),
- lista de problemas recentes,
- atalhos para criar problema e ver roadmap.

Resultado esperado:
- pagina abre com dados reais do seed.

---

## 4) Listagem de problemas (principal)

Em `/problems`:

- filtros: produto, status, busca;
- ordenacao: recentes, mais interessados, mais comentados;
- paginacao com **Previous / Next**;
- filtros sincronizados com URL (link compartilhavel);
- acao **Me afeta** direto no card.

Teste rapido:
1. Filtre por produto.
2. Mude ordenacao.
3. Avance pagina.
4. Recarregue a pagina.

Resultado esperado:
- estado preservado pela query string,
- toasts de feedback em acoes,
- contadores do card atualizando.

---

## 5) Detalhe do problema + comentarios

Em `/problems/[id]`:

- botao **Me afeta** com contador;
- secoes de contexto (impacto, frequencia, workaround);
- comentarios com criacao inline.

Teste rapido:
1. Publique um comentario.
2. Marque/desmarque **Me afeta**.

Resultado esperado:
- comentario aparece imediatamente,
- feedback visual (mensagem + toast).

---

## 6) Criacao de problema

Em `/problems/new`:

- formulario guiado por problema (nao feature request);
- campos obrigatorios validados;
- redirecionamento para detalhe apos salvar.

Resultado esperado:
- toast de sucesso no envio,
- detalhe abre com indicador de criacao recente.

---

## 7) Admin interno

Com login interno (`admin@example.com`):

Em `/admin`:
- alterar status de problemas,
- criar item de roadmap com target e vinculo opcional a problema,
- merge manual de duplicados.

Resultado esperado:
- toasts e mensagens de sucesso/erro,
- roadmap atualizado e visivel em `/roadmap`.

---

## 8) Roadmap publico

Em `/roadmap`:
- agrupamento por produto,
- status badge,
- relacao com problemas quando vinculados.

Resultado esperado:
- visao de transparencia para clientes.

---

## 9) Checklist de pronto para demo

- [ ] `npm run build` passa
- [ ] login por magic link funciona
- [ ] criar problema funciona
- [ ] comentar e marcar "me afeta" funciona
- [ ] filtros + ordenacao + paginacao funcionam
- [ ] admin atualiza status e cria roadmap
- [ ] merge de duplicados funciona
