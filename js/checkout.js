// Checkout functionality
let selectedPayment = 'card';
const formatCurrency = (value) => value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });

document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutItems();
    
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', handleCheckout);
    }
    
    // GPS Location functionality
    const getLocationBtn = document.getElementById('get-location-btn');
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', getCurrentLocation);
    }

    const paymentOptions = document.querySelectorAll('.payment-option');
    const cardFields = document.getElementById('card-fields');
    const gcashFields = document.getElementById('gcash-fields');

    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectedPayment = option.dataset.method;
            paymentOptions.forEach(btn => {
                btn.classList.remove('active', 'border-green-600', 'text-green-700', 'bg-green-50');
                btn.classList.add('border-gray-200', 'text-gray-600', 'bg-gray-50');
            });
            option.classList.add('active', 'border-green-600', 'text-green-700', 'bg-green-50');
            option.classList.remove('border-gray-200', 'text-gray-600', 'bg-gray-50');

            if (selectedPayment === 'card') {
                cardFields?.classList.remove('hidden');
                gcashFields?.classList.add('hidden');
            } else {
                cardFields?.classList.add('hidden');
                gcashFields?.classList.remove('hidden');
            }
        });
    });

    const closeLocationModal = document.getElementById('close-location-modal');
    const locationModal = document.getElementById('location-modal');
    const locationModalConfirm = document.getElementById('location-modal-confirm');

    [closeLocationModal, locationModalConfirm].forEach(btn => {
        btn?.addEventListener('click', () => {
            locationModal?.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        });
    });
});

function getCurrentLocation() {
    const btn = document.getElementById('get-location-btn');
    const addressInput = document.getElementById('address-input');
    const locationDisplay = document.getElementById('location-display');
    const locationText = document.getElementById('location-text');
    const locationInlineMap = document.getElementById('location-inline-map');
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }
    
    btn.textContent = '📍 Getting Location...';
    btn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Using free OpenStreetMap Nominatim API (no key required)
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                );
                const data = await response.json();
                
                if (data.address) {
                    const address = data.address;
                    const fullAddress = [
                        address.road || address.street,
                        address.house_number,
                        address.city || address.town || address.village,
                        address.state,
                        address.postcode,
                        address.country
                    ].filter(Boolean).join(', ');
                    
                    if (addressInput) {
                        addressInput.value = fullAddress;
                    }
                    if (locationDisplay && locationText) {
                        locationText.textContent = fullAddress;
                        locationDisplay.classList.remove('hidden');
                        if (locationInlineMap) {
                            locationInlineMap.src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=17&output=embed`;
                        }
                    }
                    
                    showLocationModal(latitude, longitude, fullAddress);

                    // Store coordinates for delivery
                    localStorage.setItem('deliveryLocation', JSON.stringify({
                        lat: latitude,
                        lng: longitude,
                        address: fullAddress
                    }));
                }
            } catch (error) {
                console.error('Error getting address:', error);
                alert('Could not get address from coordinates. Please enter manually.');
            }
            
            btn.textContent = '📍 Use My Location';
            btn.disabled = false;
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('Could not get your location. Please enable location services or enter address manually.');
            btn.textContent = '📍 Use My Location';
            btn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function loadCheckoutItems() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemsEl = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    const deliveryEl = document.getElementById('checkout-delivery');
    
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = cart.length ? 120 : 0;
    const total = subtotal + delivery;

    if (itemsEl) {
        itemsEl.innerHTML = cart.map(item => `
            <div class="flex justify-between text-sm">
                <span class="text-gray-600">${item.name} x ${item.quantity}</span>
                <span class="font-semibold">${formatCurrency(item.price * item.quantity)}</span>
            </div>
        `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (deliveryEl) deliveryEl.textContent = formatCurrency(delivery);
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

function handleCheckout(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Get location if available
    const locationData = localStorage.getItem('deliveryLocation');
    const location = locationData ? JSON.parse(locationData) : null;
    
    // Create order
    const order = {
        id: 'ORD-' + Date.now(),
        customer_name: formData.get('firstName') + ' ' + formData.get('lastName'),
        customer_email: formData.get('email'),
        customer_phone: formData.get('phone'),
        delivery_address: formData.get('address') + ', ' + formData.get('city') + ', ' + formData.get('state') + ' ' + formData.get('zip'),
        location: location,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 120, // + delivery
        payment_method: selectedPayment,
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    // Save order
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Here you would integrate with payment processor (Stripe, etc.)
    // For now, just show success message
    
    alert('Order placed successfully! You will receive a confirmation email shortly.');
    
    // Clear cart and location
    localStorage.removeItem('cart');
    localStorage.removeItem('deliveryLocation');
    
    // Redirect to orders page
    window.location.href = 'orders.html?order=' + order.id;
}

function showLocationModal(lat, lng, address) {
    const modal = document.getElementById('location-modal');
    const textEl = document.getElementById('location-modal-text');
    const mapFrame = document.getElementById('location-modal-map');

    if (!modal || !textEl || !mapFrame) return;

    textEl.textContent = address;
    mapFrame.src = `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

