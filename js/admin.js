import { fetchAllOrders, updateOrderStatusById } from './ordersApi.js';
import { fetchProducts as fetchRemoteProducts, createProduct as createRemoteProduct, updateProduct as updateRemoteProduct, deleteProduct as deleteRemoteProduct } from './productsApi.js';

// Admin Dashboard functionality
const formatCurrency = (value) => value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
let orders = [];
let adminProducts = [];
let currentOrderFilter = 'all';
let isSyncingOrders = false;
let orderSyncTimer = null;
const ORDER_POLL_INTERVAL = 7000;

document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
});

async function initAdminDashboard() {
    setupSectionNavigation();
    await refreshProducts(true);
    handleProductForm();
    await refreshOrders(true);
    updateDashboardTimestamp();
    startOrderPolling();
}

async function refreshOrders(showLoadingState = false) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList || isSyncingOrders) return;

    if (showLoadingState) {
        ordersList.innerHTML = `
            <div class="text-center py-16 text-gray-500">
                <p class="text-lg font-semibold">Syncing latest orders…</p>
            </div>
        `;
    }

    isSyncingOrders = true;
    try {
        const { data, error } = await fetchAllOrders();
        if (error) throw error;
        orders = data || [];
        loadOrders(currentOrderFilter);
        updateStats();
    } catch (error) {
        console.error('Unable to load orders', error);
        ordersList.innerHTML = `
            <div class="text-center py-16 text-red-500">
                <p class="text-lg font-semibold">Unable to load orders. Please refresh.</p>
            </div>
        `;
    } finally {
        isSyncingOrders = false;
    }
}

function startOrderPolling() {
    if (orderSyncTimer) clearInterval(orderSyncTimer);
    orderSyncTimer = setInterval(() => refreshOrders(false), ORDER_POLL_INTERVAL);
}

function loadOrders(filter = 'all') {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    let filteredOrders = [...orders];
    if (filter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filter);
    }

    const filterLabel = filter === 'all' ? '' : `${filter} `;

    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="text-center py-16 text-gray-400">
                <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                </div>
                <p class="text-lg font-semibold text-gray-500">No ${filterLabel}orders to show</p>
                <p class="text-sm text-gray-400 mt-1">Orders will appear here in real-time</p>
            </div>
        `;
        return;
    }

    filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-green-200 hover:shadow-xl transition-all duration-300 cursor-pointer group" onclick="showOrderDetails('${order.id}')">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">Order #${order.id}</span>
                        <span class="px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                            order.status === 'pending' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' :
                            order.status === 'completed' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                        }">${order.status}</span>
                    </div>
                    <p class="text-sm font-medium text-gray-600 mb-2">${order.customer_name} • ${order.customer_email}</p>
                    <p class="text-sm font-semibold text-gray-700">${order.items.length} item(s) • <span class="text-green-600 font-bold">${formatCurrency(order.total)}</span></p>
                </div>
                <div class="text-right ml-6">
                    <p class="text-sm font-semibold text-gray-700">${new Date(order.created_at).toLocaleDateString()}</p>
                    <p class="text-xs text-gray-500 mt-1">${new Date(order.created_at).toLocaleTimeString()}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function showOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
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
                <h4 class="text-sm font-semibold text-gray-600 mb-2">Customer Information</h4>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span class="font-semibold">Name:</span> ${order.customer_name}</p>
                    <p><span class="font-semibold">Email:</span> ${order.customer_email}</p>
                    <p><span class="font-semibold">Phone:</span> ${order.customer_phone}</p>
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
                <div class="flex justify-between items-center mb-4">
                    <span class="text-lg font-semibold text-gray-900">Total</span>
                    <span class="text-2xl font-bold text-gray-900">${formatCurrency(order.total)}</span>
                </div>
                ${order.status === 'pending' ? `
                    <button onclick="updateOrderStatus('${order.id}', 'completed')" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                        Mark as Completed
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

async function updateOrderStatus(orderId, status) {
    try {
        await updateOrderStatusById(orderId, status);
        await refreshOrders(false);
        closeOrderModal();
    } catch (error) {
        console.error('Unable to update order status', error);
        alert('Unable to update order status right now.');
    }
}

