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

// Transforma o FormData em objeto, ignorando campos vazios (vira NULL no banco).
function coletar(form) {
    const obj = {};
    new FormData(form).forEach((valor, chave) => {
        if (valor !== '') obj[chave] = valor;
    });
    return obj;
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
    const registro = coletar(form);

    const resultado = await conexao.insert('jogo', registro);
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
    const dados = coletar(form);

    // Separa os campos do personagem dos campos da relação personagem_jogo.
    const personagem = {
        nome: dados.nome,
        id_arquetipo: Number(dados.id_arquetipo),
    };
    if (dados.historia) personagem.historia = dados.historia;
    if (dados.icone) personagem.icone = dados.icone;

    const criado = await conexao.insert('personagem', personagem);
    if (!criado || criado.erro) {
        mostrarMsg('form-personagem', `Erro ao salvar personagem: ${criado?.erro?.message || 'desconhecido'}`, 'erro');
        return;
    }
    const idPersonagem = criado[0].id;

    // Cria a participação no jogo apenas se um jogo foi escolhido.
    if (dados.id_jogo) {
        const participacao = {
            id_personagem: idPersonagem,
            id_jogo: Number(dados.id_jogo),
            dificuldade: Number(dados.dificuldade),
        };
        if (dados.vida) participacao.vida = Number(dados.vida);
        if (dados.data_de_inclusao) participacao.data_de_inclusao = dados.data_de_inclusao;

        const rel = await conexao.insert('personagem_jogo', participacao);
        if (!rel || rel.erro) {
            mostrarMsg('form-personagem',
                `Personagem salvo, mas falhou a participação no jogo: ${rel?.erro?.message || 'desconhecido'}`, 'erro');
            return;
        }
    }

    mostrarMsg('form-personagem', `Personagem "${criado[0].nome}" salvo com sucesso!`, 'sucesso');
    form.reset();
});

carregarOpcoes();
