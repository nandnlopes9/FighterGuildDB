import * as conexao from './conexaoBD.js';

const { normalizarUrlImagem } = conexao;

function criarCardJogo(jogo) {
    const nome = jogo?.nome || 'Sem nome';
    const capa = normalizarUrlImagem(jogo?.capa || jogo?.imagem || '');
    return `
        <a href="./TelaJogo.html?id=${jogo.id}" class="game-card-link">
            <div class="game-card">
                <div class="game-card-visual game-card-visual--street" style="background-image: url('${capa}')">
                    <span>${nome}</span>
                </div>
            </div>
        </a>
    `;
}

function renderizarJogos(jogos) {
    const container = document.querySelector('.game-grid');
    if (!container) return;

    if (!jogos || jogos.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum jogo encontrado para este personagem.</p>';
        return;
    }

    container.innerHTML = jogos.map(criarCardJogo).join('');
}

function preencherDetalhes(personagem, arquetipo) {
    const nome = personagem?.nome || 'Sem nome';
    const historia = personagem?.historia || 'História não informada.';
    const icone = normalizarUrlImagem(personagem?.icone || '');
    const nomeArquetipo = arquetipo?.nome || 'Não informado';

    const nomeElemento = document.querySelector('.character-meta-name');
    const titleElemento = document.querySelector('.character-name');
    const historiaElemento = document.querySelector('.character-history');
    const imageContainer = document.querySelector('.character-image');
    const arquetipoElemento = document.querySelector('.character-meta-archetype');

    if (nomeElemento) nomeElemento.textContent = nome.toUpperCase();
    if (titleElemento) titleElemento.textContent = nome.toUpperCase();
    if (historiaElemento) historiaElemento.textContent = historia;
    if (arquetipoElemento) arquetipoElemento.textContent = `Arquetipo: ${nomeArquetipo}`;
    if (imageContainer) {
        imageContainer.innerHTML = icone
            ? `<img src="${icone}" alt="${nome}" class="character-image__img">`
            : '<span class="character-image__placeholder">Sem imagem</span>';
    }
}

async function carregarPersonagemDetalhado() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        return;
    }

    const [personagens, arquetipos] = await Promise.all([
        // SELECT id, nome, historia, icone, id_arquetipo FROM personagem
        conexao.select('personagem', 'id, nome, historia, icone, id_arquetipo'),
        // SELECT id, nome FROM arquetipo
        conexao.select('arquetipo', 'id, nome')
    ]);
    const personagem = (personagens || []).find((item) => String(item.id) === String(id));
    const arquetipo = (arquetipos || []).find((item) => String(item.id) === String(personagem?.id_arquetipo));

    if (!personagem) {
        return;
    }

    preencherDetalhes(personagem, arquetipo);

    // SELECT id_jogo FROM personagem_jogo WHERE id_personagem = ...
    const relacoes = await conexao.selectIgual('personagem_jogo', 'id_jogo', 'id_personagem', id);
    const idsJogos = (relacoes || []).map((item) => item.id_jogo);
    // SELECT id, nome, capa FROM jogo
    const jogos = await conexao.select('jogo', 'id, nome, capa');
    const jogosDoPersonagem = (jogos || []).filter((jogo) => idsJogos.includes(jogo.id));

    renderizarJogos(jogosDoPersonagem);
}

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-title h1');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

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

carregarPersonagemDetalhado();
