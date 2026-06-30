import * as conexao from './conexaoBD.js';

const tipoSelect = document.getElementById('tipo-entidade');
const registroSelect = document.getElementById('registro-select');
const btnCarregar = document.getElementById('btn-carregar');
const container = document.getElementById('form-container');

let cache = { jogos: [], personagens: [], arquetipos: [], participacoes: [] };

const PLATAFORMAS_PREDEFINIDAS = [
    'Super Nintendo (SNES)',
    'Nintendo Entertainment System (NES)',
    'Nintendo 64',
    'Nintendo GameCube',
    'Nintendo Wii',
    'Nintendo Wii U',
    'Nintendo Switch',
    'Nintendo Switch 2',
    'Game Boy',
    'Game Boy Color',
    'Game Boy Advance',
    'Nintendo DS',
    'Nintendo 3DS',
    'Sega Master System',
    'Sega Genesis / Mega Drive',
    'Sega Saturn',
    'Dreamcast',
    'Game Gear',
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
    'macOS',
    'Neo Geo AES',
    'Neo Geo MVS',
    'Neo Geo CD',
    'Neo Geo Pocket',
    'Neo Geo Pocket Color',
    '3DO',
    'PC Engine / TurboGrafx-16',
    'PC-FX',
    'Atari Jaguar',
    'Google Stadia',
    'Amazon Luna',
    'NVIDIA GeForce NOW',
    'Steam Deck',
    'Android',
    'iOS'
];

function normalizarPlataformas(valor) {
    if (Array.isArray(valor)) return valor.filter(Boolean).map((item) => String(item));
    if (typeof valor === 'string') {
        if (!valor) return [];
        try {
            const parsed = JSON.parse(valor);
            if (Array.isArray(parsed)) return parsed.filter(Boolean).map((item) => String(item));
        } catch (error) {
            // fallback para texto simples
        }
        return valor.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
}

function criarCampo(label, nome, valor, tipo = 'text') {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    wrap.innerHTML = `<span class="field-label">${label}</span>`;
    const input = document.createElement(tipo === 'textarea' ? 'textarea' : 'input');
    input.name = nome;
    input.value = valor ?? '';
    if (tipo !== 'textarea') {
        input.type = tipo;
    }
    wrap.appendChild(input);
    return wrap;
}

function criarCampoArquivo(label, nome) {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    wrap.innerHTML = `<span class="field-label">${label}</span>`;
    const input = document.createElement('input');
    input.type = 'file';
    input.name = nome;
    input.accept = 'image/*';
    wrap.appendChild(input);
    return wrap;
}

function criarSelect(label, nome, options, valor) {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    wrap.innerHTML = `<span class="field-label">${label}</span>`;
    const select = document.createElement('select');
    select.name = nome;
    options.forEach((item) => {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.text;
        if (String(item.value) === String(valor)) option.selected = true;
        select.appendChild(option);
    });
    wrap.appendChild(select);
    return wrap;
}

function criarCheckboxes(label, nome, options, valores = []) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.innerHTML = `<span class="field-label">${label}</span>`;
    const container = document.createElement('div');
    container.className = 'checkbox-list';
    options.forEach((item) => {
        const labelItem = document.createElement('label');
        labelItem.className = 'checkbox-item';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = nome;
        input.value = item;
        if (valores.includes(String(item))) input.checked = true;
        const span = document.createElement('span');
        span.textContent = item;
        labelItem.appendChild(input);
        labelItem.appendChild(span);
        container.appendChild(labelItem);
    });
    wrap.appendChild(container);
    return wrap;
}

function limparForm() {
    container.innerHTML = '';
}

async function carregarOpcoes() {
    const [jogos, personagens, arquetipos, participacoes] = await Promise.all([
        conexao.select('jogo', 'id, nome'),
        conexao.select('personagem', 'id, nome'),
        conexao.select('arquetipo', 'id, nome'),
        conexao.select('personagem_jogo', 'id, id_personagem, id_jogo'),
    ]);
    cache.jogos = jogos || [];
    cache.personagens = personagens || [];
    cache.arquetipos = arquetipos || [];
    cache.participacoes = participacoes || [];
}

