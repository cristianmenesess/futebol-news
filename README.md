# Futebol News

Página de inscrição de uma newsletter diária de futebol. Toda manhã, às 7h, o
inscrito recebe por e-mail as principais notícias do GE e do Lance resumidas por
IA. A página envia nome, e-mail e consentimento para um webhook do n8n, que grava
o inscrito no Supabase e faz o double opt-in (e-mail de confirmação antes de
entrar na lista).

Site estático, sem build e sem bibliotecas: HTML, CSS e JavaScript puro (a única
dependência externa são as fontes do Google Fonts). O JS
segue o padrão de "Tela" (`TelaInscricao` com `var self = this;`), usando AJAX nativo
(`XMLHttpRequest`) no mesmo formato do `$.ajax`, sem jQuery. A validação acontece antes do envio, os erros
passam por um único ponto de tratamento (`exibirErroAjax`) e as mensagens aparecem abaixo do
formulário (sem `alert`). O único endereço no código é o do webhook do n8n, que só
aceita inscrições: a credencial do Supabase fica guardada no n8n, e o banco é
fechado para o navegador (RLS sem nenhuma policy para `anon`).

---

## Tecnologias

- **Linguagem e Framework:** HTML5, CSS3 e JavaScript puro (sem bibliotecas)
- **Fontes:** Inter Tight, do Google Fonts (link externo). Se não carregar, a página usa a fonte do sistema
- **Visual:** tema claro e simples, inspirado no the news: títulos grandes, formulário em pílula e destaque em degradê verde-limão. Cores e fontes em variáveis no topo do `css/style.css`
- **Banco de Dados:** PostgreSQL no Supabase (tabelas `inscritos`, `edicoes` e `noticias`, script em `sql/criacao_banco.sql`)
- **Integração:** AJAX com `XMLHttpRequest` (POST JSON) para o webhook do n8n, que grava no Supabase com a credencial guardada nele
- **Segurança:** banco fechado para o navegador (RLS, só o n8n acessa), nenhuma chave no front, double opt-in feito pelo n8n e consentimento explícito obrigatório
- **Validação:** no `js/app.js` (nome, formato do e-mail e consentimento); o `<form>` usa `novalidate`
- **Build:** nenhum; hospedagem estática na Vercel

---

## Funcionalidades

- **Inscrição:** formulário com nome, e-mail e caixa de consentimento.
- **Validação no navegador:** mostra a primeira mensagem de erro e coloca o foco no campo com problema.
- **Botão protegido:** fica desabilitado com o texto "Enviando..." e um indicador girando durante o envio, sem envio duplicado.
- **Mensagens de retorno:** sucesso, e-mail já cadastrado ou erro genérico, abaixo do formulário.
- **Exemplo de edição:** cartão decorativo que imita o e-mail da newsletter, com manchetes genéricas (sem clubes, jogadores ou marcas reais).
- **Nenhuma chave no front:** o código só conhece a URL do webhook; o acesso ao banco fica no n8n.
- **Página única:** o retorno dos links do e-mail (confirmado, descadastrado ou erro) aparece no próprio `index.html`, lido do `?status=` da URL.
- **Responsivo e acessível:** funciona a partir de 360px, foco visível e mensagens anunciadas por leitor de tela.

---

## Estrutura de Pastas

| Caminho | O que é |
|---|---|
| `index.html` | Página única: abertura com o formulário, como funciona, exemplo de edição, dúvidas e painel de retorno (`#painelRetorno`) |
| `css/style.css` | Todo o visual: variáveis, botões, formulário, seções, painel de retorno e rodapé |
| `js/app.js` | `TelaInscricao`: formulário, envio para o webhook do n8n, leitura do `?status=` e painel de retorno |
| `sql/criacao_banco.sql` | Criação das tabelas, índices, trigger e segurança (RLS) no Supabase |

---

## Rodando Localmente

Pré-requisitos: um navegador, um projeto no Supabase, o n8n e, para servir os
arquivos, o Live Server do VS Code, Python 3 **ou** Node.js (para o `npx`).

1. Clone o repositório.
2. No Supabase, abra o **SQL Editor** e rode o `sql/criacao_banco.sql` uma vez.
3. No n8n, monte o workflow de inscrição (veja **Workflow de inscrição no n8n**) e ative-o.
4. No topo da `TelaInscricao`, no `js/app.js`, coloque a URL de produção do webhook:

| Variável | Descrição | Exemplo | Obrigatória |
|---|---|---|---|
| `urlInscricao` | URL de produção do webhook de inscrição (`/webhook/`, não `/webhook-test/`) | `https://seu-n8n.com/webhook/inscricao` | Sim |

