document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    const email = urlParams.get('email'); 

    if (!orderId) { 
        window.location.href = 'index.html'; 
        return; 
    }

    try {
        let apiUrl = `https://localhost:7073/api/Orders/${orderId}`;
        const headers = { 'Content-Type': 'application/json' };
        const localToken = localStorage.getItem('token');

        if (!localToken && email) {
            apiUrl = `https://localhost:7073/api/Orders/guest/${orderId}?email=${encodeURIComponent(email)}`;
        } else if (localToken) {
            headers['Authorization'] = `Bearer ${localToken}`;
        } else {
            throw new Error("No hay credenciales ni email para consultar este pedido");
        }

        const response = await fetch(apiUrl, { headers });

        if (!response.ok) throw new Error("Acceso denegado o pedido no encontrado");
        const order = await response.json();

        document.getElementById('order-id').innerText = `PEDIDO #${order.id.substring(0, 8).toUpperCase()}`;
        document.getElementById('order-total').innerText = `${order.totalAmount.toFixed(2)}€`;
        
        document.getElementById('shipping-name').innerText = order.customerEmail;
        document.getElementById('shipping-date').innerText = `Fecha: ${new Date(order.orderDate).toLocaleString()}`;

        document.getElementById('order-status').innerHTML = `
            <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase ${order.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : (order.status === 'Cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400')}">
                ${order.status}
            </span>
        `;

        const itemsContainer = document.getElementById('order-items');
        itemsContainer.innerHTML = order.items.map(item => `
            <div class="flex justify-between items-center pt-3 text-sm">
                <div class="flex items-center gap-3">
                    <div>
                        <h4 class="font-bold text-xs uppercase">${item.productName || 'Producto ID: ' + item.productId}</h4>
                        <p class="text-[10px] text-slate-500 font-mono">CANTIDAD: ${item.quantity}</p>
                    </div>
                </div>
                <span class="font-mono text-xs font-bold text-slate-300">${(item.unitPrice * item.quantity).toFixed(2)}€</span>
            </div>
        `).join('');

        document.getElementById('loader').classList.add('hidden');
        document.getElementById('order-card').classList.remove('hidden');

    } catch (err) {
        document.getElementById('loader').innerText = err.message || "Enlace vencido o sin permisos.";
        document.getElementById('loader').classList.add('text-red-500');
    }
});