async function carregarRegistros() {
    const tipo = tipoSelect.value;
    let dados = [];
    switch (tipo) {
        case 'jogo':
            dados = await conexao.select('jogo', 'id, nome');
            break;
        case 'personagem':
            dados = await conexao.select('personagem', 'id, nome');
            break;
        case 'personagem_jogo':
            dados = await conexao.select('personagem_jogo', 'id, id_personagem, id_jogo');
            break;
        case 'golpe':
            dados = await conexao.select('golpe', 'id, nome, tipo, id_personagem_jogo');
            break;
        case 'arquetipo':
            dados = await conexao.select('arquetipo', 'id, nome');
            break;
    }

    registroSelect.innerHTML = '<option value="" disabled selected>Selecione um registro</option>' + (dados || []).map((item) => {
        if (tipo === 'personagem_jogo') {
            const personagem = cache.personagens.find((p) => String(p.id) === String(item.id_personagem));
            const jogo = cache.jogos.find((j) => String(j.id) === String(item.id_jogo));
            return `<option value="${item.id}">${personagem?.nome || 'Personagem'} · ${jogo?.nome || 'Jogo'}</option>`;
        }
        if (tipo === 'golpe') {
            return `<option value="${item.id}">${item.nome || 'Golpe'} (${item.tipo || 'Sem tipo'})</option>`;
        }
        return `<option value="${item.id}">${item.nome}</option>`;
    }).join('');
}

