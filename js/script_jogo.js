import * as conexao from './conexaoBD.js';

const secaoP = document.getElementById('personagens');
const capaJogo = document.getElementById('capaJogo');
const title = document.getElementById('title');

async function carregarDados() {
    const dadosJogo = await conexao.select('jogo', '*');
    const jogo = dadosJogo?.[0];

    if (!jogo) {
        console.warn('Nenhum jogo encontrado.');
        return;
    }

    capaJogo.src = jogo.capa;
    title.textContent = jogo.nome;
    document.title = jogo.nome;

    const dadosPersonagem = await conexao.selectIgual(
        'personagem_jogo',
        'icone, personagem(nome, historia)',
        'id_jogo',
        jogo.id
    );

    renderizarPersonagens(dadosPersonagem ?? []);
}

function renderizarPersonagens(personagens) {
    const fragmento = document.createDocumentFragment();

    personagens.forEach((personagem) => {
        const cardPersonagem = document.createElement('article');
        cardPersonagem.className = 'card_character';
        cardPersonagem.innerHTML = criarSVG(personagem.icone);
        fragmento.appendChild(cardPersonagem);
    });

    secaoP.replaceChildren(fragmento);
    ajustarTamanhoSecao();
}

function ajustarTamanhoSecao() {
    const personagens = document.getElementById('personagens');
    const ladoPersonagem = document.getElementById('lado_personagem');
    const container = document.getElementById('container_personagem');
    const cards = personagens.querySelectorAll('.card_character');

    if (!cards.length) return;

    const cardHeight = cards[0].getBoundingClientRect().height || 220;
    const alturaTotal = cardHeight + 20;

    personagens.style.minHeight = `${alturaTotal}px`;
    container.style.minHeight = `${alturaTotal}px`;
    ladoPersonagem.style.minHeight = `${alturaTotal + 70}px`;
}

function criarSVG(icone) {
    return `
        <div class="background" style="background-image:url('${icone}')"></div>
        <svg class="frame" viewBox="0 0 300 450" preserveAspectRatio="none">
            <polygon
                points="35,0 300,0 265,450 0,450"
                fill="none"
                stroke="#c000ff"
                stroke-width="4"
            />
        </svg>`;
}

let frameResize;
window.addEventListener('resize', () => {
    if (frameResize) {
        cancelAnimationFrame(frameResize);
    }

    frameResize = requestAnimationFrame(ajustarTamanhoSecao);
});

carregarDados();