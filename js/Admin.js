import * as conexao from './conexaoBD.js';

// A troca de abas fica num <script> comum no Admin.html (independente do Supabase),
// para que a navegação funcione mesmo se a conexão com o banco falhar.

// ---- Helpers ----
function preencherSelect(select, lista, valueKey, textKey, placeholder) {
    if (!lista || lista.length === 0) {
        select.innerHTML = `<option value="" disabled selected>Nenhum registro</option>`;
        return;
    }
    const opcoes = lista
        .map(item => `<option value="${item[valueKey]}">${item[textKey]}</option>`)
        .join('');
    select.innerHTML = `<option value="" disabled selected>${placeholder}</option>${opcoes}`;
}

function mostrarMsg(formId, texto, tipo) {
    const msg = document.querySelector(`.form-msg[data-for="${formId}"]`);
    msg.textContent = texto;
    msg.className = `form-msg ${tipo}`;
}

async function coletar(form) {
    const obj = {};
    const dados = new FormData(form);

    for (const [chave, valor] of dados.entries()) {
        if (valor instanceof File && valor.size > 0) {
            obj[chave] = valor;
        } else if (valor !== '') {
            obj[chave] = valor;
        }
    }

    return obj;
}

async function enviarImagensSeHouver(dados) {
    const camposImagem = ['capa', 'icone'];

    for (const campo of camposImagem) {
        if (dados[campo] instanceof File) {
            const resultado = await conexao.uploadImagem(dados[campo], campo === 'icone' ? 'icones' : 'capas');
            if (resultado.erro) {
                throw new Error(resultado.erro.message || `Falha ao enviar ${campo}`);
            }
            dados[campo] = resultado.url;
        }
    }

    return dados;
}

// ---- Carrega os selects ----
async function carregarOpcoes() {
    const arquetipos = await conexao.select('arquetipo', 'id, nome');
    preencherSelect(
        document.querySelector('#form-personagem select[name="id_arquetipo"]'),
        arquetipos, 'id', 'nome', 'Selecione um arquétipo'
    );

    const jogos = await conexao.select('jogo', 'id, nome');
    preencherSelect(
        document.querySelector('#form-personagem select[name="id_jogo"]'),
        jogos, 'id', 'nome', 'Selecione um jogo'
    );
}

// ---- Submit: Novo Jogo ----
document.querySelector('#form-jogo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const registro = await coletar(form);

    try {
        const dadosComImagem = await enviarImagensSeHouver(registro);
        const resultado = await conexao.insert('jogo', dadosComImagem);
        if (!resultado || resultado.erro) {
            mostrarMsg('form-jogo', `Erro ao salvar jogo: ${resultado?.erro?.message || 'desconhecido'}`, 'erro');
            return;
        }
        mostrarMsg('form-jogo', `Jogo "${resultado[0].nome}" salvo com sucesso!`, 'sucesso');
        form.reset();
        carregarOpcoes();
    } catch (erro) {
        mostrarMsg('form-jogo', erro.message, 'erro');
    }
    if (!resultado || resultado.erro) {
        mostrarMsg('form-jogo', `Erro ao salvar jogo: ${resultado?.erro?.message || 'desconhecido'}`, 'erro');
        return;
    }
    mostrarMsg('form-jogo', `Jogo "${resultado[0].nome}" salvo com sucesso!`, 'sucesso');
    form.reset();
    carregarOpcoes(); // atualiza a lista de jogos do outro formulário
});

// ---- Submit: Novo Personagem (personagem + participação no jogo) ----
document.querySelector('#form-personagem').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const dados = await coletar(form);

    try {
        const dadosComImagem = await enviarImagensSeHouver(dados);

        // Separa os campos do personagem dos campos da relação personagem_jogo.
        const personagem = {
            nome: dadosComImagem.nome,
            id_arquetipo: Number(dadosComImagem.id_arquetipo),
        };
        if (dadosComImagem.historia) personagem.historia = dadosComImagem.historia;
        if (dadosComImagem.icone) personagem.icone = dadosComImagem.icone;

        const criado = await conexao.insert('personagem', personagem);
        if (!criado || criado.erro) {
            mostrarMsg('form-personagem', `Erro ao salvar personagem: ${criado?.erro?.message || 'desconhecido'}`, 'erro');
            return;
        }
        const idPersonagem = criado[0].id;

        // Cria a participação no jogo apenas se um jogo foi escolhido.
        if (dadosComImagem.id_jogo) {
            const participacao = {
                id_personagem: idPersonagem,
                id_jogo: Number(dadosComImagem.id_jogo),
                dificuldade: Number(dadosComImagem.dificuldade),
            };
            if (dadosComImagem.vida) participacao.vida = Number(dadosComImagem.vida);
            if (dadosComImagem.data_de_inclusao) participacao.data_de_inclusao = dadosComImagem.data_de_inclusao;

            const rel = await conexao.insert('personagem_jogo', participacao);
            if (!rel || rel.erro) {
                mostrarMsg('form-personagem',
                    `Personagem salvo, mas falhou a participação no jogo: ${rel?.erro?.message || 'desconhecido'}`, 'erro');
                return;
            }
        }

        mostrarMsg('form-personagem', `Personagem "${criado[0].nome}" salvo com sucesso!`, 'sucesso');
        form.reset();
    } catch (erro) {
        mostrarMsg('form-personagem', erro.message, 'erro');
    }
});

carregarOpcoes();
