import { fetchProducts } from './productsApi.js';

let menuProducts = [];

// Menu filter functionality with smooth animations
document.addEventListener('DOMContentLoaded', async () => {
    await loadMenuProducts();
    hydrateMenuInteractions();
});

async function loadMenuProducts() {
    try {
        const { data, error } = await fetchProducts();
        if (error) throw error;
        if (data.length) {
            menuProducts = data.map(mapSupabaseProductToMenuShape);
        } else {
            menuProducts = window.FOREST_PRODUCTS || [];
        }
    } catch (error) {
        console.error('Unable to fetch products from Supabase, falling back to static data.', error);
        menuProducts = window.FOREST_PRODUCTS || [];
    }
    renderMenuGrid(menuProducts);
}

function renderMenuGrid(products = []) {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid || !products.length) return;

    menuGrid.innerHTML = products.map((product, index) => createMenuCardMarkup(product, index)).join('');
    document.querySelectorAll('.menu-item').forEach(item => {
        if (!item.dataset.originalDisplay) {
            item.dataset.originalDisplay = getComputedStyle(item).display || 'flex';
        }
    });
}

function hydrateMenuInteractions() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        if (!item.dataset.originalDisplay) {
            item.dataset.originalDisplay = getComputedStyle(item).display || 'flex';
        }
    });

    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const parent = this.closest('.menu-item');
            const allSizeBtns = parent.querySelectorAll('.size-btn');
            const addToCartBtn = parent.querySelector('.add-to-cart-btn');
            const theme = parent.dataset.theme || 'green';

            allSizeBtns.forEach(b => resetSizeButton(b, theme));
            activateSizeButton(this, theme);

            if (addToCartBtn) {
                const newPrice = this.getAttribute('data-price');
                const newSize = this.getAttribute('data-size');
                addToCartBtn.setAttribute('data-price', newPrice);
                addToCartBtn.setAttribute('data-size', newSize);
            }
        });
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('active', 'bg-green-600', 'text-white', 'scale-105');
                b.classList.add('bg-gray-100', 'text-gray-700');
            });

            btn.classList.add('active', 'bg-green-600', 'text-white', 'scale-105');
            btn.classList.remove('bg-gray-100', 'text-gray-700');

            const filter = btn.getAttribute('data-filter');
            const matchingItems = [];
            const nonMatchingItems = [];

            menuItems.forEach((item, index) => {
                const matches = filter === 'all' || item.getAttribute('data-category') === filter;
                if (matches) {
                    matchingItems.push({ item, index });
                } else {
                    nonMatchingItems.push(item);
                }
            });

            nonMatchingItems.forEach(item => {
                item.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.9)';
            });

            setTimeout(() => {
                nonMatchingItems.forEach(item => {
                    item.style.display = 'none';
                });

                matchingItems.forEach(({ item, index }) => {
                    item.style.display = item.dataset.originalDisplay || 'flex';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px) scale(0.95)';

                    setTimeout(() => {
                        item.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0) scale(1)';
                    }, index * 80);
                });
            }, 400);
        });
    });
}

