import * as conexao from './conexaoBD.js';

const form = document.getElementById('form-plataforma');
const feedback = document.getElementById('feedback');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const dados = new FormData(form);
    const payload = {};
    dados.forEach((valor, chave) => {
        if (valor !== '') payload[chave] = valor;
    });

    if (payload.nome) {
        payload.plataforma = payload.nome;
        delete payload.nome;
    }

    // INSERT INTO plataforma (...) VALUES (...)
    const resultado = await conexao.insert('plataforma', payload);
    if (resultado?.erro) {
        feedback.textContent = `Erro: ${resultado.erro.message}`;
        feedback.className = 'form-feedback erro';
        return;
    }

    feedback.textContent = 'Plataforma salva com sucesso.';
    feedback.className = 'form-feedback sucesso';
    form.reset();
});
