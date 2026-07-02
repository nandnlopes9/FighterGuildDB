import * as conexao from '../js/conexaoBD.js';

const PLATAFORMAS_PREDEFINIDAS = [
    'Super Nintendo (SNES)',
    'Nintendo Entertainment System (NES)',
    'Nintendo 64',
    'Nintendo GameCube',
    'Nintendo Wii',
    'Nintendo Wii U',
    'Nintendo Switch',
    'Nintendo Switch 2',
    'Dreamcast',
    'PlayStation',
    'PlayStation 2',
    'PlayStation 3',
    'PlayStation 4',
    'PlayStation 5',
    'PlayStation Portable (PSP)',
    'PlayStation Vita',
    'Xbox',
    'Xbox 360',
    'Xbox One',
    'Xbox Series X|S',
    'PC (Windows)',
    'Linux',
    'Neo Geo AES',
    'Neo Geo MVS',
    'Neo Geo CD',
    'Mobile'
];

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

function preencherCheckboxes(container, lista) {
    if (!container) return;
    if (!lista || lista.length === 0) {
        container.innerHTML = '<span>Nenhuma plataforma disponível.</span>';
        return;
    }
    container.innerHTML = lista.map(item => `
        <label class="checkbox-item">
            <input type="checkbox" name="plataformas" value="${item}">
            <span>${item}</span>
        </label>
    `).join('');
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
            obj[chave] = chave === 'dificuldade' ? Number(valor) : valor;
        }
    }

    return obj;
}

async function enviarImagensSeHouver(dados) {
    const camposImagem = ['capa', 'icone', 'icone_personagem_jogo'];

    for (const campo of camposImagem) {
        if (dados[campo] instanceof File) {
            const resultado = await conexao.uploadImagemGolpe(dados[campo], campo === 'icone' ? 'icones' : 'capas');
            if (resultado.erro) {
                throw new Error(resultado.erro.message || `Falha ao enviar ${campo}`);
            }
            dados[campo] = resultado.url;
            if (campo === 'icone' && resultado.url) {
                dados.icone = resultado.url;
            }
        }
    }

    return dados;
}

// ---- Carrega os selects ----
async function carregarOpcoes() {
    const arquetipos = await conexao.selectComFallback(['arquetipo', 'arquetipos', 'Arquetipo'], 'id, nome');
    preencherSelect(
        document.querySelector('#form-personagem select[name="id_arquetipo"]'),
        arquetipos, 'id', 'nome', 'Selecione um arquétipo'
    );

    const jogos = await conexao.select('jogo', 'id, nome');
    preencherSelect(
        document.querySelector('#form-personagem-jogo select[name="id_jogo"]'),
        jogos, 'id', 'nome', 'Selecione um jogo'
    );

    const personagens = await conexao.select('personagem', 'id, nome');
    preencherSelect(
        document.querySelector('#form-personagem-jogo select[name="id_personagem"]'),
        personagens, 'id', 'nome', 'Selecione um personagem'
    );

    const containerPlataformas = document.querySelector('#plataformas-checkboxes');
    if (containerPlataformas) {
        preencherCheckboxes(containerPlataformas, PLATAFORMAS_PREDEFINIDAS);
    }
}

// ---- Submit: Novo Jogo ----
document.querySelector('#form-jogo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
        const registro = await coletar(form);
        const dadosComImagem = await enviarImagensSeHouver(registro);

        // pega plataformas selecionadas
        const plataformasSelecionadas = Array.from(
            form.querySelectorAll('input[name="plataformas"]:checked')
        )
        .map(el => el.value)
        .filter(Boolean);

        // ❌ REMOVE plataformas do jogo (NÃO EXISTE NA TABELA)
        delete dadosComImagem.plataformas;

        // 1. INSERE O JOGO
        const resultado = await conexao.insert('jogo', dadosComImagem);

        if (!resultado || resultado.erro) {
            mostrarMsg(
                'form-jogo',
                `Erro ao salvar jogo: ${resultado?.erro?.message || 'desconhecido'}`,
                'erro'
            );
            return;
        }

        const jogoId = resultado[0].id;

        // 2. INSERE PLATAFORMAS (se tiver selecionado)
        if (plataformasSelecionadas.length > 0) {
            const payloadPlataformas = plataformasSelecionadas.map(p => ({
                id_jogo: jogoId,
                plataforma: p
            }));

            const rel = await conexao.insert('plataforma', payloadPlataformas);

            if (!rel || rel.erro) {
                mostrarMsg(
                    'form-jogo',
                    `Jogo salvo, mas erro nas plataformas: ${rel?.erro?.message || 'desconhecido'}`,
                    'erro'
                );
                return;
            }
        }

        mostrarMsg(
            'form-jogo',
            `Jogo "${resultado[0].nome}" salvo com sucesso!`,
            'sucesso'
        );

        form.reset();
        carregarOpcoes();

    } catch (erro) {
        mostrarMsg('form-jogo', erro.message, 'erro');
    }
});

// ---- Submit: Novo Personagem ----
document.querySelector('#form-personagem').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const dados = await coletar(form);

    try {
        const dadosComImagem = await enviarImagensSeHouver(dados);

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

        mostrarMsg('form-personagem', `Personagem "${criado[0].nome}" salvo com sucesso!`, 'sucesso');
        form.reset();
        carregarOpcoes();
    } catch (erro) {
        mostrarMsg('form-personagem', erro.message, 'erro');
    }
});

// ---- Submit: Personagem no jogo ----
document.querySelector('#form-personagem-jogo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
        const dados = await coletar(form);
        const dadosComImagem = await enviarImagensSeHouver(dados);

        const participacao = {
            id_personagem: Number(dadosComImagem.id_personagem),
            id_jogo: Number(dadosComImagem.id_jogo),
        };
        if (dadosComImagem.data_de_inclusao) participacao.data_de_inclusao = dadosComImagem.data_de_inclusao;
        if (dadosComImagem.vida) participacao.vida = Number(dadosComImagem.vida);
        if (dadosComImagem.dificuldade !== undefined && dadosComImagem.dificuldade !== '') {
            participacao.dificuldade = Number(dadosComImagem.dificuldade);
        }
        if (dadosComImagem.icone_personagem_jogo) participacao.icone = dadosComImagem.icone_personagem_jogo;

        const resultado = await conexao.insert('personagem_jogo', participacao);
        if (!resultado || resultado.erro) {
            mostrarMsg('form-personagem-jogo', `Erro ao salvar participação: ${resultado?.erro?.message || 'desconhecido'}`, 'erro');
            return;
        }

        mostrarMsg('form-personagem-jogo', 'Participação salva com sucesso!', 'sucesso');
        form.reset();
        carregarOpcoes();
    } catch (erro) {
        mostrarMsg('form-personagem-jogo', erro.message, 'erro');
    }
});

carregarOpcoes();
