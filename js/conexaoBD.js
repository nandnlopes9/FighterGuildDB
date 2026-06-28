const supabaseUrl = 'https://qogwqralxlrdtewzcaum.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZ3dxcmFseGxyZHRld3pjYXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzg4NDcsImV4cCI6MjA5MjY1NDg0N30.0kOKsfoVK4IimiRdl7xDvHKwE-UB1LaMoreFwhFBpOU';

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);

export async function selectIgual(tableName, colunas, atributo, valor) {
    const { data, error } = await supabaseClient
        .from(`${tableName}`)
        .select(`${colunas}`)
        .eq(`${atributo}`, `${valor}`);
    if(error){
        console.error(error);
        return null;
    }
    return data;
}

export async function selectDif(tableName, colunas, atributo, valor) {
    const { data, error } = await supabaseClient
        .from(`${tableName}`)
        .select(`${colunas}`)
        .neq(`${atributo}`, `${valor}`);
    if(error){
        console.error(error);
        return null;
    }
    return data;
}

export async function select(tableName, colunas) {
    const { data, error } = await supabaseClient
        .from(`${tableName}`)
        .select(`${colunas}`)
    if(error){
        console.error(error);
        return null;
    }
    return data;
}

// Insere um registro (objeto) na tabela e retorna a linha criada, ou null em erro.
export async function insert(tableName, registro) {
    const { data, error } = await supabaseClient
        .from(`${tableName}`)
        .insert(registro)
        .select();
    if(error){
        console.error(error);
        return { erro: error };
    }
    return data;
}