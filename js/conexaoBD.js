const supabaseUrl = 'https://qogwqralxlrdtewzcaum.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZ3dxcmFseGxyZHRld3pjYXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzg4NDcsImV4cCI6MjA5MjY1NDg0N30.0kOKsfoVK4IimiRdl7xDvHKwE-UB1LaMoreFwhFBpOU';

export const supabaseClient = window.supabase?.createClient
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : null;

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