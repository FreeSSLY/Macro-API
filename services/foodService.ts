import { supabase } from '../supabaseClient';
import { FoodDatabaseItem } from '../types';

// UTILITIES for case conversion
const toCamel = (s: string) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
const toSnake = (s: string) => s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const isObject = (o: any) => o === Object(o) && !Array.isArray(o) && typeof o !== 'function';

const keysToCamel = (o: any): any => {
  if (isObject(o)) {
    const n: { [key: string]: any } = {};
    Object.keys(o).forEach((k) => {
      n[toCamel(k)] = keysToCamel(o[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => keysToCamel(i));
  }
  return o;
};

const keysToSnake = (o: any): any => {
  if (isObject(o)) {
    const n: { [key: string]: any } = {};
    Object.keys(o).forEach((k) => {
      n[toSnake(k)] = keysToSnake(o[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    // FIX: The variable `k` was out of scope. The correct variable for an array item is `i`.
    return o.map((i) => keysToSnake(i));
  }
  return o;
};


const PAGE_SIZE = 20;

export const getFoods = async (page: number = 0): Promise<FoodDatabaseItem[]> => {
    const { data, error } = await supabase
        .from('foods')
        .select('*')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
        console.error('Error fetching foods:', error.message);
        throw new Error(`Falha ao buscar alimentos do banco de dados. Verifique a política de segurança (RLS) da tabela 'foods'. Detalhes: ${error.message}`);
    }
    return keysToCamel(data) as FoodDatabaseItem[];
};

export const searchFoods = async (searchTerm: string): Promise<FoodDatabaseItem[]> => {
    if (!searchTerm.trim()) {
        return []; // Uma busca vazia deve retornar nenhum resultado. O componente lida com o carregamento da lista inicial.
    }
    // Usa `ilike` para uma busca case-insensitive que não depende de colunas especiais (fts).
    // Isso é mais robusto para setups manuais no Supabase.
    // A busca é feita para cada palavra do termo de busca.
    const searchWords = searchTerm.trim().split(/\s+/);
    let queryBuilder = supabase.from('foods').select('*');
    
    searchWords.forEach(word => {
        queryBuilder = queryBuilder.ilike('name', `%${word}%`);
    });

    const { data, error } = await queryBuilder.limit(50); // Limita os resultados da busca

    if (error) {
        console.error('Error searching foods:', error.message);
        throw new Error(`Falha ao pesquisar alimentos. Detalhes: ${error.message}`);
    }
    return keysToCamel(data) as FoodDatabaseItem[];
};

export const getFoodByName = async (name: string): Promise<FoodDatabaseItem | null> => {
    const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('name', name)
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
        console.error('Error fetching food by name:', error.message);
        throw new Error(`Falha ao buscar o alimento "${name}". Detalhes: ${error.message}`);
    }

    return data ? keysToCamel(data) as FoodDatabaseItem : null;
};

export const addFoodToDatabase = async (foodData: Omit<FoodDatabaseItem, 'id' | 'servingUnit'>): Promise<FoodDatabaseItem> => {
    const foodToInsert = {
        ...foodData,
        servingUnit: 'g' as 'g', // The base unit for servingSize is always grams
    };

    const { data, error } = await supabase
        .from('foods')
        .insert(keysToSnake(foodToInsert))
        .select()
        .single();
    
    if (error) {
        console.error('Error adding food:', error.message);
        if (error.code === '23505') { // Unique violation
            throw new Error(`Um alimento com o nome "${foodData.name}" já existe.`);
        }
        throw new Error(`Não foi possível adicionar o alimento. Detalhes: ${error.message}`);
    }

    return keysToCamel(data) as FoodDatabaseItem;
};
