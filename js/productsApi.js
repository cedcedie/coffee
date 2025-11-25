import { supabase } from './supabase.js';

const PRODUCTS_TABLE = 'products';

export async function fetchProducts() {
    const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .select('*')
        .order('name', { ascending: true });

    return { data: data || [], error };
}

export async function createProduct(payload) {
    const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProduct(id, payload) {
    const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProduct(id) {
    const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

