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

async function processCheckout() {
    const cart = getCart();
    const email = document.getElementById('checkout-email').value;

    if (!email) {
        alert("Por favor, introduce un correo electrónico.");
        return;
    }

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
        const response = await fetch('https://localhost:7073/api/Orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') && { 'Authorization': 'Bearer ' + localStorage.getItem('token') })
            },
            body: JSON.stringify(orderRequest)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const orderId = await response.json();
        alert("¡Pedido realizado con éxito! ID: " + orderId);

        localStorage.removeItem('polystore_cart');
        window.location.href = 'index.html';
    } catch (err) {
        console.error(err);
        alert("Error al procesar: " + err.message);
    }
}