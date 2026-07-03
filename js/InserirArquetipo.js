import * as conexao from './conexaoBD.js';

const form = document.getElementById('form-arquetipo');
const feedback = document.getElementById('feedback');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const dados = new FormData(form);
    const payload = {};
    dados.forEach((valor, chave) => {
        if (valor !== '') payload[chave] = valor;
    });

    // INSERT INTO arquetipo (...) VALUES (...)
    const resultado = await conexao.insert('arquetipo', payload);
    if (resultado?.erro) {
        feedback.textContent = `Erro: ${resultado.erro.message}`;
        feedback.className = 'form-feedback erro';
        return;
    }

    feedback.textContent = 'Arquétipo salvo com sucesso.';
    feedback.className = 'form-feedback sucesso';
    form.reset();
});