Use sempre a URL de produção, com o workflow ativo, inclusive para testar; assim o código não muda entre o teste e o ar.

5. Abra o `index.html` com o Live Server, ou rode na raiz do projeto:
```bash
python3 -m http.server 3000
# ou
npx serve .
```
6. Abra `http://localhost:3000` (ou o endereço do Live Server) e libere esse endereço no CORS do webhook.

### Testando o painel de retorno

Com o servidor rodando, abra a página com o `?status=` que o n8n usaria:

| Endereço | O que aparece |
|---|---|
| `http://localhost:3000/?status=confirmado` | "Inscrição confirmada!" |
| `http://localhost:3000/?status=descadastrado` | "Você saiu da lista." |
| `http://localhost:3000/?status=erro` | "Link inválido ou expirado." |
| `http://localhost:3000/?status=qualquer` | Formulário normal (status desconhecido é ignorado) |

Em todos os casos a URL volta para `http://localhost:3000/`. O botão "Voltar para a inscrição" mostra o formulário sem recarregar.

## Visão Geral da API

A página não tem API própria e não acessa o Supabase: ela só chama o webhook de
inscrição do n8n. Não há autenticação; o webhook só aceita inscrições, e quem grava
no banco é o n8n, com a credencial do Supabase (chave `service_role`) guardada nele.

### Inscrição (webhook do n8n)
| Método | Rota | Descrição |
|---|---|---|
| POST | `urlInscricao` | Grava o inscrito como `pendente` e envia o e-mail de confirmação |

Requisição (header `Content-Type: application/json`):
```json
{ "nome": "Maria Silva", "email": "maria@exemplo.com", "consentimento": true }
```

Resposta (HTTP 200, corpo JSON):

| `status` | Quando | O que a página faz |
|---|---|---|
| `ok` | Inscrito gravado e e-mail de confirmação enviado | Mensagem de sucesso e limpa o formulário |
| `ja_cadastrado` | E-mail já está na tabela (erro `23505` do banco) | "Este e-mail já está cadastrado." |
| `erro` | Qualquer outra falha no workflow | "Não foi possível concluir. Tente novamente." |

Resposta HTTP diferente de 2xx, corpo que não é JSON ou `status` desconhecido também
mostram o erro genérico. Sem internet, a página mostra "Não foi possível conectar.
Verifique sua internet e tente novamente."

### Workflow de inscrição no n8n

| Nó | Configuração |
|---|---|
| **Webhook** | Método `POST`, caminho `inscricao`. **Respond:** *Using 'Respond to Webhook' Node*. Em **Options → Allowed Origins (CORS)**, o domínio do site (e o endereço local enquanto testa) |
| **IF (validação)** | `nome` preenchido, `email` com `@` e `consentimento` igual a `true`; se falhar, responde `{ "status": "erro" }` |
| **Supabase: Create a row** | Tabela `inscritos`, campos `nome`, `email` (em minúsculas) e `consentimento`. Credencial com a chave `service_role`. Em **Settings → On Error**, *Continue (using error output)* |
| **Saída de erro → IF** | Mensagem do erro contém `duplicate key` → responde `{ "status": "ja_cadastrado" }`; senão → `{ "status": "erro" }` |
| **Gmail** | Envia o e-mail com o link de confirmação, montado com o `token_confirmacao` da linha criada |
| **Respond to Webhook** | `{ "status": "ok" }` |

O banco gera `status` (`pendente`), os tokens e as datas sozinho; o workflow só envia os três campos.

### Retorno dos links do e-mail

Os links enviados pelo n8n (confirmação e descadastro) devem, depois de processados,
redirecionar para a própria página, com o `?status=`:

| Endereço | Quando o n8n deve redirecionar |
|---|---|
| `https://<domínio>/?status=confirmado` | Link de confirmação válido; inscrição ativada |
| `https://<domínio>/?status=descadastrado` | Descadastro concluído |
| `https://<domínio>/?status=erro` | Link inválido ou expirado |

A página mostra o painel certo e limpa a URL com `history.replaceState`, então a barra de endereço volta a ser só `https://<domínio>/`.

---

## Deploy na Vercel

1. Confira no `js/app.js` a `urlInscricao` com a URL de produção do webhook.
2. Na Vercel, crie um projeto importando o repositório.
3. Em **Framework Preset**, escolha **Other**; deixe **Build Command** e **Output Directory** vazios (a raiz é servida como está).
4. Clique em **Deploy**.
5. Com o domínio definido, libere-o no CORS do webhook de inscrição e use-o nas URLs de redirecionamento do n8n.

Também dá para publicar pela linha de comando, na raiz do projeto:
```bash
npx vercel --prod
```
