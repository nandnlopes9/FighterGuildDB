import * as conexao from './conexaoBD.js';

function formatarData(data) {
    if (!data) return 'Não informada';
    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) return data;
    return valor.toLocaleDateString('pt-BR');
}

function preencherDetalhes(personagem, participacao) {
    const nome = personagem?.nome || 'Sem nome';
    const icone = participacao?.icone || '';
    const arquetipo = personagem?.arquetipo?.nome || 'Não informado';
    const nomeElemento = document.getElementById('character-meta-name');
    const titleElemento = document.getElementById('character-name');
    const imageContainer = document.getElementById('character-image');
    const arquetipoElemento = document.getElementById('character-meta-archetype');
    const inclusionElemento = document.getElementById('character-meta-inclusion');
    const difficultyElemento = document.getElementById('character-meta-difficulty');

    if (nomeElemento) nomeElemento.textContent = nome.toUpperCase();
    if (titleElemento) titleElemento.textContent = nome.toUpperCase();
    if (arquetipoElemento) arquetipoElemento.textContent = `Arquetipo: ${arquetipo}`;
    if (inclusionElemento) inclusionElemento.textContent = `Data de inclusão: ${formatarData(participacao?.data_de_inclusao)}`;
    if (difficultyElemento) {
        const dificuldade = participacao?.dificuldade ?? 'Não informada';
        difficultyElemento.textContent = `Dificuldade: ${dificuldade}`;
    }

    if (imageContainer) {
        imageContainer.innerHTML = icone
            ? `<img src="${icone}" alt="${nome}" class="character-image__img">`
            : '<span class="character-image__placeholder">Sem imagem</span>';
    }
}

function renderizarGolpes(golpes) {
    const container = document.getElementById('moves-list');
    if (!container) return;

    if (!golpes || golpes.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum golpe cadastrado para este personagem.</p>';
        return;
    }

    container.innerHTML = golpes
        .map((golpe) => `
            <article class="move-item">
                <div class="move-top">
                    <h3 class="move-name">${golpe?.nome || 'Sem nome'}</h3>
                    <span class="move-type">${golpe?.tipo || 'Sem tipo'}</span>
                </div>
                <p class="move-command">${golpe?.comando || 'Comando não informado'}</p>
            </article>
        `)
        .join('');
}

async function carregarPersonagemDetalhado() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        return;
    }

    const personagens = await conexao.select('personagem', 'id, nome, arquetipo(nome)');
    const personagem = (personagens || []).find((item) => String(item.id) === String(id));

    if (!personagem) {
        return;
    }

    const participacoes = await conexao.selectIgual(
        'personagem_jogo',
        'id, id_personagem, id_jogo, dificuldade, data_de_inclusao, icone',
        'id_personagem',
        id
    );
    const participacao = (participacoes || [])[0] || null;

    preencherDetalhes(personagem, participacao);

    const idsParticipacoes = (participacoes || []).map((item) => item.id);
    const golpes = await conexao.select('golpe', 'id, nome, tipo, comando, id_personagem_jogo');
    const golpesDoPersonagem = (golpes || []).filter((golpe) => idsParticipacoes.includes(golpe.id_personagem_jogo));

    renderizarGolpes(golpesDoPersonagem);
}

carregarPersonagemDetalhado();
