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

### Troubleshooting — porta em uso ou lock do Next.js

Se aparecer **"Port 3000 is in use"** ou **"Unable to acquire lock at ... .next/dev/lock"**:

1. Feche qualquer terminal onde `npm run dev` esteja rodando (Ctrl+C).
2. No PowerShell, libere a porta 3000:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
   ```
3. Se o aviso de lock continuar, apague a pasta `.next` e suba de novo:
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   npm run dev
   ```

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
- filtro opcional "Only my interests" (apos login);
- ordenacao: recentes, mais interessados, mais comentados;
- paginacao com botoes numerados + **Previous / Next**;
- tamanho de pagina configuravel;
- filtros sincronizados com URL (link compartilhavel);
- export CSV da listagem filtrada;
- acao **Me afeta** direto no card.

Teste rapido:
1. Filtre por produto.
2. Mude ordenacao.
3. Ajuste tamanho da pagina.
4. Avance pagina.
5. Recarregue a pagina.

Resultado esperado:
- estado preservado pela query string,
- preferencia de filtros salva no servidor quando autenticado,
- toasts de feedback em acoes,
- contadores do card atualizando.

### My Workspace (views salvas)

Na mesma pagina `/problems`:

1. Defina filtros/ordenacao desejados.
2. Em **My Workspace**, informe um nome e clique **Save current view**.
3. Marque como favorito quando quiser.
4. Use **Apply** para reusar a view salva.
5. Use **Delete** para remover.

Resultado esperado:
- views persistidas por usuario no servidor,
- favoritos destacados,
- aplicacao rapida de filtros prontos.

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
