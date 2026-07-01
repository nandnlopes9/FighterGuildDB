import * as conexao from './conexaoBD.js';

const { normalizarUrlImagem } = conexao;

function setupAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
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

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-title h1');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

function criarCardAtualizacao(item) {
    const nomePersonagem = item?.personagem?.nome || 'Sem nome';
    const nomeJogo = item?.jogo?.nome || 'Sem jogo';
    const avatar = normalizarUrlImagem(item?.icone || item?.personagem?.icone || '');
    const href = `./PersonagemGolpes.html?id=${item.id_personagem}&jogoId=${item.id_jogo}`;

    return `
        <a href="${href}" class="update-item">
            <div class="update-avatar">
                ${avatar ? `<img src="${avatar}" alt="${nomePersonagem}">` : `<span>${nomePersonagem.charAt(0).toUpperCase()}</span>`}
            </div>
            <div class="update-info">
                <div class="update-name">${nomePersonagem}</div>
                <div class="update-game">${nomeJogo}</div>
            </div>
            <span class="moveset-badge">MOVESET</span>
        </a>
    `;
}

function criarCardJogo(jogo) {
    const nome = jogo?.nome || 'Sem nome';
    const capa = normalizarUrlImagem(jogo?.capa || jogo?.imagem || '');

    return `
        <a href="./TelaJogo.html?id=${jogo.id}" class="game-card-link">
            <div class="game-card">
                <div class="game-card-visual" style="background-image: url('${capa}')">
                    ${capa ? `<img src="${capa}" alt="${nome}">` : ''}
                    <span>${nome}</span>
                </div>
            </div>
        </a>
    `;
}

function preencherDestaque(item) {
    const featuredCard = document.getElementById('featured-card');
    if (!featuredCard) return;

    const nomePersonagem = item?.personagem?.nome || 'Sem nome';
    const nomeJogo = item?.jogo?.nome || 'Sem jogo';
    const arquetipo = item?.personagem?.arquetipo?.nome || 'Não informado';
    const dificuldade = item?.dificuldade ?? 'Não informada';
    const imagem = normalizarUrlImagem(item?.personagem?.icone || item?.icone || '');
    const href = `./PersonagemGolpes.html?id=${item.id_personagem}&jogoId=${item.id_jogo}`;

    featuredCard.outerHTML = `
        <a id="featured-card" href="${href}" class="featured-card">
            <div class="featured-card-graphic" style="${imagem ? `background-image: linear-gradient(135deg, rgba(59,130,246,0.6), rgba(139,92,246,0.8)), url('${imagem}'); background-size: cover; background-position: center;` : ''}">
                <span class="featured-card-title">${nomeJogo}</span>
                <span class="featured-card-subtitle">NEW CHAMP</span>
                <span class="featured-card-accent">${nomePersonagem}</span>
            </div>
            <div class="featured-info">
                <p class="featured-label">ARQUÉTIPO: ${arquetipo.toUpperCase()}</p>
                <p class="featured-difficulty">DIFICULDADE: ${dificuldade}</p>
                <span class="moveset-badge">🎮 MOVESET</span>
            </div>
        </a>
    `;
}

async function carregarConteudoInicial() {
    const [participacoes, personagens, jogos, arquetipos] = await Promise.all([
        conexao.select('personagem_jogo', 'id, id_personagem, id_jogo, icone, data_de_inclusao, dificuldade'),
        conexao.select('personagem', 'id, nome, icone, id_arquetipo'),
        conexao.select('jogo', 'id, nome, capa'),
        conexao.selectComFallback(['arquetipo', 'arquetipos', 'Arquetipo'], 'id, nome')
    ]);

    const listaParticipacoes = (participacoes || [])
        .slice()
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 4);

    const destaque = listaParticipacoes[0] || null;

    const mapaPersonagens = new Map((personagens || []).map((p) => [String(p.id), p]));
    const mapaJogos = new Map((jogos || []).map((j) => [String(j.id), j]));
    const mapaArquetipos = new Map((arquetipos || []).map((a) => [String(a.id), a]));

    if (destaque) {
        const personagem = mapaPersonagens.get(String(destaque.id_personagem));
        const jogo = mapaJogos.get(String(destaque.id_jogo));
        const arquetipo = mapaArquetipos.get(String(personagem?.id_arquetipo));
        preencherDestaque({
            ...destaque,
            personagem: personagem ? { ...personagem, arquetipo } : null,
            jogo
        });
    } else {
        const featuredCard = document.getElementById('featured-card');
        if (featuredCard) {
            featuredCard.innerHTML = '<div class="featured-info"><p class="featured-label">Nenhum campeão cadastrado ainda.</p></div>';
        }
    }

    const updatesList = document.getElementById('updates-list');
    if (updatesList) {
        if (listaParticipacoes.length === 0) {
            updatesList.innerHTML = '<p class="empty-state">Nenhuma atualização recente disponível.</p>';
        } else {
            updatesList.innerHTML = listaParticipacoes.map((item) => {
                const personagem = mapaPersonagens.get(String(item.id_personagem));
                const jogo = mapaJogos.get(String(item.id_jogo));
                return criarCardAtualizacao({ ...item, personagem, jogo });
            }).join('');
        }
    }

    const gamesGrid = document.getElementById('games-grid');
    if (gamesGrid) {
        if (!jogos || jogos.length === 0) {
            gamesGrid.innerHTML = '<p class="empty-state">Nenhum jogo cadastrado ainda.</p>';
        } else {
            gamesGrid.innerHTML = (jogos || []).map(criarCardJogo).join('');
        }
    }

    setupAnimations();
}

carregarConteudoInicial();