function updateStats() {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const todayRevenue = orders
        .filter(o => {
            const orderDate = new Date(o.created_at);
            const today = new Date();
            return orderDate.toDateString() === today.toDateString();
        })
        .reduce((sum, o) => sum + o.total, 0);
    const uniqueCustomers = new Set(orders.map(o => o.customer_email)).size;
    
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('pending-orders').textContent = pendingOrders;
    document.getElementById('today-revenue').textContent = formatCurrency(todayRevenue);
    document.getElementById('active-customers').textContent = uniqueCustomers;
    updateDashboardTimestamp();
}

function setupSectionNavigation() {
    const triggers = document.querySelectorAll('[data-section-target]');
    if (!triggers.length) return;

    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => activateSection(trigger.dataset.sectionTarget));
    });

    activateSection('dashboard-section');
}

function activateSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        if (section.id === sectionId) {
            section.classList.remove('hidden');
            requestAnimationFrame(() => section.classList.add('admin-section-active'));
        } else {
            section.classList.remove('admin-section-active');
            section.classList.add('hidden');
        }
    });

    document.querySelectorAll('[data-section-target]').forEach(trigger => {
        styleSectionTrigger(trigger, trigger.dataset.sectionTarget === sectionId);
    });

    if (sectionId === 'orders-section') {
        clearOrderAlert();
    }
}

function styleSectionTrigger(trigger, isActive) {
    if (trigger.classList.contains('sidebar-link')) {
        if (isActive) {
            trigger.classList.add('bg-gradient-to-r', 'from-green-50', 'to-emerald-50', 'text-green-700', 'shadow-sm');
            trigger.classList.remove('text-gray-700');
        } else {
            trigger.classList.remove('bg-gradient-to-r', 'from-green-50', 'to-emerald-50', 'text-green-700', 'shadow-sm');
            trigger.classList.add('text-gray-700');
        }
    } else {
        if (isActive) {
            trigger.classList.add('bg-gradient-to-r', 'from-gray-100', 'to-gray-50', 'text-gray-900', 'border-gray-300', 'shadow-md');
            trigger.classList.remove('text-gray-600', 'border-gray-200', 'bg-white');
        } else {
            trigger.classList.remove('bg-gradient-to-r', 'from-gray-100', 'to-gray-50', 'text-gray-900', 'border-gray-300', 'shadow-md');
            trigger.classList.add('text-gray-600', 'border-gray-200', 'bg-white');
        }
    }
}

function showOrderAlert() {
    document.getElementById('order-alert-dot')?.classList.remove('hidden');
}

function clearOrderAlert() {
    document.getElementById('order-alert-dot')?.classList.add('hidden');
}

function getProductImagePlaceholder(index = 0) {
    // Unique coffee placeholder images - returns different image based on index
    const placeholders = [
        'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=800&q=80', // Coffee cup 1
        'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80', // Espresso
        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80', // Latte
        'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80', // Cappuccino
        'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80', // Americano
        'https://images.unsplash.com/photo-1570968914860-a693f2704e1c?auto=format&fit=crop&w=800&q=80', // Mocha
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', // Coffee beans
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80'  // Coffee pour
    ];
    return placeholders[index % placeholders.length];
}

async function refreshProducts(showLoading = false) {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;

    if (showLoading) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-10 text-center text-gray-500">Syncing products…</td>
            </tr>
        `;
    }

    try {
        const { data, error } = await fetchRemoteProducts();
        if (error) throw error;
        adminProducts = data || [];
        loadProducts();
    } catch (error) {
        console.error('Unable to load products', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-10 text-center text-red-500">Unable to load products. Please refresh.</td>
            </tr>
        `;
    }
}

