// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
const formatCurrency = (value) => value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });

// Placeholder image function (shared with admin)
function getProductImagePlaceholder(index = 0) {
    const placeholders = [
        'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1570968914860-a693f2704e1c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80'
    ];
    return placeholders[index % placeholders.length];
}

// Add to cart
document.addEventListener('DOMContentLoaded', () => {
    attachCartButtonHandlers();
    
    // Load cart on cart page
    if (window.location.pathname.includes('cart.html')) {
        loadCart();
    }

    // Update cart count in nav
    updateCartCount();
});

function attachCartButtonHandlers() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        if (btn.dataset.cartWired === 'true') return;
        btn.dataset.cartWired = 'true';
        btn.addEventListener('click', handleAddToCartButtonClick);
    });
}

function handleAddToCartButtonClick(e) {
    const btn = e.currentTarget;
    const id = btn.getAttribute('data-id');
    const name = btn.getAttribute('data-name');
    const price = parseFloat(btn.getAttribute('data-price'));
    const size = btn.getAttribute('data-size') || null;
    const image = btn.getAttribute('data-image') || null;

    addToCart(id, name, Number.isNaN(price) ? 0 : price, size, image);
    
    // Visual feedback
    btn.textContent = 'Added!';
    btn.classList.add('bg-green-600');
    setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.classList.remove('bg-green-600');
    }, 1000);
}

function addToCart(id, name, price, size = null, image = null) {
    // Refresh cart from localStorage first
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const sizeSuffix = size ? ` (${size})` : '';
    const fullName = name + sizeSuffix;
    const itemKey = `${id}-${size || 'default'}`;
    
    const existingItem = cart.find(item => item.key === itemKey);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // If no image provided, use placeholder based on cart length
        const finalImage = image || getProductImagePlaceholder(cart.length);
        const numericPrice = Number(price) || 0;
        cart.push({ id, key: itemKey, name: fullName, price: numericPrice, quantity: 1, size, image: finalImage });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count immediately
    setTimeout(() => updateCartCount(), 0);
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
        cartItemsEl.innerHTML = cart.map((item, index) => {
            // Get placeholder image - always use it as fallback
            const placeholderImage = getProductImagePlaceholder(index);
            // Use item image if available, otherwise use placeholder
            const imageUrl = item.image && item.image.trim() !== '' ? item.image : placeholderImage;
            
            return `
            <div class="cart-item bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row gap-4 animate-fade-in">
                <div class="w-full sm:w-32 h-32 rounded-xl flex-shrink-0 overflow-hidden bg-gray-200">
                    <img src="${imageUrl}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='${placeholderImage}'; this.onerror=null;">
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
        `;
        }).join('');
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
    // Refresh cart from localStorage to ensure we have latest data
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Update all cart count elements across all pages
    const cartCountEls = document.querySelectorAll('#cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    cartCountEls.forEach(el => {
        if (el) {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    });
}

// Make function globally available
window.updateCartCount = updateCartCount;
window.addToCart = addToCart;
window.attachCartButtonHandlers = attachCartButtonHandlers;

