import * as conexao from './js/conexaoBD.js';

const jogoSelect = document.getElementById('select-jogo');
const personagemSelect = document.getElementById('select-personagem');
const previewImage = document.getElementById('personagem-preview-image');
const previewName = document.getElementById('personagem-preview-name');
const comandoInput = document.getElementById('comando');
const nomeComandoInput = document.getElementById('nome-comando');
const tipoComandoSelect = document.getElementById('tipo-comando');
const confirmarButton = document.getElementById('btn-confirmar');
const feedback = document.getElementById('feedback');
const commandGroupsContainer = document.getElementById('command-groups');

let todosOsPersonagens = [];
let ultimoGrupoInserido = null;

const gruposDeComandos = [
    {
        titulo: 'Direções',
        valores: ['↑', '↓', '←', '→', '↖', '↗', '↙', '↘'],
    },
    {
        titulo: 'Movimentos',
        valores: ['↻ 360°', '↺ 360°', '↻ 720°', '↺ 720°', 'Charge', 'Hold', 'Release', 'Rapid'],
    },
    {
        titulo: 'Botões',
        valores: ['LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'P', 'K', 'PP', 'KK', 'PPP', 'KKK'],
    },
    {
        titulo: 'Operadores',
        valores: ['+', ',', '(', ')'],
    },
    {
        titulo: 'Outros',
        valores: ['Any Punch', 'Any Kick', 'Dash', 'Backdash', 'Jump', 'Super Jump', 'Taunt'],
    },
];

function getPlaceholderImage() {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
            <rect width="800" height="1000" fill="#120d2e"/>
            <rect x="40" y="40" width="720" height="920" rx="36" fill="none" stroke="#8b5cf6" stroke-width="8"/>
            <circle cx="400" cy="380" r="180" fill="#5e8a8a" fill-opacity="0.35"/>
            <path d="M260 720c46-120 130-170 280-170" stroke="#ec4899" stroke-width="24" stroke-linecap="round"/>
            <text x="400" y="860" text-anchor="middle" fill="#ffffff" font-size="44" font-family="Arial, sans-serif">Selecione um personagem</text>
        </svg>
    `)}`;
}

function preencherSelect(select, lista, placeholder) {
    if (!lista || lista.length === 0) {
        select.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        return;
    }

    const opcoes = lista
        .map(item => `<option value="${item.id}">${item.nome}</option>`)
        .join('');

    select.innerHTML = `<option value="" disabled selected>${placeholder}</option>${opcoes}`;
}

function resetarPreview() {
    previewImage.src = getPlaceholderImage();
    previewImage.alt = 'Imagem padrão do personagem';
    previewName.textContent = 'Selecione um personagem';
}

function atualizarPreview(personagem) {
    if (!personagem) {
        resetarPreview();
        return;
    }

    previewImage.src = personagem.icone || getPlaceholderImage();
    previewImage.alt = personagem.nome;
    previewName.textContent = personagem.nome.toUpperCase();
}

function inserirNoCampo(valor, grupo) {
    const start = comandoInput.selectionStart ?? comandoInput.value.length;
    const end = comandoInput.selectionEnd ?? comandoInput.value.length;
    const textoAtual = comandoInput.value;
    const precisaEspaco = ultimoGrupoInserido && ultimoGrupoInserido !== grupo && textoAtual.length > 0 && !textoAtual.endsWith(' ');
    const prefixo = precisaEspaco ? ' ' : '';
    const proximoValor = `${textoAtual.slice(0, start)}${prefixo}${valor}${textoAtual.slice(end)}`;

    comandoInput.value = proximoValor;
    comandoInput.focus();
    const posicao = start + prefixo.length + valor.length;
    comandoInput.setSelectionRange(posicao, posicao);
    ultimoGrupoInserido = grupo;
}

function renderizarBotoesDeComando() {
    commandGroupsContainer.innerHTML = gruposDeComandos.map((grupo) => `
        <div class="command-group">
            <div class="command-group-title">${grupo.titulo}</div>
            <div class="command-buttons">
                ${grupo.valores.map((valor) => `<button type="button" class="command-chip" data-group="${grupo.titulo}" data-value="${valor}">${valor}</button>`).join('')}
            </div>
        </div>
    `).join('');

    commandGroupsContainer.querySelectorAll('.command-chip').forEach((botao) => {
        botao.addEventListener('click', () => inserirNoCampo(botao.dataset.value, botao.dataset.group));
    });
}

async function carregarJogos() {
    const jogos = await conexao.select('jogo', 'id, nome');
    const lista = jogos || [];
    preencherSelect(jogoSelect, lista, 'Selecione um jogo');
}

async function carregarPersonagens() {
    const personagens = await conexao.select('personagem', 'id, nome, icone');
    todosOsPersonagens = personagens || [];
}

async function carregarPersonagensPorJogo(idJogo) {
    if (!idJogo) {
        personagemSelect.innerHTML = '<option value="" disabled selected>Selecione um jogo primeiro</option>';
        personagemSelect.disabled = true;
        atualizarPreview(null);
        return;
    }

    const relacoes = await conexao.selectIgual('personagem_jogo', 'id_personagem', 'id_jogo', idJogo);
    const ids = (relacoes || []).map(item => item.id_personagem);
    const personagens = todosOsPersonagens.filter(personagem => ids.includes(personagem.id));

    if (personagens.length === 0) {
        personagemSelect.innerHTML = '<option value="" disabled selected>Nenhum personagem encontrado</option>';
        personagemSelect.disabled = true;
        atualizarPreview(null);
        return;
    }

    preencherSelect(personagemSelect, personagens, 'Selecione um personagem');
    personagemSelect.disabled = false;
    atualizarPreview(null);
}

jogoSelect.addEventListener('change', async () => {
    const idJogo = jogoSelect.value;
    if (!idJogo) {
        personagemSelect.innerHTML = '<option value="" disabled selected>Selecione um jogo primeiro</option>';
        personagemSelect.disabled = true;
        atualizarPreview(null);
        return;
    }

    await carregarPersonagensPorJogo(idJogo);
});

personagemSelect.addEventListener('change', () => {
    const idPersonagem = personagemSelect.value;
    const personagem = todosOsPersonagens.find(item => String(item.id) === idPersonagem);
    atualizarPreview(personagem || null);
});

confirmarButton.addEventListener('click', () => {
    if (!jogoSelect.value || !personagemSelect.value || !nomeComandoInput.value.trim() || !tipoComandoSelect.value || !comandoInput.value.trim()) {
        feedback.textContent = 'Preencha todos os campos para confirmar.';
        feedback.className = 'form-feedback erro';
        return;
    }

    feedback.textContent = `Golpe "${nomeComandoInput.value.trim()}" (${tipoComandoSelect.value}) cadastrado para ${previewName.textContent}.`;
    feedback.className = 'form-feedback sucesso';
    nomeComandoInput.value = '';
    tipoComandoSelect.value = 'Normal';
    comandoInput.value = '';
    ultimoGrupoInserido = null;
    jogoSelect.value = '';
    personagemSelect.innerHTML = '<option value="" disabled selected>Selecione um jogo primeiro</option>';
    personagemSelect.disabled = true;
    atualizarPreview(null);
});

async function iniciar() {
    resetarPreview();
    renderizarBotoesDeComando();
    await carregarPersonagens();
    await carregarJogos();
}

iniciar();
