import * as conexao from './conexaoBD.js';

let todosOsPersonagens = [];
let todasAsRelacoes = [];
let todosOsJogos = [];
let todosOsArquetipos = [];
let todosOsGolpes = [];

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

function criarCardPersonagem(personagem) {
    const nome = personagem?.nome || 'Sem nome';
    const icone = personagem?.icone ? `<img src="${personagem.icone}" alt="${nome}" class="game-card-image">` : '';

    return `
        <a href="./Personagem.html?id=${personagem.id}" class="game-card-link">
            <div class="game-card">
                <div class="game-card-visual game-card-visual--street">
                    ${icone}
                    <span>${nome}</span>
                </div>
            </div>
        </a>
    `;
}

function renderizarPersonagens(personagens) {
    const container = document.querySelector('.game-grid');
    if (!container) return;

    if (!personagens || personagens.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum personagem encontrado.</p>';
        return;
    }

    container.innerHTML = personagens.map(criarCardPersonagem).join('');
}

function configurarAnimacoesDosCards() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.game-card, .featured-card, .update-item').forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });

    document.querySelectorAll('.game-card, .featured-card').forEach((card) => {
        card.addEventListener('click', function () {
            this.style.animation = 'pulse 0.4s ease';
            setTimeout(() => {
                this.style.animation = '';
            }, 400);
        });
    });
}

function getValorSelect(id) {
    const select = document.getElementById(id);
    return select ? select.value : '';
}

function aplicarFiltros() {
    const movimentoSelecionado = getValorSelect('moviment_list');
    const jogoSelecionado = getValorSelect('game_list');
    const arquetipoSelecionado = getValorSelect('arquitype_list');
    const franquiaSelecionada = getValorSelect('franquia_list');

    const personagensFiltrados = todosOsPersonagens.filter((personagem) => {
        const relacoesDoPersonagem = todasAsRelacoes.filter((relacao) => String(relacao.id_personagem) === String(personagem.id));
        const jogosDoPersonagem = todosOsJogos.filter((jogo) => relacoesDoPersonagem.some((relacao) => String(relacao.id_jogo) === String(jogo.id)));

        if (jogoSelecionado && !relacoesDoPersonagem.some((relacao) => String(relacao.id_jogo) === String(jogoSelecionado))) {
            return false;
        }

        if (arquetipoSelecionado && String(personagem.id_arquetipo) !== String(arquetipoSelecionado)) {
            return false;
        }

        if (franquiaSelecionada && !jogosDoPersonagem.some((jogo) => jogo.franquia === franquiaSelecionada)) {
            return false;
        }
        if (movimentoSelecionado && !todosOsGolpes.some((golpe) => {
            const relacaoDoGolpe = todasAsRelacoes.find((relacao) => String(relacao.id) == String(golpe.id_personagem_jogo));
            return relacaoDoGolpe && String(relacaoDoGolpe.id_personagem) === String(personagem.id) && golpe.comando === movimentoSelecionado;
        })) {
            return false;
        }

        return true;
    });

    renderizarPersonagens(personagensFiltrados);
    configurarAnimacoesDosCards();
}

async function carregarDados() {
    const [personagens, relacoes, jogos, arquetipos, golpes] = await Promise.all([
        conexao.select('personagem', 'id, nome, icone, id_arquetipo'),
        conexao.select('personagem_jogo', 'id_personagem, id_jogo, id'),
        conexao.select('jogo', 'id, nome, franquia'),
        conexao.select('arquetipo', 'id, nome'),
        conexao.select('lista_movimentos', '*'),
    ]);

    todosOsPersonagens = personagens || [];
    todasAsRelacoes = relacoes || [];
    todosOsJogos = jogos || [];
    todosOsArquetipos = arquetipos || [];
    todosOsGolpes = golpes || [];
}

async function carregarFiltros() {
    const listaJogos = (todosOsJogos || []).map((jogo) => ({
        value: jogo.id,
        text: jogo.nome,
    }));

    const listaFranquias = [...new Set((todosOsJogos || [])
        .map((jogo) => jogo.franquia)
        .filter(Boolean))]
        .map((franquia) => ({ value: franquia, text: franquia }));

    const listaArquetipos = (todosOsArquetipos || []).map((arquetipo) => ({
        value: arquetipo.id,
        text: arquetipo.nome,
    }));

    const listaMovimentos = [...new Set((todosOsGolpes || [])
        .map((golpe) => golpe.comando)
        .filter(Boolean))]
        .map((tipo) => ({ value: tipo, text: tipo }));

    preencherSelect(document.getElementById('moviment_list'), listaMovimentos, 'Selecione um movimento');
    preencherSelect(document.getElementById('game_list'), listaJogos, 'Selecione um jogo');
    preencherSelect(document.getElementById('arquitype_list'), listaArquetipos, 'Selecione um arquétipo');
    preencherSelect(document.getElementById('franquia_list'), listaFranquias, 'Selecione uma franquia');
}

function registrarEventosFiltros() {
    document.querySelectorAll('.filters-panel select').forEach((select) => {
        select.addEventListener('change', aplicarFiltros);
    });

    const botaoReset = document.getElementById('reset-filters');
    if (botaoReset) {
        botaoReset.addEventListener('click', () => {
            document.querySelectorAll('.filters-panel select').forEach((select) => {
                select.value = '';
            });
            aplicarFiltros();
        });
    }
}

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-title h1');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

(async () => {
    await carregarDados();
    await carregarFiltros();
    registrarEventosFiltros();
    aplicarFiltros();
})();

