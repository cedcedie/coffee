// Admin Dashboard functionality
const formatCurrency = (value) => value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
let orders = JSON.parse(localStorage.getItem('orders') || '[]');
let adminProducts = JSON.parse(localStorage.getItem('adminProducts') || '[]');
let currentOrderFilter = 'all';

if (!adminProducts.length) {
    adminProducts = getDefaultProducts();
    localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
}

if (!orders.length) {
    orders = getPlaceholderOrders();
    localStorage.setItem('orders', JSON.stringify(orders));
}

document.addEventListener('DOMContentLoaded', () => {
    setupSectionNavigation();
    loadOrders();
    loadProducts();
    handleProductForm();
    updateStats();
    updateDashboardTimestamp();

    // Simulate real-time order notifications (in production, use WebSockets or Supabase Realtime)
    setInterval(checkNewOrders, 3000);
});

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
        <div class="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer" onclick="showOrderDetails('${order.id}')">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-lg font-bold text-gray-900">Order #${order.id}</span>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                        }">${order.status}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-1">${order.customer_name} • ${order.customer_email}</p>
                    <p class="text-sm font-medium text-gray-700">${order.items.length} item(s) • <span class="text-green-600">${formatCurrency(order.total)}</span></p>
                </div>
                <div class="text-right ml-6">
                    <p class="text-sm font-medium text-gray-700">${new Date(order.created_at).toLocaleDateString()}</p>
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

function updateOrderStatus(orderId, status) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders(currentOrderFilter);
        updateStats();
        closeOrderModal();
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

function checkNewOrders() {
    // In production, this would check Supabase Realtime for new orders
    // For now, we'll just reload orders
    const currentCount = orders.length;
    orders = JSON.parse(localStorage.getItem('orders') || '[]');

    if (orders.length > currentCount) {
        document.getElementById('new-order-notification').classList.remove('hidden');
        showOrderAlert();
        loadOrders(currentOrderFilter);
        updateStats();
    }
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
        section.classList.toggle('hidden', section.id !== sectionId);
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
            trigger.classList.add('bg-gray-100', 'text-gray-900');
            trigger.classList.remove('text-gray-700');
        } else {
            trigger.classList.remove('bg-gray-100', 'text-gray-900');
            trigger.classList.add('text-gray-700');
        }
    } else {
        if (isActive) {
            trigger.classList.add('bg-gray-100', 'text-gray-900', 'border-gray-300');
            trigger.classList.remove('text-gray-600', 'border-gray-200', 'bg-white');
        } else {
            trigger.classList.remove('bg-gray-100', 'text-gray-900', 'border-gray-300');
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
                    <img src="${product.image || getProductImagePlaceholder(index)}" alt="${product.name}" class="w-14 h-14 rounded-2xl border-2 border-gray-100 object-cover shadow-sm group-hover:shadow-md transition-all" onerror="this.src='${getProductImagePlaceholder(index)}'">
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-gray-900 text-base">${product.name}</p>
                        <p class="text-xs font-medium text-gray-500 mt-0.5">${product.category || 'Uncategorised'}</p>
                        ${product.description ? `<p class="text-xs text-gray-400 mt-1.5 line-clamp-1" title="${product.description}">${product.description}</p>` : ''}
                    </div>
                </div>
            </td>
            <td class="px-6 py-5">
                <span class="font-bold text-gray-900 text-base">${formatCurrency(product.price || 0)}</span>
            </td>
            <td class="px-6 py-5">
                <span class="text-sm font-medium text-gray-600">${product.sizeOption || 'Single size'}</span>
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

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);

        const newProduct = {
            id: 'PROD-' + Date.now(),
            name: (data.get('productName') || '').trim(),
            category: (data.get('productCategory') || 'Coffee').trim(),
            price: parseFloat(data.get('productPrice')) || 0,
            image: (data.get('productImage') || '').trim() || null,
            description: (data.get('productDescription') || '').trim() || null,
            sizeOption: data.get('productSize') || 'Single size',
            availability: data.get('productAvailability') || 'In stock'
        };

        adminProducts.unshift(newProduct);
        localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
        loadProducts();
        form.reset();
        
        // Show success message
        alert(`Product "${newProduct.name}" added successfully!`);
    });

    // Handle edit form
    const editForm = document.getElementById('product-edit-form');
    if (editForm) {
        editForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const productId = document.getElementById('edit-product-id').value;
            const product = adminProducts.find(p => p.id === productId);
            
            if (!product) return;

            product.name = document.getElementById('edit-product-name').value.trim();
            product.category = document.getElementById('edit-product-category').value.trim();
            product.price = parseFloat(document.getElementById('edit-product-price').value) || 0;
            product.image = document.getElementById('edit-product-image').value.trim() || null;
            product.description = document.getElementById('edit-product-description').value.trim() || null;
            product.sizeOption = document.getElementById('edit-product-size').value;
            product.availability = document.getElementById('edit-product-availability').value;

            localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
            loadProducts();
            closeProductEditModal();
            
            alert(`Product "${product.name}" updated successfully!`);
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
    document.getElementById('edit-product-price').value = product.price || 0;
    document.getElementById('edit-product-image').value = product.image || '';
    document.getElementById('edit-product-description').value = product.description || '';
    document.getElementById('edit-product-size').value = product.sizeOption || 'Single size';
    document.getElementById('edit-product-availability').value = product.availability || 'In stock';

    document.getElementById('product-edit-modal').classList.remove('hidden');
}

