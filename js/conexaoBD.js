const supabaseUrl = 'https://qogwqralxlrdtewzcaum.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZ3dxcmFseGxyZHRld3pjYXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzg4NDcsImV4cCI6MjA5MjY1NDg0N30.0kOKsfoVK4IimiRdl7xDvHKwE-UB1LaMoreFwhFBpOU';

export const supabaseClient = window.supabase?.createClient
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : null;

const BUCKETS_STORAGE = ['Golpe', 'images', 'imagens', 'fotos', 'uploads', 'capas', 'icones'];

export function normalizarUrlImagem(valor) {
    if (!valor || typeof valor !== 'string') return '';

    const texto = valor.trim();
    if (!texto) return '';
    if (texto.startsWith('http://') || texto.startsWith('https://') || texto.startsWith('data:')) return texto;
    if (texto.startsWith('/storage/')) {
        return `https://qogwqralxlrdtewzcaum.supabase.co${texto}`;
    }

    return texto;
}

async function executarConsulta(tableName, colunas, { atributo, valor, operador = 'eq' } = {}) {
    if (!supabaseClient) {
        console.error('Supabase não inicializado.');
        return null;
    }

    let query = supabaseClient.from(tableName).select(colunas);

    if (atributo !== undefined && valor !== undefined) {
        query = operador === 'neq' ? query.neq(atributo, valor) : query.eq(atributo, valor);
    }

    const { data, error } = await query;

    if (error) {
        console.error(error);
        return null;
    }

    return data ?? [];
}

export async function selectIgual(tableName, colunas, atributo, valor) {
    return executarConsulta(tableName, colunas, { atributo, valor });
}

export async function selectDif(tableName, colunas, atributo, valor) {
    return executarConsulta(tableName, colunas, { atributo, valor, operador: 'neq' });
}

export async function select(tableName, colunas) {
    return executarConsulta(tableName, colunas);
}

export async function selectComFallback(tabelas, colunas) {
    const nomes = Array.isArray(tabelas) ? tabelas : [tabelas];

    for (const nomeTabela of nomes) {
        const dados = await executarConsulta(nomeTabela, colunas);
        if (Array.isArray(dados) && dados.length > 0) {
            return dados;
        }
    }

    return [];
}

export async function insert(tableName, dados) {
    if (!supabaseClient) {
        console.error('Supabase não inicializado.');
        return { erro: { message: 'Supabase não inicializado.' } };
    }

    const { data, error } = await supabaseClient.from(tableName).insert(dados).select();

    if (error) {
        console.error(error);
        return { erro: error };
    }

    return data ?? [];
}

export async function update(tableName, dados, id) {
    if (!supabaseClient) {
        console.error('Supabase não inicializado.');
        return { erro: { message: 'Supabase não inicializado.' } };
    }

    const { data, error } = await supabaseClient.from(tableName).update(dados).eq('id', id).select();

    if (error) {
        console.error(error);
        return { erro: error };
    }

    return data ?? [];
}

export async function deleteRecord(tableName, id, atributo='id') {
    if (!supabaseClient) {
        console.error('Supabase não inicializado.');
        return { erro: { message: 'Supabase não inicializado.' } };
    }

    const { data, error } = await supabaseClient.from(tableName).delete().eq(atributo, id).select();

    if (error) {
        console.error(error);
        return { erro: error };
    }

    return data ?? [];
}

export async function uploadImagemGolpe(arquivo, pasta = 'geral', bucketPreferido = 'Golpe') {
    if (!supabaseClient) {
        return { erro: { message: 'Supabase não inicializado.' } };
    }

    if (!arquivo || !(arquivo instanceof File)) {
        return { erro: { message: 'Nenhum arquivo válido foi enviado.' } };
    }

    const nomeArquivo = `${Date.now()}-${arquivo.name.replace(/\s+/g, '-').toLowerCase()}`;
    const caminho = `${pasta}/${nomeArquivo}`;
    const buckets = [bucketPreferido, ...BUCKETS_STORAGE.filter((bucket) => bucket !== bucketPreferido)];

    for (const bucket of buckets) {
        const { error } = await supabaseClient.storage
            .from(bucket)
            .upload(caminho, arquivo, {
                cacheControl: '3600',
                upsert: false,
                contentType: arquivo.type || 'application/octet-stream',
            });

        if (!error) {
            const { data: publicData } = supabaseClient.storage.from(bucket).getPublicUrl(caminho);
            return { url: publicData?.publicUrl || null, caminho, bucket };
        }
    }

    return { erro: { message: 'Não foi possível enviar a imagem para nenhum bucket disponível.' } };
}