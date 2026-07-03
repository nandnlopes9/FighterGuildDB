import * as conexao from './conexaoBD.js';

const { normalizarUrlImagem } = conexao;

let todosOsJogos = [];
let todasAsPlataformas = [];

function preencherSelect(select, lista, placeholder, valueKey = 'value', textKey = 'text') {
    if (!select) return;

    if (!lista || lista.length === 0) {
        select.innerHTML = `<option value="" selected>${placeholder}</option>`;
        return;
    }

    const opcoes = lista
        .map((item) => `<option value="${item[valueKey]}">${item[textKey]}</option>`)
        .join('');

    select.innerHTML = `<option value="" selected>${placeholder}</option>${opcoes}`;
    select.value = '';
}

function criarCardJogo(jogo) {
    const nome = jogo?.nome || 'Sem nome';
    const capa = normalizarUrlImagem(jogo?.capa || jogo?.imagem || '');

    return `
        <a href="./TelaJogo.html?id=${jogo.id}" class="game-card-link">
            <div class="game-card">
                <div class="game-card-visual" style="background-image: url('${capa}')">
                    <img src="${capa}" alt="${nome}" onerror="this.style.display='none'">
                    <span>${nome}</span>
                </div>
            </div>
        </a>
    `;
}

function renderizarJogos(jogos) {
    const container = document.getElementById('jogos-grid');
    if (!container) return;

    if (!jogos || jogos.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum jogo encontrado.</p>';
        return;
    }

    container.innerHTML = jogos.map(criarCardJogo).join('');
}

function aplicarFiltros() {
    const texto = (document.getElementById('search-jogo')?.value || '').toLowerCase().trim();
    const plataformaSelecionada = document.getElementById('platform_list')?.value || '';
    const generoSelecionado = document.getElementById('genre_list')?.value || '';

    const filtrados = todosOsJogos.filter((jogo) => {
        const nomeBate = !texto || (jogo.nome || '').toLowerCase().includes(texto);
        const plataformaBate = !plataformaSelecionada || (todasAsPlataformas || []).some((plataforma) => {
            return String(plataforma.id_jogo) === String(jogo.id) && String(plataforma.plataforma) === String(plataformaSelecionada);
        });
        const generoBate = !generoSelecionado || String(jogo.genero || '').toLowerCase() === String(generoSelecionado).toLowerCase();

        return nomeBate && plataformaBate && generoBate;
    });

    renderizarJogos(filtrados);
}

async function carregarJogos() {
    const [jogos, plataformas] = await Promise.all([
        // SELECT id, nome, capa, genero FROM jogo
        conexao.select('jogo', 'id, nome, capa, genero'),
        // SELECT id_jogo, plataforma FROM plataforma
        conexao.select('plataforma', 'id_jogo, plataforma'),
    ]);

    todosOsJogos = jogos || [];
    todasAsPlataformas = plataformas || [];

    const listaPlataformas = [...new Set((todasAsPlataformas || []).map((item) => item.plataforma).filter(Boolean))]
        .map((plataforma) => ({ value: plataforma, text: plataforma }));

    const listaGeneros = [...new Set((todosOsJogos || []).map((jogo) => jogo.genero).filter(Boolean))]
        .map((genero) => ({ value: genero, text: genero }));

    preencherSelect(document.getElementById('platform_list'), listaPlataformas, 'Selecione uma plataforma');
    preencherSelect(document.getElementById('genre_list'), listaGeneros, 'Selecione um gênero');

    renderizarJogos(todosOsJogos);
}

const inputBusca = document.getElementById('search-jogo');
if (inputBusca) {
    inputBusca.addEventListener('input', aplicarFiltros);
}

document.querySelectorAll('.filters-panel select').forEach((select) => {
    select.addEventListener('change', aplicarFiltros);
});

const botaoReset = document.getElementById('reset-filters');
if (botaoReset) {
    botaoReset.addEventListener('click', () => {
        document.getElementById('search-jogo').value = '';
        document.querySelectorAll('.filters-panel select').forEach((select) => {
            select.value = '';
        });
        aplicarFiltros();
    });
}

carregarJogos();