function loadProducts() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;

    if (!adminProducts.length) {
        tableBody.innerHTML = `
            <tr>
                <td class="px-6 py-12 text-center text-gray-400" colspan="5">
                    <div class="flex flex-col items-center gap-3">
                        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                        <p class="font-semibold text-gray-500">No products yet</p>
                        <p class="text-sm text-gray-400">Add one above to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = adminProducts.map((product, index) => `
        <tr class="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 group">
            <td class="px-6 py-5">
                <div class="flex items-center gap-4">
                    <img src="${product.image_url || getProductImagePlaceholder(index)}" alt="${product.name}" class="w-14 h-14 rounded-2xl border-2 border-gray-100 object-cover shadow-sm group-hover:shadow-md transition-all" onerror="this.src='${getProductImagePlaceholder(index)}'">
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-gray-900 text-base">${product.name}</p>
                        <p class="text-xs font-medium text-gray-500 mt-0.5">${product.category || 'Uncategorised'}</p>
                        ${product.description ? `<p class="text-xs text-gray-400 mt-1.5 line-clamp-1" title="${product.description}">${product.description}</p>` : ''}
                    </div>
                </div>
            </td>
            <td class="px-6 py-5">
                <span class="font-bold text-gray-900 text-base">${formatCurrency(Number(product.price) || getPrimaryPrice(product) || 0)}</span>
            </td>
            <td class="px-6 py-5">
                <span class="text-sm font-medium text-gray-600">${product.size_option || 'Single size'}</span>
            </td>
            <td class="px-6 py-5">
                <span class="${getAvailabilityBadge(product.availability)}">${product.availability || 'In stock'}</span>
            </td>
            <td class="px-6 py-5 text-right">
                <div class="flex items-center justify-end gap-3">
                    <button class="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg font-semibold hover:from-green-100 hover:to-emerald-100 transition-all shadow-sm hover:shadow-md text-sm" onclick="editProduct('${product.id}')">Edit</button>
                    <button class="px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 rounded-lg font-semibold hover:from-red-100 hover:to-pink-100 transition-all shadow-sm hover:shadow-md text-sm" onclick="confirmArchiveProduct('${product.id}', '${product.name.replace(/'/g, "\\'")}')">Archive</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function handleProductForm() {
    const form = document.getElementById('product-form');
    if (!form) return;

    const previewEl = document.getElementById('product-image-preview');
    const urlInput = form.querySelector('input[name="productImage"]');
    const fileInput = form.querySelector('input[name="productImageUpload"]');

    setupImagePreviewListeners({ urlInput, fileInput, previewEl });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(form);

        try {
            const payload = await buildProductPayloadFromForm({
                data,
                fileField: 'productImageUpload',
                urlField: 'productImage'
            });
            payload.slug = payload.slug || `PROD-${Date.now()}`;
            await createRemoteProduct(payload);
            await refreshProducts();
        form.reset();
            setPreviewImage(previewEl, getProductImagePlaceholder());
            alert(`Product "${payload.name}" added successfully!`);
        } catch (error) {
            console.error('Unable to add product', error);
            alert('Unable to add this product right now.');
        }
    });

    form.addEventListener('reset', () => {
        setTimeout(() => {
            setPreviewImage(previewEl, getProductImagePlaceholder());
            if (fileInput) fileInput.value = '';
        }, 0);
    });

    // Handle edit form
    const editForm = document.getElementById('product-edit-form');
    if (editForm) {
        const editPreviewEl = document.getElementById('edit-product-image-preview');
        const editUrlInput = document.getElementById('edit-product-image');
        const editFileInput = document.getElementById('edit-product-image-upload');

        setupImagePreviewListeners({ urlInput: editUrlInput, fileInput: editFileInput, previewEl: editPreviewEl });

        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const productId = document.getElementById('edit-product-id').value;
            const product = adminProducts.find(p => p.id === productId);
            
            if (!product) return;

            try {
                const formData = new FormData(editForm);
                const payload = await buildProductPayloadFromForm({
                    data: formData,
                    existingProduct: product,
                    fileField: 'editProductImageUpload',
                    urlField: 'editProductImage'
                });
                await updateRemoteProduct(productId, payload);
                await refreshProducts();
            closeProductEditModal();
                alert(`Product "${payload.name}" updated successfully!`);
            } catch (error) {
                console.error('Unable to update product', error);
                alert('Unable to update this product right now.');
            }
        });
    }
}

function getAvailabilityBadge(status = 'In stock') {
    const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full';
    switch (status) {
        case 'Low stock':
            return `${baseClasses} bg-amber-50 text-amber-700 border border-amber-200`;
        case 'Paused':
            return `${baseClasses} bg-gray-100 text-gray-600 border border-gray-200`;
        default:
            return `${baseClasses} bg-green-50 text-green-700 border border-green-200`;
    }
}

function editProduct(productId) {
    const product = adminProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-category').value = product.category || '';
    document.getElementById('edit-product-price').value = getPrimaryPrice(product) || 0;
    const editImageInput = document.getElementById('edit-product-image');
    const editImagePreview = document.getElementById('edit-product-image-preview');
    const editFileInput = document.getElementById('edit-product-image-upload');
    editImageInput.value = product.image_url || '';
    document.getElementById('edit-product-description').value = product.description || '';
    document.getElementById('edit-product-size').value = product.size_option || 'Single size';
    document.getElementById('edit-product-availability').value = product.availability || 'In stock';
    setPreviewImage(editImagePreview, product.image_url || getProductImagePlaceholder());
    if (editFileInput) {
        editFileInput.value = '';
    }

    document.getElementById('product-edit-modal').classList.remove('hidden');
}

