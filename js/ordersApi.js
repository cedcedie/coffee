import { supabase } from './supabase.js';

const ORDERS_TABLE = 'web_orders';

export async function createOrderRecord(order) {
    const { data, error } = await supabase
        .from(ORDERS_TABLE)
        .insert(order)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function fetchOrdersByEmail(email) {
    if (!email) return { data: [], error: new Error('Missing email') };

    const { data, error } = await supabase
        .from(ORDERS_TABLE)
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

export async function fetchAllOrders() {
    const { data, error } = await supabase
        .from(ORDERS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

    return { data: data || [], error };
}

export async function updateOrderStatusById(id, status) {
    const { data, error } = await supabase
        .from(ORDERS_TABLE)
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}