async function carregarFormulario() {
    const tipo = tipoSelect.value;
    const id = registroSelect.value;
    limparForm();
    if (!id) return;

    let registro = null;
    switch (tipo) {
        case 'jogo':
            registro = (await conexao.selectIgual('jogo', 'id, nome, franquia, desenvolvedora, genero, data_lancamento, capa', 'id', id))[0];
            break;
        case 'personagem':
            registro = (await conexao.selectIgual('personagem', 'id, nome, id_arquetipo, historia, icone', 'id', id))[0];
            break;
        case 'personagem_jogo':
            registro = (await conexao.selectIgual('personagem_jogo', 'id, id_personagem, id_jogo, vida, dificuldade, data_de_inclusao', 'id', id))[0];
            break;
        case 'golpe':
            registro = (await conexao.selectIgual('golpe', 'id, nome, tipo, comando, id_personagem_jogo', 'id', id))[0];
            break;
        case 'arquetipo':
            registro = (await conexao.selectIgual('arquetipo', 'id, nome, descricao', 'id', id))[0];
            break;
    }

    if (!registro) return;

    const form = document.createElement('form');
    form.id = 'form-editar';
    form.className = 'card inner-card';

    if (tipo === 'jogo') {
        form.appendChild(criarCampo('Nome', 'nome', registro.nome));
        form.appendChild(criarCampo('Franquia', 'franquia', registro.franquia));
        form.appendChild(criarCampo('Desenvolvedora', 'desenvolvedora', registro.desenvolvedora));
        form.appendChild(criarCampo('Gênero', 'genero', registro.genero));
        form.appendChild(criarCampo('Data de lançamento', 'data_lancamento', registro.data_lancamento, 'date'));
        form.appendChild(criarCampoArquivo('Capa', 'capa'));
        form.appendChild(criarCheckboxes('Plataformas', 'plataformas', PLATAFORMAS_PREDEFINIDAS, normalizarPlataformas(registro.plataformas)));
    } else if (tipo === 'personagem') {
        form.appendChild(criarCampo('Nome', 'nome', registro.nome));
        form.appendChild(criarSelect('Arquétipo', 'id_arquetipo', cache.arquetipos.map((item) => ({ value: item.id, text: item.nome })), registro.id_arquetipo));
        form.appendChild(criarCampo('História', 'historia', registro.historia, 'textarea'));
        form.appendChild(criarCampoArquivo('Ícone', 'icone'));
    } else if (tipo === 'personagem_jogo') {
        form.appendChild(criarSelect('Jogo', 'id_jogo', cache.jogos.map((item) => ({ value: item.id, text: item.nome })), registro.id_jogo));
        form.appendChild(criarSelect('Personagem', 'id_personagem', cache.personagens.map((item) => ({ value: item.id, text: item.nome })), registro.id_personagem));
        form.appendChild(criarCampo('Vida', 'vida', registro.vida, 'number'));
        form.appendChild(criarCampo('Dificuldade', 'dificuldade', registro.dificuldade, 'number'));
        form.appendChild(criarCampo('Data de inclusão', 'data_de_inclusao', registro.data_de_inclusao, 'date'));
        form.appendChild(criarCampoArquivo('Ícone do personagem em um jogo', 'icone_personagem_jogo'));
    } else if (tipo === 'golpe') {
        form.appendChild(criarCampo('Nome', 'nome', registro.nome));
        form.appendChild(criarSelect('Tipo', 'tipo', [
            { value: 'Normal', text: 'Normal' },
            { value: 'Especial', text: 'Especial' },
        ], registro.tipo));
        form.appendChild(criarCampo('Comando', 'comando', registro.comando, 'textarea'));
        const grupos = [
            { titulo: 'Direções', valores: ['↑', '↓', '←', '→', '↖', '↗', '↙', '↘'] },
            { titulo: 'Movimentos', valores: ['↻ 360°', '↺ 360°', '↻ 720°', '↺ 720°', 'Charge', 'Hold', 'Release', 'Rapid'] },
            { titulo: 'Botões', valores: ['LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'P', 'K', 'PP', 'KK', 'PPP', 'KKK'] },
            { titulo: 'Operadores', valores: ['+', ',', '(', ')'] },
            { titulo: 'Outros', valores: ['Any Punch', 'Any Kick', 'Dash', 'Backdash', 'Jump', 'Super Jump', 'Taunt'] },
        ];
        const comandosWrap = document.createElement('div');
        comandosWrap.className = 'field';
        comandosWrap.innerHTML = '<span class="field-label">Botões de comando</span>';
        const chips = document.createElement('div');
        chips.className = 'action-grid';
        grupos.forEach((grupo) => {
            const bloco = document.createElement('div');
            bloco.innerHTML = `<strong>${grupo.titulo}</strong>`;
            grupo.valores.forEach((valor) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'action-btn';
                button.textContent = valor;
                button.onclick = () => {
                    const campo = form.querySelector('textarea[name="comando"]');
                    if (campo) {
                        campo.value += `${campo.value ? ' ' : ''}${valor}`;
                    }
                };
                bloco.appendChild(button);
            });
            chips.appendChild(bloco);
        });
        comandosWrap.appendChild(chips);
        form.appendChild(comandosWrap);
        form.appendChild(criarSelect('Participação no jogo', 'id_personagem_jogo', cache.participacoes.map((item) => {
            const personagem = cache.personagens.find((p) => String(p.id) === String(item.id_personagem));
            const jogo = cache.jogos.find((j) => String(j.id) === String(item.id_jogo));
            return { value: item.id, text: `${personagem?.nome || 'Personagem'} · ${jogo?.nome || 'Jogo'}` };
        }), registro.id_personagem_jogo));
    } else if (tipo === 'arquetipo') {
        form.appendChild(criarCampo('Nome', 'nome', registro.nome));
        form.appendChild(criarCampo('Descrição', 'descricao', registro.descricao, 'textarea'));
    }

    const button = document.createElement('button');
    button.className = 'btn-submit';
    button.type = 'submit';
    button.textContent = 'Salvar alterações';
    form.appendChild(button);

    const feedback = document.createElement('p');
    feedback.className = 'form-feedback';
    form.appendChild(feedback);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dados = new FormData(form);
        const payload = {};
        const plataformasSelecionadas = [];

        for (const [chave, valor] of dados.entries()) {
            if (chave === 'plataformas') {
                plataformasSelecionadas.push(String(valor));
                continue;
            }
            if (valor instanceof File && valor.size > 0) {
                const pasta = chave === 'icone' || chave === 'icone_personagem_jogo' ? 'icones' : 'capas';
                const resultadoUpload = await conexao.uploadImagemGolpe(valor, pasta);
                if (resultadoUpload.erro) {
                    feedback.textContent = `Erro no upload: ${resultadoUpload.erro.message}`;
                    feedback.className = 'form-feedback erro';
                    return;
                }
                if (chave === 'icone_personagem_jogo') {
                    payload.icone = resultadoUpload.url;
                } else {
                    payload[chave] = resultadoUpload.url;
                }
            } else if (valor !== '') {
                payload[chave] = valor;
            }
        }

        if (tipo === 'jogo') {
            payload.plataformas = plataformasSelecionadas;
            const resultado = await conexao.update(tipo, payload, id);
            feedback.textContent = resultado?.erro ? `Erro: ${resultado.erro.message}` : 'Registro atualizado com sucesso.';
            feedback.className = `form-feedback ${resultado?.erro ? 'erro' : 'sucesso'}`;
            return;
        }

        if (tipo === 'personagem_jogo' && payload.icone_personagem_jogo) {
            payload.icone = payload.icone_personagem_jogo;
            delete payload.icone_personagem_jogo;
        }

        const resultado = await conexao.update(tipo, payload, id);
        feedback.textContent = resultado?.erro ? `Erro: ${resultado.erro.message}` : 'Registro atualizado com sucesso.';
        feedback.className = `form-feedback ${resultado?.erro ? 'erro' : 'sucesso'}`;
    });

    container.appendChild(form);
}

tipoSelect.addEventListener('change', async () => {
    await carregarOpcoes();
    await carregarRegistros();
    limparForm();
});

btnCarregar.addEventListener('click', async () => {
    await carregarOpcoes();
    await carregarRegistros();
    await carregarFormulario();
});

registroSelect.addEventListener('change', async () => {
    await carregarFormulario();
});

async function iniciar() {
    await carregarOpcoes();
    await carregarRegistros();
}
iniciar();
