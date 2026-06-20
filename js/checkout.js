// js/checkout.js

// 1. Inicializamos Stripe con la CLAVE PÚBLICA (pk_test_...)
const stripe = Stripe('pk_test_TU_CLAVE_PUBLICA_AQUI'); 
let elements;

document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutSummary();
    
    // Activar validaciones visuales
    setupRealTimeValidationCheckout();
    
    // Activar el autocompletado profesional de direcciones
    setupAddressAutocomplete('checkout-address', 'checkout-city', 'checkout-cp');

    // Cargar datos de localStorage/BD si está logueado
    if (localStorage.getItem('token')) {
        fillCheckoutFromStorage();
    }
});

// --- LOGICA DE AUTOCOMPLETADO DESPLEGABLE ---
function setupAddressAutocomplete(addressId, cityId, cpId) {
    const addressInput = document.getElementById(addressId);
    const cityInput = document.getElementById(cityId);
    const cpInput = document.getElementById(cpId);

    if (!addressInput || !cityInput || !cpInput) return;

    // Crear el contenedor del menú desplegable
    const dropdown = document.createElement('ul');
    dropdown.className = 'absolute z-50 w-full bg-[#0f172a] border border-white/10 rounded-xl mt-1 max-h-60 overflow-y-auto hidden shadow-2xl font-mono text-sm';
    addressInput.parentNode.insertBefore(dropdown, addressInput.nextSibling);

    let debounceTimer;

    addressInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const val = addressInput.value.trim();

        if (val.length < 4) {
            dropdown.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                dropdown.innerHTML = '<li class="px-4 py-3 text-slate-500 animate-pulse">Buscando...</li>';
                dropdown.classList.remove('hidden');

                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=es&limit=5&q=${encodeURIComponent(val)}`, {
                    headers: { 'Accept-Language': 'es' }
                });
                const data = await res.json();

                dropdown.innerHTML = ''; 

                if (data && data.length > 0) {
                    data.forEach(item => {
                        const li = document.createElement('li');
                        li.className = 'px-4 py-3 hover:bg-blue-600 hover:text-white cursor-pointer border-b border-white/5 last:border-0 transition-colors text-slate-300';
                        
                        const details = item.address;
                        
                        const street = details.road || details.pedestrian || details.street || item.name || '';
                        const houseNumber = details.house_number || '';
                        const city = details.province || details.state || details.city || details.town || details.village || '';
                        const cp = details.postcode || '';

                        const streetDisplay = houseNumber ? `${street}, ${houseNumber}` : street;
                        
                        let shortName = streetDisplay;
                        if (city) shortName += ` - ${city}`;
                        if (cp) shortName += ` (${cp})`;
                        if (!shortName.trim()) shortName = item.display_name.split(',')[0];

                        li.innerText = shortName;

                        li.addEventListener('click', () => {
                            addressInput.value = streetDisplay;
                            cityInput.value = city;
                            cpInput.value = cp;

                            cityInput.classList.add('border-emerald-500');
                            cpInput.classList.add('border-emerald-500');
                            setTimeout(() => {
                                cityInput.classList.remove('border-emerald-500');
                                cpInput.classList.remove('border-emerald-500');
                            }, 1500);

                            dropdown.classList.add('hidden');
                        });
                        
                        dropdown.appendChild(li);
                    });
                } else {
                    dropdown.innerHTML = '<li class="px-4 py-3 text-slate-500">No se encontraron resultados</li>';
                }
            } catch (e) {
                dropdown.innerHTML = '<li class="px-4 py-3 text-red-400">Error de conexión</li>';
            }
        }, 600); 
    });

    document.addEventListener('click', (e) => {
        if (e.target !== addressInput && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// --- VALIDACIÓN VISUAL ---
function setupRealTimeValidationCheckout() {
    const emailInput = document.getElementById('checkout-email');
    const phoneInput = document.getElementById('checkout-phone');
    const dniInput = document.getElementById('checkout-dni');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s]{9,15}$/;
    const dniRegex = /^[XYZ]?\d{5,8}[A-Z]$/i;

    function validate(input, regex, errorId) {
        if(!input) return;
        const errorEl = document.getElementById(errorId);
        input.addEventListener('input', () => {
            if (input.value.length > 0 && !regex.test(input.value.replace(/\s/g, ''))) {
                errorEl.classList.remove('hidden');
                input.classList.add('border-red-500');
            } else {
                errorEl.classList.add('hidden');
                input.classList.remove('border-red-500');
            }
        });
    }

    validate(emailInput, emailRegex, 'checkout-email-error');
    validate(phoneInput, phoneRegex, 'checkout-phone-error');
    validate(dniInput, dniRegex, 'checkout-dni-error');
}

// --- RELLENADO DE DATOS Y CARRITO ---
function loadCheckoutSummary() {
    const cart = getCart(); 
    const container = document.getElementById('checkout-summary');
    let total = 0;

    if (!container) return;

    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="flex justify-between text-sm">
                <span>${item.quantity}x ${item.name}</span>
                <span class="font-mono">${(item.price * item.quantity).toFixed(2)}€</span>
            </div>
        `;
    }).join('');

    document.getElementById('checkout-total').innerText = `${total.toFixed(2)}€`;
}

