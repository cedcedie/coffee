import { fetchOrdersByEmail } from './ordersApi.js';

// User Orders page functionality
const formatCurrency = (value) => value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
let cachedOrders = [];

document.addEventListener('DOMContentLoaded', () => {
    loadUserOrders();
});

async function loadUserOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    renderOrdersState(container, 'loading');

    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
        renderOrdersState(container, 'noEmail');
        return;
    }

    const { data, error } = await fetchOrdersByEmail(userEmail);
    if (error) {
        console.error('Failed to load orders', error);
        renderOrdersState(container, 'error');
        return;
    }

    cachedOrders = data;

    if (!data.length) {
        renderOrdersState(container, 'empty', userEmail);
        return;
    }
    
    container.innerHTML = data.map(order => `
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border border-gray-200" onclick="showOrderDetails('${order.id}')">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-4 mb-2">
                        <span class="text-xl font-bold text-gray-900">Order #${order.id}</span>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                        }">${order.status}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-1">${order.items.length} item(s) • Total: ${formatCurrency(order.total)}</p>
                    <p class="text-sm text-gray-500">${new Date(order.created_at).toLocaleDateString()} at ${new Date(order.created_at).toLocaleTimeString()}</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <p class="text-lg font-bold text-gray-900">${formatCurrency(order.total)}</p>
                    </div>
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </div>
            </div>
        </div>
    `).join('');
}

function showOrderDetails(orderId) {
    const order = cachedOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found for this user.');
        return;
    }
    
    const itemsSubtotal = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const deliveryAmount = Math.max(order.total - itemsSubtotal, 0);
    const modal = document.getElementById('order-modal');
    const content = document.getElementById('order-modal-content');
    
    content.innerHTML = `
        <div class="space-y-6">
            <div>
                <h4 class="text-sm font-semibold text-gray-600 mb-2">Order Information</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span class="font-semibold">Order ID:</span> ${order.id}</p>
                    <p><span class="font-semibold">Status:</span> <span class="px-2 py-1 rounded text-xs font-semibold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }">${order.status}</span></p>
                    <p><span class="font-semibold">Date:</span> ${new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>
            
            <div>
                <h4 class="text-sm font-semibold text-gray-600 mb-2">Delivery Information</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span class="font-semibold">Address:</span> ${order.delivery_address}</p>
                    ${order.location ? `<p><span class="font-semibold">Location:</span> ${order.location.address || 'N/A'}</p>` : ''}
                </div>
            </div>
            
            <div>
                <h4 class="text-sm font-semibold text-gray-600 mb-2">Payment Details</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span class="font-semibold">Method:</span> ${order.payment_method === 'gcash' ? 'GCash / e-Wallet' : 'Card'}</p>
                    ${order.payment_method === 'gcash' ? `
                        <p><span class="font-semibold">GCash Number:</span> ${order.gcash_number || '—'}</p>
                        <p><span class="font-semibold">Account Name:</span> ${order.gcash_account_name || '—'}</p>
                    ` : ''}
                </div>
            </div>
            
            <div>
                <h4 class="text-sm font-semibold text-gray-600 mb-2">Order Items</h4>
                <div class="space-y-2">
                    ${order.items.map(item => `
                        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                            <div>
                                <p class="font-semibold text-gray-900">${item.name}</p>
                                ${item.size ? `<p class="text-sm text-gray-600">Size: ${item.size}</p>` : ''}
                            </div>
                            <div class="text-right">
                                <p class="font-semibold text-gray-900">${formatCurrency(item.price)}</p>
                                <p class="text-sm text-gray-600">Qty: ${item.quantity}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="border-t border-gray-200 pt-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-gray-600">Subtotal</span>
                    <span class="font-semibold text-gray-900">${formatCurrency(itemsSubtotal)}</span>
                </div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-gray-600">Delivery</span>
                    <span class="font-semibold text-gray-900">${formatCurrency(deliveryAmount)}</span>
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span class="text-lg font-semibold text-gray-900">Total</span>
                    <span class="text-2xl font-bold text-gray-900">${formatCurrency(order.total)}</span>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

function getCurrentUserEmail() {
    return (localStorage.getItem('lastCustomerEmail') || '').toLowerCase();
}

function renderOrdersState(container, state, email = '') {
    const states = {
        loading: `
            <div class="text-center py-20 text-gray-500">
                <p class="text-lg font-semibold">Loading your orders...</p>
            </div>
        `,
        noEmail: `
            <div class="text-center py-20">
                <h3 class="text-2xl font-bold text-gray-900 mb-2">No orders on this device</h3>
                <p class="text-gray-600 mb-6">Complete a checkout and we'll remember the email you use so only your orders appear here.</p>
                <a href="menu.html" class="inline-block bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:via-emerald-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Browse Menu
                </a>
            </div>
        `,
        empty: `
            <div class="text-center py-20">
                <h3 class="text-2xl font-bold text-gray-900 mb-2">No orders for ${email}</h3>
                <p class="text-gray-600 mb-6">Place a new order with this email or switch browsers to see another history.</p>
                <a href="menu.html" class="inline-block bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:via-emerald-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Order Again
                </a>
            </div>
        `,
        error: `
            <div class="text-center py-20">
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Unable to load orders</h3>
                <p class="text-gray-600 mb-6">Please check your connection or try again later.</p>
            </div>
        `
    };

    container.innerHTML = states[state] || '';
}

window.showOrderDetails = showOrderDetails;
window.closeOrderModal = closeOrderModal;