function closeProductEditModal() {
    document.getElementById('product-edit-modal').classList.add('hidden');
    document.getElementById('product-edit-form').reset();
}

function confirmArchiveProduct(productId, productName) {
    if (confirm(`Are you sure you want to archive "${productName}"?\n\nThis will remove it from the product catalog.`)) {
        archiveProduct(productId);
        alert(`Product "${productName}" has been archived.`);
    }
}

function archiveProduct(productId) {
    adminProducts = adminProducts.filter(product => product.id !== productId);
    localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
    loadProducts();
}

function getDefaultProducts() {
    return [
        {
            id: 'PROD-1001',
            name: 'Mountain Espresso',
            category: 'Coffee',
            price: 180,
            sizeOption: 'Small / Medium / Large',
            availability: 'In stock',
            image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80',
            description: 'Bold and intense espresso with rich notes of dark chocolate, caramel, and a hint of nutty undertones. Perfect for those who crave a strong, full-bodied coffee experience.'
        },
        {
            id: 'PROD-1002',
            name: 'Balagtas Honey Wash',
            category: 'Signature Bean',
            price: 220,
            sizeOption: 'Single size',
            availability: 'Low stock',
            image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
            description: 'Our signature single-origin coffee with a unique honey-washed process. Features a smooth, sweet profile with floral notes, hints of citrus, and a delicate honey-like finish that lingers on the palate.'
        },
        {
            id: 'PROD-1003',
            name: 'Forest Latte',
            category: 'Coffee',
            price: 195,
            sizeOption: 'Small / Medium / Large',
            availability: 'In stock',
            image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
            description: 'Creamy and smooth latte made with our house blend espresso and steamed milk. Topped with delicate foam art, this comforting drink offers a perfect balance of coffee richness and milk sweetness.'
        },
        {
            id: 'PROD-1004',
            name: 'Cappuccino Classic',
            category: 'Coffee',
            price: 185,
            sizeOption: 'Small / Medium / Large',
            availability: 'In stock',
            image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
            description: 'Traditional Italian cappuccino with equal parts espresso, steamed milk, and velvety foam. Rich espresso base complemented by the creamy texture of perfectly frothed milk.'
        },
        {
            id: 'PROD-1005',
            name: 'Cold Brew Delight',
            category: 'Coffee',
            price: 200,
            sizeOption: 'Single size',
            availability: 'In stock',
            image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=800&q=80',
            description: 'Smooth and refreshing cold brew steeped for 18 hours. Low acidity with chocolate and caramel notes, served over ice. Perfect for hot days or when you need a refreshing caffeine boost.'
        },
        {
            id: 'PROD-1006',
            name: 'Butter Croissant',
            category: 'Bread',
            price: 150,
            sizeOption: 'Single size',
            availability: 'In stock',
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
            description: 'Flaky, buttery French croissant baked fresh daily. Golden, crispy exterior with a soft, airy interior. Perfect pairing with any coffee or enjoyed on its own.'
        },
        {
            id: 'PROD-1007',
            name: 'Americano',
            category: 'Coffee',
            price: 170,
            sizeOption: 'Small / Medium / Large',
            availability: 'In stock',
            image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80',
            description: 'Classic Americano made with our premium espresso shots and hot water. Clean, smooth taste with a full-bodied flavor profile. Ideal for those who prefer a stronger coffee without the intensity of straight espresso.'
        },
        {
            id: 'PROD-1008',
            name: 'Mocha Dream',
            category: 'Coffee',
            price: 210,
            sizeOption: 'Small / Medium / Large',
            availability: 'In stock',
            image: 'https://images.unsplash.com/photo-1570968914860-a693f2704e1c?auto=format&fit=crop&w=800&q=80',
            description: 'Indulgent mocha combining rich espresso with premium dark chocolate and steamed milk. Topped with whipped cream and chocolate shavings. A dessert-like treat for chocolate and coffee lovers.'
        }
    ];
}

