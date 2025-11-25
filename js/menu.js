// Menu filter functionality with smooth animations
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        if (!item.dataset.originalDisplay) {
            item.dataset.originalDisplay = getComputedStyle(item).display || 'flex';
        }
    });
    
    // Handle size selection
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.closest('.menu-item');
            const allSizeBtns = parent.querySelectorAll('.size-btn');
            const addToCartBtn = parent.querySelector('.add-to-cart-btn');
            
            // Update active state
            allSizeBtns.forEach(b => {
                b.classList.remove('active', 'bg-green-600', 'text-white', 'border-green-600');
                b.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-200');
            });
            this.classList.add('active', 'bg-green-600', 'text-white', 'border-green-600');
            this.classList.remove('bg-gray-100', 'text-gray-700', 'border-gray-200');
            
            // Update price and size on add to cart button
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
            // Animate button state change
            filterButtons.forEach(b => {
                b.classList.remove('active', 'bg-green-600', 'text-white', 'scale-105');
                b.classList.add('bg-gray-100', 'text-gray-700');
            });
            
            // Animate active button
            btn.classList.add('active', 'bg-green-600', 'text-white', 'scale-105');
            btn.classList.remove('bg-gray-100', 'text-gray-700');
            
            // Get filter
            const filter = btn.getAttribute('data-filter');
            
            // Collect matching items first
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
            
            // First, fade out non-matching items smoothly
            nonMatchingItems.forEach(item => {
                item.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.9)';
            });
            
            // Then fade in matching items with stagger
            setTimeout(() => {
                // Hide non-matching items
                nonMatchingItems.forEach(item => {
                    item.style.display = 'none';
                });
                
                // Show and animate matching items
                matchingItems.forEach(({ item, index }) => {
                    item.style.display = item.dataset.originalDisplay || 'flex';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px) scale(0.95)';
                    
                    // Stagger the animations
                    setTimeout(() => {
                        item.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0) scale(1)';
                    }, index * 80);
                });
            }, 400);
        });
    });
});
