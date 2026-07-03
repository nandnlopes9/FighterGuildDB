import * as conexao from './conexaoBD.js';

const tipoSelect = document.getElementById('tipo-entidade');
const registroSelect = document.getElementById('registro-select');
const btnDeletar = document.getElementById('btn-deletar');
const feedback = document.getElementById('feedback');

let cache = { jogos: [], personagens: [], participacoes: [] };

async function carregarOpcoes() {
    const [jogos, personagens, participacoes] = await Promise.all([
        // SELECT id, nome FROM jogo
        conexao.select('jogo', 'id, nome'),
        // SELECT id, nome FROM personagem
        conexao.select('personagem', 'id, nome'),
        // SELECT id, id_personagem, id_jogo FROM personagem_jogo
        conexao.select('personagem_jogo', 'id, id_personagem, id_jogo'),
    ]);
    cache.jogos = jogos || [];
    cache.personagens = personagens || [];
    cache.participacoes = participacoes || [];
}

async function carregarRegistros() {
    const tipo = tipoSelect.value;
    let dados = [];
    switch (tipo) {
        case 'jogo':
            // SELECT id, nome FROM jogo
            dados = await conexao.select('jogo', 'id, nome');
            break;
        case 'personagem':
            // SELECT id, nome FROM personagem
            dados = await conexao.select('personagem', 'id, nome');
            break;
        case 'personagem_jogo':
            // SELECT id, id_personagem, id_jogo FROM personagem_jogo
            dados = await conexao.select('personagem_jogo', 'id, id_personagem, id_jogo');
            break;
        case 'golpe':
            // SELECT id, nome, tipo, id_personagem_jogo FROM golpe
            dados = await conexao.select('golpe', 'id, nome, tipo, id_personagem_jogo');
            break;
        case 'arquetipo':
            // SELECT id, nome FROM arquetipo
            dados = await conexao.select('arquetipo', 'id, nome');
            break;
    }

    registroSelect.innerHTML = '<option value="" disabled selected>Selecione um registro</option>' + (dados || []).map((item) => {
        if (tipo === 'personagem_jogo') {
            const personagem = cache.personagens.find((p) => String(p.id) === String(item.id_personagem));
            const jogo = cache.jogos.find((j) => String(j.id) === String(item.id_jogo));
            return `<option value="${item.id}">${personagem?.nome || 'Personagem'} · ${jogo?.nome || 'Jogo'}</option>`;
        }
        if (tipo === 'golpe') {
            return `<option value="${item.id}">${item.nome || 'Golpe'} (${item.tipo || 'Sem tipo'})</option>`;
        }
        return `<option value="${item.id}">${item.nome}</option>`;
    }).join('');
}

btnDeletar.addEventListener('click', async () => {
    const tipo = tipoSelect.value;
    const id = registroSelect.value;
    if (!id) {
        feedback.textContent = 'Selecione um registro para excluir.';
        feedback.className = 'form-feedback erro';
        return;
    }

    // DELETE FROM <tipo> WHERE id = ...
    const resultado = await conexao.deleteRecord(tipo, id);
    if (resultado?.erro) {
        feedback.textContent = `Erro: ${resultado.erro.message}`;
        feedback.className = 'form-feedback erro';
        return;
    }

    feedback.textContent = 'Registro excluído com sucesso.';
    feedback.className = 'form-feedback sucesso';
    await carregarRegistros();
});

tipoSelect.addEventListener('change', async () => {
    await carregarOpcoes();
    await carregarRegistros();
});

async function iniciar() {
    await carregarOpcoes();
    await carregarRegistros();
}
iniciar();
