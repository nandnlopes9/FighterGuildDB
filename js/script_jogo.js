import * as conexao from './conexaoBD.js';

const secaoP = document.getElementById('personagens');
const capaJogo = document.getElementById('capaJogo');
const title = document.getElementById('title');
const franquia = document.getElementById('franquia');
const dataLancamento = document.getElementById('dataLancamento');
const genero = document.getElementById('genero');
const desenvolvedora = document.getElementById('desenvolvedora');

async function carregarDados() {
    const params = new URLSearchParams(window.location.search);
    const idJogo = params.get('id');

    const dadosJogo = idJogo
        ? await conexao.selectIgual('jogo', '*', 'id', Number(idJogo))
        : await conexao.select('jogo', '*');

    const jogo = (dadosJogo || [])?.[0];

    if (!jogo) {
        console.warn('Nenhum jogo encontrado.');
        return;
    }

    atualizaDadosPg(jogo);

    const dadosPersonagem = await conexao.selectIgual(
        'personagem_jogo',
        'id_personagem, id_jogo, icone, personagem(nome, historia)',
        'id_jogo',
        jogo.id
    );

    renderizarPersonagens(dadosPersonagem ?? []);
}

function atualizaDadosPg(jogo) {
    if (!jogo) return;

    capaJogo.src = jogo.capa || '';
    title.textContent = jogo.nome || 'Sem nome';
    document.title = jogo.nome || 'Fighters Guild DB';
    franquia.textContent = `Franquia: ${jogo.franquia || 'Não informada'}`;
    dataLancamento.textContent = `Ano de lançamento: ${jogo.data_lancamento ? jogo.data_lancamento.split('-')[0] : 'Não informado'}`;
    genero.textContent = `Gênero: ${jogo.genero || 'Não informado'}`;
    desenvolvedora.textContent = `Desenvolvedora: ${jogo.desenvolvedora || 'Não informada'}`;
}

function renderizarPersonagens(personagens) {
    const fragmento = document.createDocumentFragment();

    if (!personagens || personagens.length === 0) {
        secaoP.innerHTML = '<p class="empty-state">Nenhum personagem encontrado para este jogo.</p>';
        ajustarTamanhoSecao();
        return;
    }

    personagens.forEach((personagem) => {
        const idPersonagem = personagem?.id_personagem ?? personagem?.personagem?.id ?? '';
        const cardPersonagem = document.createElement('a');
        cardPersonagem.href = idPersonagem
        ? `./PersonagemGolpes.html?id=${idPersonagem}`
        : './PersonagemGolpes.html';
        cardPersonagem.className = 'card_character';
        const nomePersonagem = personagem?.personagem?.nome || 'Sem nome';
        cardPersonagem.innerHTML = `${criarSVG(personagem.icone || '')}<div class="personagem-nome">${nomePersonagem}</div>`;
        fragmento.appendChild(cardPersonagem);
    });

    secaoP.replaceChildren(fragmento);
    ajustarTamanhoSecao();
}

function ajustarTamanhoSecao() {
    const personagens = document.getElementById('personagens');
    const container = document.getElementById('container_personagem');
    const cards = personagens.querySelectorAll('.card_character');

    if (!cards.length) return;

    const cardHeight = cards[0].getBoundingClientRect().height || 220;
    const alturaTotal = cardHeight + 20;

    personagens.style.minHeight = `${alturaTotal}px`;
    container.style.minHeight = `${alturaTotal}px`;
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