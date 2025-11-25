// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Update cart count from localStorage (will use cart.js function if available)
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    } else {
        // Fallback if cart.js hasn't loaded yet
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCountEl.textContent = totalItems;
            cartCountEl.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    }
});




