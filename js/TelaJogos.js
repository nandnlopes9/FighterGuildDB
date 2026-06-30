import * as conexao from './conexaoBD.js';

let todosOsJogos = [];

function criarCardJogo(jogo) {
    const nome = jogo?.nome || 'Sem nome';
    const capa = jogo?.capa || '';

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

function filtrarJogos(termo) {
    const texto = termo.toLowerCase().trim();

    if (!texto) {
        renderizarJogos(todosOsJogos);
        return;
    }

    const filtrados = todosOsJogos.filter((jogo) =>
        (jogo.nome || '').toLowerCase().includes(texto)
    );

    renderizarJogos(filtrados);
}

async function carregarJogos() {
    const jogos = await conexao.select('jogo', 'id, nome, capa');
    todosOsJogos = jogos || [];
    renderizarJogos(todosOsJogos);
}

const inputBusca = document.getElementById('search-jogo');
if (inputBusca) {
    inputBusca.addEventListener('input', (event) => filtrarJogos(event.target.value));
}

carregarJogos();