function createMenuCardMarkup(product) {
    const theme = product.ctaTheme || inferThemeFromCategory(product.category);
    const defaultSize = product.sizes.find(size => size.key === product.defaultSize) || product.sizes[0];
    const priceBadge = defaultSize ? formatCurrencySymbol(defaultSize.price) : formatCurrencySymbol(product.price || 0);
    const sizeButtonsMarkup = product.sizes.map(size => createSizeButton(size, defaultSize, theme)).join('');
    const buttonClasses = theme === 'amber'
        ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700';

    return `
        <div class="menu-item bg-gray-50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 group border border-gray-200 flex flex-col" data-category="${product.category}" data-theme="${theme}">
            <div class="h-56 relative overflow-hidden bg-gray-200">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent group-hover:from-black/50 transition-all"></div>
                <div class="absolute top-5 right-5 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 text-lg font-bold ${theme === 'amber' ? 'text-amber-700' : 'text-green-700'} shadow-lg">
                    ${priceBadge}
                </div>
                    <div class="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold ${theme === 'amber' ? 'text-amber-700' : 'text-green-700'}">
                    ${product.badge || product.category_label || product.category || ''}
                </div>
            </div>
            <div class="p-6 card-body flex flex-col h-full">
                <h3 class="text-xl font-bold text-gray-900 mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-4 leading-relaxed">${product.description}</p>
                <div class="card-actions space-y-4 mt-auto">
                    ${product.sizes.length > 1 ? `
                        <div class="space-y-2">
                            <label class="block text-xs font-semibold text-gray-700">Size</label>
                            <div class="flex flex-wrap gap-2">
                                ${sizeButtonsMarkup}
                            </div>
                        </div>
                    ` : `
                        <div class="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                            <span class="text-sm font-semibold text-gray-600">Price</span>
                            <span class="text-lg font-bold text-gray-900">${formatCurrencySymbol(product.price)}</span>
                        </div>
                    `}
                    <button class="add-to-cart-btn w-full ${buttonClasses} text-white py-2.5 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 text-sm shadow-lg" data-id="${product.id}" data-name="${product.name}" data-price="${defaultSize?.price || product.price}" data-size="${defaultSize?.label || 'Standard'}" data-image="${product.image}">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
}

function inferThemeFromCategory(category = '') {
    const lower = category.toLowerCase();
    return lower.includes('bread') || lower.includes('pastr') ? 'amber' : 'green';
}

function mapSupabaseProductToMenuShape(product) {
    const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : [
        { key: 'standard', label: 'Standard', price: Number(product.price) || 0 }
    ];
    const defaultSize = product.default_size || sizes[0]?.key || 'standard';
    return {
        id: product.slug || product.id,
        name: product.name,
        category: product.category || '',
        category_label: product.category_label || product.category || '',
        badge: product.badge || '',
        description: product.description || '',
        image: product.image_url || getProductImagePlaceholder(),
        availability: product.availability || 'In stock',
        ctaTheme: product.cta_theme || inferThemeFromCategory(product.category || ''),
        defaultSize,
        sizes,
        price: Number(product.price) || sizes[0]?.price || 0
    };
}

function createSizeButton(size, defaultSize, theme) {
    const isActive = size.key === defaultSize.key;
    const activeClasses = theme === 'amber'
        ? 'bg-amber-600 text-white border-amber-600'
        : 'bg-green-600 text-white border-green-600';
    const inactiveHoverClasses = theme === 'amber'
        ? 'hover:border-amber-500'
        : 'hover:border-green-500';

    return `
        <button class="size-btn flex-1 py-2 px-3 text-xs font-semibold rounded-lg border-2 transition-all ${isActive ? activeClasses : `bg-gray-100 text-gray-700 border-gray-200 ${inactiveHoverClasses}`}" data-size="${size.label}" data-price="${size.price}">
            ${size.label} ₱${size.price}
        </button>
    `;
}

function formatCurrencySymbol(value) {
    return `₱${Number(value).toLocaleString('en-PH')}`;
}

function resetSizeButton(button, theme) {
    button.classList.remove('active', 'bg-green-600', 'bg-amber-600', 'text-white', 'border-green-600', 'border-amber-600');
    button.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-200');
    if (theme === 'amber') {
        button.classList.add('hover:border-amber-500');
        button.classList.remove('hover:border-green-500');
    } else {
        button.classList.add('hover:border-green-500');
        button.classList.remove('hover:border-amber-500');
    }
}

function activateSizeButton(button, theme) {
    button.classList.remove('bg-gray-100', 'text-gray-700', 'border-gray-200', 'hover:border-amber-500', 'hover:border-green-500');
    button.classList.add('active', 'text-white');
    if (theme === 'amber') {
        button.classList.add('bg-amber-600', 'border-amber-600');
    } else {
        button.classList.add('bg-green-600', 'border-green-600');
    }
}

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