async function fillCheckoutFromStorage() {
    document.getElementById('checkout-email').value = localStorage.getItem('userEmail') || '';
    document.getElementById('checkout-fullname').value = localStorage.getItem('fullName') || '';

    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('https://localhost:7073/api/Profile/address', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                const data = await response.json();
                if (document.getElementById('checkout-dni')) document.getElementById('checkout-dni').value = data.dni || '';
                if (document.getElementById('checkout-phone')) document.getElementById('checkout-phone').value = data.phoneNumber || '';
                if (document.getElementById('checkout-address')) document.getElementById('checkout-address').value = data.address || '';
                if (document.getElementById('checkout-city')) document.getElementById('checkout-city').value = data.city || '';
                if (document.getElementById('checkout-cp')) document.getElementById('checkout-cp').value = data.postalCode || '';
            }
        } catch (err) {
            console.error("Error al cargar datos del perfil:", err);
        }
    }
}

// --- FLUJO DE CREACIÓN Y PAGO ---
async function processCheckout() {
    const cart = getCart();
    const email = document.getElementById('checkout-email').value;
    const btn = document.getElementById('main-checkout-btn');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        alert("Por favor, introduce una dirección de correo electrónico válida.");
        return;
    }

    btn.innerText = "PROCESANDO PEDIDO...";
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-wait');

    const orderRequest = {
        userId: localStorage.getItem('userId') || null,
        customerEmail: email,
        items: cart.map(item => ({
            productId: item.id,
            quantity: parseInt(item.quantity)
        })),
        address: {
            fullName: document.getElementById('checkout-fullname').value,
            dni: document.getElementById('checkout-dni').value,
            phoneNumber: document.getElementById('checkout-phone').value,
            address: document.getElementById('checkout-address').value,
            city: document.getElementById('checkout-city').value,
            postalCode: document.getElementById('checkout-cp').value
        }
    };

    try {
        // 1. CREAR EL PEDIDO
        const orderResponse = await fetch('https://localhost:7073/api/Orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') && { 'Authorization': 'Bearer ' + localStorage.getItem('token') })
            },
            body: JSON.stringify(orderRequest)
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            throw new Error(errorText || "Error al procesar los datos del pedido.");
        }

        const orderId = await orderResponse.json();
        
        // 2. SOLICITAR INTENCIÓN DE PAGO
        const intentResponse = await fetch(`https://localhost:7073/api/orders/${orderId}/payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') && { 'Authorization': 'Bearer ' + localStorage.getItem('token') })
            }
        });

        if (!intentResponse.ok) throw new Error("Error al conectar con la pasarela de pago.");

        const intentData = await intentResponse.json();
        const clientSecret = intentData.clientSecret;

        // 3. MOSTRAR EL FORMULARIO DE STRIPE
        renderStripeForm(clientSecret);

    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
        btn.innerText = "PAGAR AHORA";
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-wait');
    }
}

function renderStripeForm(clientSecret) {
    elements = stripe.elements({ clientSecret, appearance: { theme: 'night' } }); 
    const paymentElement = elements.create('payment');
    
    const paymentContainer = document.getElementById('stripe-payment-element');
    paymentContainer.classList.remove('hidden');
    paymentElement.mount('#stripe-payment-element');

    const btn = document.getElementById('main-checkout-btn');
    btn.innerText = "CONFIRMAR PAGO";
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-wait');
    
    btn.onclick = async () => {
        btn.innerText = "VERIFICANDO TARJETA...";
        btn.disabled = true;

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {},
            redirect: 'if_required' 
        });

        if (error) {
            alert(error.message);
            btn.innerText = "CONFIRMAR PAGO";
            btn.disabled = false;
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            localStorage.removeItem('polystore_cart'); 
            alert("¡Pago completado con éxito! Recibirás un email de confirmación.");
            window.location.href = 'index.html'; 
        }
    };
}