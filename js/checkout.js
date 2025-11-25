import { createOrderRecord } from './ordersApi.js';

// Checkout functionality
let selectedPayment = 'card';
const formatCurrency = (value) => value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });

document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutItems();
    
    const form = document.getElementById('checkout-form');
    const submitBtn = document.getElementById('complete-order-btn');
    if (form) {
        form.addEventListener('submit', (event) => handleCheckout(event, submitBtn));
    }
    
    // GPS Location functionality
    const getLocationBtn = document.getElementById('get-location-btn');
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', getCurrentLocation);
    }

    const paymentOptions = document.querySelectorAll('.payment-option');
    const cardFields = document.getElementById('card-fields');
    const gcashFields = document.getElementById('gcash-fields');
    const cardInputs = cardFields?.querySelectorAll('input') || [];
    const gcashInputs = gcashFields?.querySelectorAll('input') || [];

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
                setPaymentFieldRequirements(cardInputs, gcashInputs, true);
            } else {
                cardFields?.classList.add('hidden');
                gcashFields?.classList.remove('hidden');
                setPaymentFieldRequirements(cardInputs, gcashInputs, false);
            }
        });
    });
    setPaymentFieldRequirements(cardInputs, gcashInputs, selectedPayment === 'card');

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
    const cityInput = document.querySelector('input[name="city"]');
    const stateInput = document.querySelector('input[name="state"]');
    const zipInput = document.querySelector('input[name="zip"]');
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
                    fillInAddressParts({ address, cityInput, stateInput, zipInput });
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
                        address: fullAddress,
                        city: address.city || address.town || address.village || '',
                        state: address.state || address.region || '',
                        zip: address.postcode || ''
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

async function handleCheckout(e, submitBtn) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const locationData = localStorage.getItem('deliveryLocation');
    const location = locationData ? JSON.parse(locationData) : null;
    
    const customerEmail = (formData.get('email') || '').trim();
    const normalizedEmail = customerEmail.toLowerCase();
    const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 120;
    const gcashNumber = (formData.get('gcashNumber') || '').trim();
    const gcashAccountName = (formData.get('gcashAccountName') || '').trim();

    if (selectedPayment === 'gcash' && (!gcashNumber || !gcashAccountName)) {
        alert('Please provide your GCash number and account name.');
        return;
    }

    const order = {
        customer_name: `${formData.get('firstName')} ${formData.get('lastName')}`.trim(),
        customer_email: normalizedEmail,
        customer_phone: formData.get('phone'),
        delivery_address: `${formData.get('address')}, ${formData.get('city')}, ${formData.get('state')} ${formData.get('zip')}`,
        location,
        items: cart,
        total: orderTotal,
        payment_method: selectedPayment,
        gcash_number: selectedPayment === 'gcash' ? gcashNumber : null,
        gcash_account_name: selectedPayment === 'gcash' ? gcashAccountName : null,
        status: 'pending'
    };
    
    try {
        toggleCheckoutSubmitting(submitBtn, true);
        await createOrderRecord(order);
        if (normalizedEmail) {
            localStorage.setItem('lastCustomerEmail', normalizedEmail);
        }
        alert('Order placed successfully! You will receive a confirmation email shortly.');
        localStorage.removeItem('cart');
        localStorage.removeItem('deliveryLocation');
        window.location.href = 'orders.html';
    } catch (error) {
        console.error('Failed to save order', error);
        alert('We could not save your order online. Please try again in a moment.');
    } finally {
        toggleCheckoutSubmitting(submitBtn, false);
    }
}

function toggleCheckoutSubmitting(button, isSubmitting) {
    if (!button) return;
    if (isSubmitting) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Processing...';
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Complete Order';
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

function setPaymentFieldRequirements(cardInputs, gcashInputs, isCard) {
    cardInputs.forEach(input => {
        input.required = isCard;
    });
    gcashInputs.forEach(input => {
        input.required = !isCard;
    });
}

function fillInAddressParts({ address, cityInput, stateInput, zipInput }) {
    const derivedCity = address.city || address.town || address.village || address.county;
    if (cityInput && derivedCity) {
        cityInput.value = derivedCity;
    }
    if (stateInput && (address.state || address.region || address.province)) {
        stateInput.value = address.state || address.region || address.province;
    }
    if (zipInput && address.postcode) {
        zipInput.value = address.postcode;
    }
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