function closeProductEditModal() {
    document.getElementById('product-edit-modal').classList.add('hidden');
    document.getElementById('product-edit-form').reset();
}

async function confirmArchiveProduct(productId, productName) {
    if (!confirm(`Are you sure you want to archive "${productName}"?\n\nThis will remove it from the product catalog.`)) {
        return;
    }

    try {
        await deleteRemoteProduct(productId);
        await refreshProducts();
        alert(`Product "${productName}" has been archived.`);
    } catch (error) {
        console.error('Unable to delete product', error);
        alert('Unable to archive this product right now.');
    }
}

function updateDashboardTimestamp() {
    const el = document.getElementById('dashboard-timestamp');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function filterOrders(status) {
    currentOrderFilter = status;
    loadOrders(status);
}

function setupImagePreviewListeners({ urlInput, fileInput, previewEl }) {
    if (urlInput) {
        urlInput.addEventListener('input', () => {
            const value = urlInput.value.trim();
            if (value) setPreviewImage(previewEl, value);
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', event => {
            const file = event.target.files?.[0];
            if (file) {
                const objectUrl = URL.createObjectURL(file);
                setPreviewImage(previewEl, objectUrl);
            }
        });
    }
}

function setPreviewImage(previewEl, src) {
    if (!previewEl) return;
    previewEl.src = src || getProductImagePlaceholder();
}

async function extractImageValue(formData, fileField, urlField) {
    const file = formData.get(fileField);
    if (file && typeof file === 'object' && file.size) {
        return await readFileAsDataURL(file);
    }
    const url = (formData.get(urlField) || '').trim();
    if (url) return url;
    return null;
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getPrimaryPrice(product = {}) {
    if (typeof product.price === 'number') {
        return product.price;
    }
    if (Array.isArray(product.sizes) && product.sizes.length) {
        return Number(product.sizes[0].price) || 0;
    }
    return 0;
}

async function buildProductPayloadFromForm({ data, existingProduct = {}, fileField, urlField }) {
    const name = (data.get('productName') || data.get('editProductName') || '').trim();
    const category = (data.get('productCategory') || 'Coffee').trim();
    const price = parseFloat(data.get('productPrice')) || getPrimaryPrice(existingProduct) || 0;
    const sizeOption = data.get('productSize') || 'Single size';
    const availability = data.get('productAvailability') || 'In stock';
    const description = (data.get('productDescription') || '').trim() || null;
    const image = await extractImageValue(data, fileField, urlField) || existingProduct.image_url || getProductImagePlaceholder();
    const sizes = buildSizesArray(sizeOption, price);
    const defaultSize = existingProduct.default_size || sizes[0]?.key || 'standard';

    return {
        slug: existingProduct.slug || null,
        name,
        category,
        category_label: existingProduct.category_label || deriveCategoryLabel(category),
        badge: existingProduct.badge || deriveBadge(category),
        description,
        image_url: image,
        availability,
        cta_theme: existingProduct.cta_theme || inferThemeFromCategory(category),
        size_option: sizeOption,
        default_size: defaultSize,
        price,
        sizes
    };
}

function buildSizesArray(sizeOption, price) {
    const basePrice = Number(price) || 0;
    if ((sizeOption || '').toLowerCase().includes('small')) {
        return [
            { key: 'small', label: 'Small', price: Math.max(basePrice - 20, 0) },
            { key: 'medium', label: 'Medium', price: basePrice },
            { key: 'large', label: 'Large', price: basePrice + 20 }
        ];
    }

    return [
        { key: 'standard', label: 'Standard', price: basePrice }
    ];
}

function deriveCategoryLabel(category = '') {
    return category;
}

function deriveBadge(category = '') {
    if (!category) return 'Featured';
    if (category.toLowerCase().includes('bread')) return '🥖 Fresh';
    if (category.toLowerCase().includes('pastry')) return '🥐 Pastry';
    return '🌿 Signature';
}

function inferThemeFromCategory(category = '') {
    const lower = category.toLowerCase();
    return lower.includes('bread') || lower.includes('pastr') ? 'amber' : 'green';
}

window.filterOrders = filterOrders;
window.editProduct = editProduct;
window.confirmArchiveProduct = confirmArchiveProduct;
window.closeProductEditModal = closeProductEditModal;
