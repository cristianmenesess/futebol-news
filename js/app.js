const telaInscricao = new TelaInscricao();

/**
 * Tela de inscrição da newsletter.
 * Valida o formulário, envia a inscrição para o n8n e mostra o resultado.
 * Também mostra o aviso de confirmação ou descadastro quando a pessoa
 * volta pelo link do e-mail.
 */
function TelaInscricao() {
    const self = this;

    // Webhook do n8n
    let urlInscricao = 'https://SEU-N8N/webhook/inscricao';

    let textoBotao = 'Quero receber';
    let textoEnviando = 'Enviando...';
    let regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let mensagens = {
        sucesso: 'Enviamos um e-mail de confirmação. Verifique sua caixa de entrada (e o spam).',
        jaCadastrado: 'Este e-mail já está cadastrado.',
        erroGenerico: 'Não foi possível concluir. Tente novamente.',
        semConexao: 'Não foi possível conectar. Verifique sua internet e tente novamente.',
        nomeVazio: 'Informe o seu nome.',
        emailInvalido: 'Informe um e-mail válido.',
        semConsentimento: 'Marque a caixa de consentimento para receber a newsletter.'
    };

    let form = document.getElementById('formInscricao');
    let inputNome = document.getElementById('inputNome');
    let inputEmail = document.getElementById('inputEmail');
    let inputConsentimento = document.getElementById('inputConsentimento');
    let btnEnviar = document.getElementById('btnEnviar');
    let mensagemRetorno = document.getElementById('mensagemRetorno');

    let hero = document.querySelector('.hero');
    let painelRetorno = document.getElementById('painelRetorno');
    let retornoConfirmado = document.getElementById('retornoConfirmado');
    let retornoDescadastrado = document.getElementById('retornoDescadastrado');
    let retornoErro = document.getElementById('retornoErro');
    let btnVoltarInscricao = document.getElementById('btnVoltarInscricao');

    // Aviso que aparece para cada status que pode vir no link do e-mail
    let blocosRetorno = {
        confirmado: retornoConfirmado,
        descadastrado: retornoDescadastrado,
        erro: retornoErro
    };

    /**
     * Mostra uma mensagem abaixo do formulário.
     * @param {string} texto Texto da mensagem.
     * @param {string} tipo 'sucesso' ou 'erro'.
     */
    function mostrarMensagem(texto, tipo) {
        limparMensagem();
        mensagemRetorno.classList.add('mensagem');
        mensagemRetorno.classList.add(tipo === 'sucesso' ? 'mensagem--sucesso' : 'mensagem--erro');
        mensagemRetorno.textContent = texto;
    }

    /**
     * Apaga a mensagem abaixo do formulário.
     */
    function limparMensagem() {
        mensagemRetorno.textContent = '';
        mensagemRetorno.classList.remove('mensagem--sucesso');
        mensagemRetorno.classList.remove('mensagem--erro');
    }

    /**
     * Bloqueia o botão e mostra "Enviando..." enquanto a inscrição é enviada.
     */
    function mostrarEnviando() {
        btnEnviar.disabled = true;
        btnEnviar.classList.add('botao--carregando');
        btnEnviar.setAttribute('aria-busy', 'true');
        btnEnviar.textContent = textoEnviando;
    }

    function esconderEnviando() {
        btnEnviar.disabled = false;
        btnEnviar.classList.remove('botao--carregando');
        btnEnviar.removeAttribute('aria-busy');
        btnEnviar.textContent = textoBotao;
    }

    /**
     * Confere nome, e-mail e consentimento. Se algo estiver errado, mostra
     * o aviso e coloca o cursor no campo que precisa de ajuste.
     * @param {string} nome Nome digitado.
     * @param {string} email E-mail digitado.
     * @param {boolean} consentimento Se a caixa foi marcada.
     * @returns {boolean} true se estiver tudo certo.
     */
    function validarFormulario(nome, email, consentimento) {
        if (nome === '') {
            mostrarMensagem(mensagens.nomeVazio, 'erro');
            inputNome.focus();
            return false;
        }

        if (!regexEmail.test(email)) {
            mostrarMensagem(mensagens.emailInvalido, 'erro');
            inputEmail.focus();
            return false;
        }

        if (!consentimento) {
            mostrarMensagem(mensagens.semConsentimento, 'erro');
            inputConsentimento.focus();
            return false;
        }

        return true;
    }

    /**
     * Mostra a mensagem de sucesso e limpa o formulário.
     */
    function sucessoInscricao() {
        mostrarMensagem(mensagens.sucesso, 'sucesso');
        form.reset();
    }

    /**
     * Escolhe a mensagem de erro: sem internet, e-mail já cadastrado
     * ou erro geral.
     * @param {Error|{status: string}} erro Erro do envio ou resposta do n8n.
     */
    function exibirErro(erro) {
        if (erro instanceof TypeError) {
            mostrarMensagem(mensagens.semConexao, 'erro');
        } else if (erro && erro.status === 'ja_cadastrado') {
            mostrarMensagem(mensagens.jaCadastrado, 'erro');
        } else {
            mostrarMensagem(mensagens.erroGenerico, 'erro');
        }
    }

    /**
     * Confere se o n8n respondeu que a inscrição deu certo.
     * Se não deu, segue para a mensagem de erro.
     * @param {Response} resposta Resposta do n8n.
     * @returns {Promise<{status: string}>} Resposta já lida.
     */
    function lerResposta(resposta) {
        return resposta.json().then(function (corpo) {
            if (!resposta.ok || !corpo || corpo.status !== 'ok') {
                return Promise.reject(corpo);
            }

            return corpo;
        });
    }

    /**
     * Valida o formulário e envia a inscrição para o n8n.
     * O botão fica bloqueado até a resposta chegar.
     */
    function enviarInscricao() {
        let nome = inputNome.value.trim();
        let email = inputEmail.value.trim();
        let consentimento = inputConsentimento.checked;

        limparMensagem();

        if (!validarFormulario(nome, email, consentimento)) {
            return;
        }

        let dados = { nome: nome, email: email, consentimento: true };

        mostrarEnviando();

        fetch(urlInscricao, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        })
            .then(function (resposta) {
                return lerResposta(resposta);
            })
            .then(function () {
                sucessoInscricao();
            })
            .catch(function (erro) {
                exibirErro(erro);
            })
            .finally(function () {
                esconderEnviando();
            });
    }

    function esconderBlocosRetorno() {
        retornoConfirmado.hidden = true;
        retornoDescadastrado.hidden = true;
        retornoErro.hidden = true;
    }

    /**
     * Esconde o formulário e mostra o aviso que veio pelo link do e-mail.
     * @param {string} status 'confirmado', 'descadastrado' ou 'erro'.
     */
    function mostrarRetorno(status) {
        let bloco = blocosRetorno[status];

        esconderBlocosRetorno();
        hero.hidden = true;
        painelRetorno.hidden = false;
        bloco.hidden = false;

        window.scrollTo(0, 0);
        bloco.querySelector('h2').focus();
    }

    /**
     * Esconde o aviso e mostra o formulário de novo.
     */
    function voltarParaInscricao() {
        painelRetorno.hidden = true;
        esconderBlocosRetorno();
        hero.hidden = false;
        inputNome.focus();
    }

    /**
     * Confere se a página abriu pelo link do e-mail (com ?status= na URL).
     * Se sim, mostra o aviso certo e limpa a URL.
     */
    function verificarStatusNaUrl() {
        let status = new URLSearchParams(window.location.search).get('status');

        if (status === null) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(blocosRetorno, status)) {
            mostrarRetorno(status);
        }

        history.replaceState(null, '', window.location.pathname);
    }

    /**
     * Começa a tela: confere a URL e liga o botão e o formulário.
     */
    self.iniciar = function () {
        verificarStatusNaUrl();

        btnVoltarInscricao.addEventListener('click', function () {
            voltarParaInscricao();
        });

        // Com o botão bloqueado, o Enter também não envia de novo
        form.addEventListener('submit', function (evento) {
            evento.preventDefault();
            enviarInscricao();
        });
    };
}

telaInscricao.iniciar();