// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
const formatCurrency = (value) => value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });

// Add to cart
document.addEventListener('DOMContentLoaded', () => {
    // Handle add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));
            const size = btn.getAttribute('data-size') || null;
            const image = btn.getAttribute('data-image') || null;

            addToCart(id, name, price, size, image);
            
            // Visual feedback
            btn.textContent = 'Added!';
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.textContent = 'Add to Cart';
                btn.classList.remove('bg-green-600');
            }, 1000);
        });
    });

    // Load cart on cart page
    if (window.location.pathname.includes('cart.html')) {
        loadCart();
    }

    // Update cart count in nav
    updateCartCount();
});

function addToCart(id, name, price, size = null, image = null) {
    const sizeSuffix = size ? ` (${size})` : '';
    const fullName = name + sizeSuffix;
    const itemKey = `${id}-${size || 'default'}`;
    
    const existingItem = cart.find(item => item.key === itemKey);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, key: itemKey, name: fullName, price: parseFloat(price), quantity: 1, size, image });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function loadCart() {
    const cartItemsEl = document.getElementById('cart-items');
    const emptyCartEl = document.getElementById('empty-cart');
    
    if (cart.length === 0) {
        if (cartItemsEl) cartItemsEl.innerHTML = '';
        if (emptyCartEl) emptyCartEl.classList.remove('hidden');
        updateSummary();
        return;
    }

    if (emptyCartEl) emptyCartEl.classList.add('hidden');
    
    if (cartItemsEl) {
        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row gap-4 animate-fade-in">
                <div class="w-full sm:w-32 h-32 rounded-xl flex-shrink-0 overflow-hidden bg-gray-200">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">` : '<div class="w-full h-full bg-gradient-to-br from-green-200 via-emerald-200 to-amber-200"></div>'}
                </div>
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${item.name}</h3>
                    <p class="text-gray-600 text-sm mb-4">${item.size || 'Standard size'}</p>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <button onclick="updateQuantity('${item.key}', -1)" class="quantity-btn decrease w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">-</button>
                            <span class="quantity w-12 text-center font-semibold">${item.quantity}</span>
                            <button onclick="updateQuantity('${item.key}', 1)" class="quantity-btn increase w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">+</button>
                        </div>
                        <div class="text-right">
                            <div class="text-xl font-bold text-gray-900">${formatCurrency(item.price * item.quantity)}</div>
                            <button onclick="removeItem('${item.key}')" class="remove-item text-sm text-red-600 hover:text-red-700 mt-1">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    updateSummary();
}

function updateQuantity(key, change) {
    const item = cart.find(i => i.key === key);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeItem(key);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            loadCart();
            updateCartCount();
        }
    }
}

function removeItem(key) {
    cart = cart.filter(item => item.key !== key);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartCount();
}

function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = cart.length ? 120 : 0;
    const total = subtotal + delivery;

    const subtotalEl = document.getElementById('subtotal');
    const deliveryEl = document.getElementById('delivery');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (deliveryEl) deliveryEl.textContent = formatCurrency(delivery);
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

