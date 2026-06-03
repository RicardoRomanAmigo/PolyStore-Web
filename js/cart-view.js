function renderCartView() {
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    
    if (!container) return;
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="glass p-12 rounded-3xl text-center space-y-4">
                <p class="text-slate-400 font-medium">Tu carrito está vacío.</p>
                <a href="archived.html" class="inline-block bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-white/10 transition">Explorar Catálogo</a>
            </div>
        `;
        document.getElementById('cart-subtotal').innerText = '0.00€';
        document.getElementById('cart-total').innerText = '0.00€';
        document.getElementById('checkout-btn').disabled = true;
        document.getElementById('checkout-btn').classList.add('opacity-40', 'cursor-not-allowed');
        return;
    }

    document.getElementById('checkout-btn').disabled = false;
    document.getElementById('checkout-btn').classList.remove('opacity-40', 'cursor-not-allowed');

    let totalAcumulado = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAcumulado += itemTotal;
        const rowHTML = `
            <div class="glass p-4 rounded-2xl flex items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <img src="${item.image}" class="w-16 h-16 object-cover rounded-xl border border-white/10">
                    <div>
                        <h3 class="font-bold text-base">${item.name}</h3>
                        <p class="text-xs text-slate-500 font-mono">Precio: ${item.price}€</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center bg-white/5 border border-white/10 rounded-xl">
                        <button onclick="changeQuantity('${item.id}', -1)" class="px-3 py-2 hover:bg-white/5"><i class="fa-solid fa-minus text-xs"></i></button>
                        <span class="px-3 font-mono font-bold text-sm">${item.quantity}</span>
                        <button onclick="changeQuantity('${item.id}', 1)" class="px-3 py-2 hover:bg-white/5"><i class="fa-solid fa-plus text-xs"></i></button>
                    </div>
                    <span class="font-mono font-bold text-lg">${itemTotal.toFixed(2)}€</span>
                    <button onclick="removeItem('${item.id}')" class="text-slate-500 hover:text-red-400"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });

    document.getElementById('cart-subtotal').innerText = `${totalAcumulado.toFixed(2)}€`;
    document.getElementById('cart-total').innerText = `${totalAcumulado.toFixed(2)}€`;
}

function changeQuantity(productId, delta) {
    let cart = getCart();
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(p => p.id !== productId);
        saveCart(cart);
        renderCartView();
    }
}

function removeItem(productId) {
    saveCart(getCart().filter(p => p.id !== productId));
    renderCartView();
}

// BOTÓN PROCESAR PAGO: Ahora redirige directamente al Checkout para todos
document.getElementById('checkout-btn').addEventListener('click', () => {
    window.location.href = 'checkout.html';
});

document.addEventListener('DOMContentLoaded', renderCartView);