// js/checkout.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargamos el resumen del carrito nada más entrar
    loadCheckoutSummary();

    // 2. Si el usuario está logueado, rellenamos los datos desde localStorage
    if (localStorage.getItem('token')) {
        fillCheckoutFromStorage();
    }
});

// Función para cargar los productos en el resumen lateral
function loadCheckoutSummary() {
    const cart = getCart(); // Viene de cart-helper.js
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

// Rellenado instantáneo desde localStorage
async function fillCheckoutFromStorage() {
    // 1. Rellenamos lo que ya tenemos en localStorage
    document.getElementById('checkout-email').value = localStorage.getItem('userEmail') || '';
    document.getElementById('checkout-fullname').value = localStorage.getItem('fullName') || '';

    // 2. Si hay token, pedimos los datos de envío al servidor
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('https://localhost:7073/api/Profile/address', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                const data = await response.json();

                // Mapeamos los datos recibidos a los campos del formulario
                if (document.getElementById('checkout-dni'))
                    document.getElementById('checkout-dni').value = data.dni || '';

                // AÑADE ESTA LÍNEA PARA EL TELÉFONO
                if (document.getElementById('checkout-phone'))
                    document.getElementById('checkout-phone').value = data.phoneNumber || '';

                if (document.getElementById('checkout-address'))
                    document.getElementById('checkout-address').value = data.address || '';

                if (document.getElementById('checkout-city'))
                    document.getElementById('checkout-city').value = data.city || '';

                if (document.getElementById('checkout-cp'))
                    document.getElementById('checkout-cp').value = data.postalCode || '';
            }
        } catch (err) {
            console.error("Error al cargar datos del perfil:", err);
        }
    }
}

// 1. Inicializamos Stripe con mi CLAVE PÚBLICA (pk_test_...) ----------------------------------------
// ¡NO usamos la sk_test que es secreta!
const stripe = Stripe('pk_test_51Tg3ovF7RW5rIoU8M2B10jyyK0CxRQwQwJYy5hei1vpXPETTszRtkXqQxCRoU7LLjJixCEVVqJhb3D28NeHJHJOj00OLz1uX87');
let elements; 

async function processCheckout() {
    const cart = getCart();
    const email = document.getElementById('checkout-email').value;
    const btn = document.getElementById('main-checkout-btn');

    if (!email) {
        alert("Por favor, introduce un correo electrónico.");
        return;
    }

    // Cambiar estado del botón para que el usuario sepa que está cargando ------------------------------------
    btn.innerText = "PROCESANDO PEDIDO...";
    btn.ariaDisabled = true;
    btn.calssList.add('opacity-50', 'cursor-wait');

    const orderRequest = {
        userId: localStorage.getItem('userId') || null,
        customerEmail: email,
        items: cart.map(item => ({
            productId: item.id,
            quantity: parseInt(item.quantity)
        })),
        // Estructura actualizada con el campo phoneNumber del nuevo input
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
        // PASO 1: CREAR EL PEDIDO
        const orderResponse = await fetch('https://localhost:7073/api/Orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') && { 'Authorization': 'Bearer ' + localStorage.getItem('token') })
            },
            body: JSON.stringify(orderRequest)
        });

        if (!orderResponse.ok) throw new Error("Error al crear el pedido en el servidor.");

        const orderId = await orderResponse.json();
        
        // PASO 2: SOLICITAR LA INTENCIÓN DE PAGO A TU NUEVO ENDPOINT
        const intentResponse = await(fetch`https://localhost:7073/api/orders//${orderId}/payment-intent`, {
            method:'POST',
            headers: {
                'Content-Type': 'application/json',
                ...arguments(localStorage.getItem('token') && { 'Authorization': 'Bearer ' + localStorage.getItem('token') })
            }
        });

        if(!intentResponse.ok) throw new Error("Error al conectar con la pasarela de pago.");

        const intentData = await intentResponse.json();
        // El controlador devuelve: return Ok(new { clientSecret = response });
        const clientSecret = intentData.clientSecret;

        // PASO 3: MOSTRAR EL FORMULARIO DE STRIPE
        renderStripeForm(clientSecret);

        localStorage.removeItem('polystore_cart');
        window.location.href = 'index.html';
    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
        btn.innerText = "PAGAR AHORA";
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-wait');
    }
}

function renderStripeForm(clientSecret){
    // Inicializar los Elementos de Stripe con el secreto
    elements = stripe.elements({ clientSecret, apperance: { theme: 'night '}}); // theme night para que encaje

    const paymentElement = elements.create('payment');

    // Mostrar el div oculto
    const paymentContainer = document.getElementById('stripe-payment-element');
    paymentContainer.classList.remove('hidden');

    // Montar el iframe dentro del div
    paymentElement.mount('#stripe-payment-element');

    // Cambiar la función del botón principal
    const btn = document.getElementById('main-checkout-btn');
    btn.innerText = "CONFIRMAR PAGO";
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-wait');

    // Ahora el botón ejecutará la confirmación de la tarjeta en lugar de crear la orden
    btn.onclick = async () => {
        btn.innerText = "VERIFICANDO TARJETA...";
        btn.disabled = true;

        // Le pedimos a Stripe que confirme el pago, pero que NO nos redirija automáticamente
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                
            },
            redirect: 'if_required' 
        });

        if (error) {
            // Si la tarjeta falla (fondos insuficientes, CVC mal...), mostramos el error
            alert(error.message);
            btn.innerText ="CONFIRMAR PAGO";
            btn.disabled = false;
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // ¡EL PAGO FUE UN ÉXITO! 
            // Aquí recuperamos la logica de removeitem:
            localStorage.removeItem('polystore_cart'); // <-- ¡Aquí está!
            alert("¡Pago completado con éxito! Recibirás un email de confirmación.");
            window.location.href = 'index.html'; // Y redirigimos manualmente
        }
    };
}