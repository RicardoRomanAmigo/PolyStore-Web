// js/cart-view.js

// Función para pintar el carrito en la pantalla
function renderCartView() {
    const cart = getCart(); // Viene de cart-helper.js
    const container = document.getElementById('cart-items-container');
    
    if (!container) return;
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="glass p-12 rounded-3xl text-center space-y-4">
                <i class="fa-solid fa-cart-shopping text-4xl text-slate-600"></i>
                <p class="text-slate-400 font-medium">Tu carrito está completamente vacío.</p>
                <a href="archived.html" class="inline-block bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition">
                    Explorar Catálogo
                </a>
            </div>
        `;
        document.getElementById('cart-subtotal').innerText = '0.00€';
        document.getElementById('cart-total').innerText = '0.00€';
        document.getElementById('checkout-btn').disabled = true;
        document.getElementById('checkout-btn').classList.add('opacity-40', 'cursor-not-allowed');
        return;
    }

    // Si hay artículos, habilitamos el botón de pagar por si acaso estaba deshabilitado
    document.getElementById('checkout-btn').disabled = false;
    document.getElementById('checkout-btn').classList.remove('opacity-40', 'cursor-not-allowed');

    let totalAcumulado = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAcumulado += itemTotal;

        const rowHTML = `
            <div class="glass p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-4 w-full sm:w-auto">
                    <img src="${item.image || 'https://via.placeholder.com/100'}" class="w-16 h-16 object-cover rounded-xl border border-white/10" alt="${item.name}">
                    <div>
                        <h3 class="font-bold text-base leading-tight">${item.name}</h3>
                        <p class="text-xs text-slate-500 font-mono mt-1">Precio un.: ${item.price}€</p>
                    </div>
                </div>

                <div class="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
                    <div class="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <button onclick="changeQuantity('${item.id}', -1)" class="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                            <i class="fa-solid fa-minus text-xs"></i>
                        </button>
                        <span class="px-3 font-mono font-bold text-sm text-center min-w-[35px]">${item.quantity}</span>
                        <button onclick="changeQuantity('${item.id}', 1)" class="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                            <i class="fa-solid fa-plus text-xs"></i>
                        </button>
                    </div>

                    <div class="text-right">
                        <span class="font-mono font-bold text-lg text-white">${itemTotal.toFixed(2)}€</span>
                    </div>

                    <button onclick="removeItem('${item.id}')" class="text-slate-500 hover:text-red-400 transition-colors pl-2">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });

    // Actualizamos el bloque de resumen
    document.getElementById('cart-subtotal').innerText = `${totalAcumulado.toFixed(2)}€`;
    document.getElementById('cart-total').innerText = `${totalAcumulado.toFixed(2)}€`;
}

// Cambiar la cantidad de un producto (+1 o -1)
function changeQuantity(productId, delta) {
    let cart = getCart();
    const item = cart.find(p => p.id === productId);

    if (item) {
        item.quantity += delta;
        
        // Si la cantidad baja de 1, eliminamos el ítem por completo
        if (item.quantity <= 0) {
            cart = cart.filter(p => p.id !== productId);
        }
        
        saveCart(cart); // Guarda en localStorage y actualiza contador global
        renderCartView(); // Refresca la vista del carrito
    }
}

// Eliminar un producto completo del tirón con el icono de papelera
function removeItem(productId) {
    let cart = getCart();
    cart = cart.filter(p => p.id !== productId);
    saveCart(cart);
    renderCartView();
}

// Escuchar el botón de finalizar compra (Checkout provisional) <-------------
document.getElementById('checkout-btn').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    
    // Si no hay token, redirigimos al login o abrimos el modal
    if (!token) {
        alert("Debes iniciar sesión para realizar tu compra.");
        openLoginModal(); // Suponiendo que tienes esta función global
        return;
    }

    const cart = getCart();
    
    // Ya no necesitamos customerEmail manualmente, tu API lo obtendrá por el Token
    const orderRequest = {
        userId: localStorage.getItem('userId'),
        items: cart.map(item => ({
            productId: item.id,
            quantity: parseInt(item.quantity)
        }))
    };

    try {
        // 2. Llamada a tu API para crear el pedido
        const response = await fetch('https://localhost:7073/api/Orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Si tienes token, lo enviamos para identificar al usuario
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(orderRequest)
        });

        if (!response.ok) throw new Error("Error al crear el pedido");

        // 3. Recibimos el orderId generado por Postgres
        const orderId = await response.json(); 
        
        console.log("Pedido creado con ID:", orderId);

        // 4. AQUÍ ES DONDE PASAREMOS AL PAGO (Próximo paso)
        // Por ahora, redirigimos a una página de éxito o avisamos
        alert("Pedido creado correctamente. Preparando pasarela de pago...");
        
        // window.location.href = `payment.html?orderId=${orderId}`;

    } catch (err) {
        console.error(err);
        alert("Hubo un error al procesar tu pedido. Inténtalo de nuevo.");
    }
});

// Arrancar la renderización inicial al abrir la página
document.addEventListener('DOMContentLoaded', renderCartView);