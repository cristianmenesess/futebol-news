# Futebol News

Newsletter diária e automática de futebol. Toda manhã, às 7h, quem se inscreveu
recebe por e-mail as principais notícias do GE e do Lance, resumidas por IA. Este
repositório é a página de inscrição: a pessoa informa nome e e-mail, confirma pelo
link enviado por e-mail e passa a receber a newsletter.

Site estático em HTML, CSS e JavaScript puro, sem build e sem bibliotecas. Toda a
lógica de banco e de envio fica no n8n: a página não guarda nenhuma chave, só
conhece a URL do webhook de inscrição.

---

## Tecnologias

- **Linguagem e Framework:** HTML5, CSS3 e JavaScript puro
- **Automação:** n8n (inscrição, e-mail de confirmação e envio diário)
- **Banco de Dados:** PostgreSQL no Supabase, acessado só pelo n8n
- **Segurança:** double opt-in (confirmação por e-mail) e consentimento obrigatório
- **Validação:** no navegador (nome, e-mail e consentimento) e de novo no n8n
- **Build:** nenhum; hospedagem estática na Vercel

---

## Como Funciona

1. A pessoa preenche nome e e-mail, marca o consentimento e envia.
2. A página manda os dados para o webhook do n8n.
3. O n8n grava o inscrito no Supabase como **pendente** e envia o e-mail de confirmação.
4. Ao clicar no link do e-mail, o n8n ativa a inscrição e volta para a página com um aviso.
5. Todo dia às 7h, outro workflow do n8n coleta as notícias, gera o resumo com IA e envia para os inscritos ativos.

Todo e-mail tem um link de descadastro, que também volta para a página com um aviso.

---

## Funcionalidades

- **Inscrição:** formulário com nome, e-mail e caixa de consentimento.
- **Validação:** mostra o primeiro erro encontrado e coloca o cursor no campo certo.
- **Envio protegido:** o botão fica bloqueado com "Enviando..." até a resposta chegar.
- **Mensagens:** sucesso, e-mail já cadastrado, sem internet ou erro geral.
- **Avisos do link do e-mail:** inscrição confirmada, descadastro feito ou link inválido.
- **Responsivo:** funciona do celular (360px) ao desktop.

---

## Estrutura

| Arquivo | O que é |
|---|---|
| `index.html` | Página única: inscrição, como funciona, exemplo de edição, dúvidas e avisos do link do e-mail |
| `css/style.css` | Todo o visual; cores e fontes em variáveis no topo |
| `js/app.js` | `TelaInscricao`: validação, envio para o n8n e avisos do link do e-mail |

---

## Rodando Localmente

Pré-requisitos: o workflow de inscrição do n8n ativo e o Live Server do VS Code
(ou qualquer servidor de arquivos estáticos).

1. Clone o repositório.
2. No `js/app.js`, coloque a URL do webhook de inscrição:

| Variável | Descrição | Exemplo | Obrigatória |
|---|---|---|---|
| `urlInscricao` | URL de produção do webhook de inscrição do n8n | `https://seu-n8n.com/webhook/inscricao` | Sim |

3. No nó Webhook do n8n, libere o endereço local em **Allowed Origins (CORS)**.
4. Abra o `index.html` com o Live Server.

Para ver os avisos do link do e-mail sem passar pelo n8n, abra a página com
`?status=confirmado`, `?status=descadastrado` ou `?status=erro` no fim da URL.

---

## Deploy

1. Na Vercel, importe o repositório com **Framework Preset: Other** e sem build.
2. Libere o domínio do site no CORS do webhook de inscrição.
3. Use o mesmo domínio nos links de confirmação e descadastro do n8n.
