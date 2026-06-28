const supabaseUrl = 'https://qogwqralxlrdtewzcaum.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZ3dxcmFseGxyZHRld3pjYXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzg4NDcsImV4cCI6MjA5MjY1NDg0N30.0kOKsfoVK4IimiRdl7xDvHKwE-UB1LaMoreFwhFBpOU';

export const supabaseClient = window.supabase?.createClient
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : null;

const BUCKETS_STORAGE = ['imagens', 'images', 'fotos', 'uploads'];

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

export async function uploadImagem(arquivo, pasta = 'geral') {
    if (!supabaseClient) {
        return { erro: { message: 'Supabase não inicializado.' } };
    }

    if (!arquivo || !(arquivo instanceof File)) {
        return { erro: { message: 'Nenhum arquivo válido foi enviado.' } };
    }

    const nomeArquivo = `${Date.now()}-${arquivo.name.replace(/\s+/g, '-').toLowerCase()}`;
    const caminho = `${pasta}/${nomeArquivo}`;

    for (const bucket of BUCKETS_STORAGE) {
        const { data, error } = await supabaseClient.storage
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

        const mensagem = String(error?.message || '').toLowerCase();
        if (!mensagem.includes('bucket') && !mensagem.includes('not found') && !mensagem.includes('does not exist')) {
            return { erro: error };
        }
    }

    return {
        erro: {
            message: 'Não foi possível encontrar um bucket de armazenamento válido no Supabase. Crie um bucket chamado "imagens".',
        },
    };
}