function getPlaceholderOrders() {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    return [
        {
            id: 'ORD-1001',
            customer_name: 'Maria Santos',
            customer_email: 'maria.santos@email.com',
            status: 'pending',
            total: 550,
            subtotal: 430,
            delivery: 120,
            created_at: now.toISOString(),
            items: [
                { name: 'Mountain Espresso', quantity: 2, price: 180, size: 'Large' },
                { name: 'Butter Croissant', quantity: 1, price: 150, size: 'Single size' }
            ],
            delivery_address: '123 Main Street, Balagtas, Bulacan'
        },
        {
            id: 'ORD-1002',
            customer_name: 'Juan Dela Cruz',
            customer_email: 'juan.delacruz@email.com',
            status: 'completed',
            total: 370,
            subtotal: 250,
            delivery: 120,
            created_at: yesterday.toISOString(),
            items: [
                { name: 'Forest Latte', quantity: 1, price: 195, size: 'Medium' },
                { name: 'Butter Croissant', quantity: 1, price: 150, size: 'Single size' }
            ],
            delivery_address: '456 Oak Avenue, Balagtas, Bulacan'
        },
        {
            id: 'ORD-1003',
            customer_name: 'Ana Garcia',
            customer_email: 'ana.garcia@email.com',
            status: 'pending',
            total: 420,
            subtotal: 300,
            delivery: 120,
            created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            items: [
                { name: 'Cappuccino Classic', quantity: 1, price: 185, size: 'Large' },
                { name: 'Cold Brew Delight', quantity: 1, price: 200, size: 'Single size' }
            ],
            delivery_address: '789 Pine Road, Balagtas, Bulacan'
        },
        {
            id: 'ORD-1004',
            customer_name: 'Carlos Rodriguez',
            customer_email: 'carlos.rodriguez@email.com',
            status: 'completed',
            total: 630,
            subtotal: 510,
            delivery: 120,
            created_at: twoDaysAgo.toISOString(),
            items: [
                { name: 'Balagtas Honey Wash', quantity: 2, price: 220, size: 'Single size' },
                { name: 'Mocha Dream', quantity: 1, price: 210, size: 'Large' }
            ],
            delivery_address: '321 Elm Street, Balagtas, Bulacan'
        }
    ];
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

window.archiveProduct = archiveProduct;
window.filterOrders = filterOrders;
window.editProduct = editProduct;
window.confirmArchiveProduct = confirmArchiveProduct;
window.closeProductEditModal = closeProductEditModal;
