// js/dashboard.js

// Lógica de Pestañas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-white/10', 'text-white');
        btn.classList.add('text-slate-400');
    });
    document.getElementById(`tab-${tabId}`).classList.add('active');
    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    activeBtn.classList.remove('text-slate-400');
    activeBtn.classList.add('bg-white/10', 'text-white');
}

// Cargar pedidos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('user-name-display').innerText = localStorage.getItem('userName') || 'Usuario';
    document.getElementById('user-avatar').innerText = (localStorage.getItem('userName') || 'US').substring(0, 2).toUpperCase();
    document.getElementById('profile-name').value = localStorage.getItem('userName');
    document.getElementById('profile-id').value = userId;

    loadOrders();
});

async function loadOrders() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('orders-table-body');

    try {
        const response = await fetch(`https://localhost:7073/api/Orders/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const orders = await response.json();

        // Cálculo total (usando totalAmount tras la corrección)
        const totalGastado = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        document.getElementById('stat-total-orders').innerText = orders.length;
        document.getElementById('stat-total-spent').innerText = `${totalGastado.toFixed(2)}€`;

        tbody.innerHTML = orders.map(o => `
            <tr class="hover:bg-white/5 transition border-t border-white/5">
                <td class="px-4 py-4 text-blue-400 font-bold">#${(o.orderId || '').substring(0, 8).toUpperCase()}</td>
                <td class="px-4 py-4 text-slate-400">${new Date(o.orderDate).toLocaleDateString()}</td>
                <td class="px-4 py-4 text-white font-bold">${parseFloat(o.totalAmount || 0).toFixed(2)}€</td>
                <td class="px-4 py-4">
                    <span class="px-2 py-1 text-[9px] rounded font-bold uppercase ${o.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">
                        ${o.status}
                    </span>
                </td>
                <td class="px-4 py-4 text-right">
                    <button onclick="showOrderDetail('${o.orderId}')" class="text-[10px] tracking-widest bg-white/5 border border-white/10 px-3 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all">VER</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-red-400">Error al cargar historial.</td></tr>';
    }
}

// Carga el detalle y enriquece la info de los productos al vuelo
async function showOrderDetail(orderId) {
    const tableContainer = document.getElementById('orders-table-container');
    const displayArea = document.getElementById('orders-display-area');
    tableContainer.style.display = 'none';

    try {
        const response = await fetch(`https://localhost:7073/api/Orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const order = await response.json();

        // Obtenemos los detalles de cada producto en paralelo
        const itemDetails = await Promise.all(order.items.map(async (item) => {
            try {
                const prodRes = await fetch(`https://localhost:7073/api/Products/${item.productId}`);
                const prodData = await prodRes.json();
                return { ...item, imageUrl: prodData.mainImage, status: prodData.status };
            } catch {
                return { ...item, imageUrl: null, status: 2 }; // Default a catalogo si falla
            }
        }));

        const detailDiv = document.createElement('div');
        detailDiv.id = 'order-detail-view';
        detailDiv.innerHTML = `
            <button onclick="closeDetail()" class="mb-6 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition">
                <i class="fa-solid fa-arrow-left mr-2"></i> Volver al historial
            </button>
            <div class="glass p-6 rounded-2xl border border-white/10">
                <h3 class="text-lg font-black mb-4">Pedido #${order.orderId.substring(0, 8).toUpperCase()}</h3>
                <div class="space-y-4">
                    ${itemDetails.map(item => {
                        const detailPage = (item.status === 1) ? 'product-detail.html' : 'archived-detail.html';
                        return `
                            <div class="flex items-center gap-4 border-b border-white/10 pb-4">
                                <a href="${detailPage}?id=${item.productId}" class="shrink-0">
                                    <img src="${item.imageUrl || 'assets/placeholder.png'}" class="w-16 h-16 object-cover rounded-lg bg-white/5" alt="Producto">
                                </a>
                                <div class="flex-1">
                                    <a href="${detailPage}?id=${item.productId}" class="text-white font-bold hover:text-blue-400 block transition">
                                        ${item.productName}
                                    </a>
                                    <p class="text-[10px] text-slate-400">Cant: ${item.quantity} | ${item.unitPrice.toFixed(2)}€</p>
                                </div>
                                <div class="text-sm font-bold text-white">${item.totalPrice.toFixed(2)}€</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="mt-6 pt-4 border-t border-white/10 text-right">
                    <p class="text-xl font-black text-white">Total: ${order.totalAmount.toFixed(2)}€</p>
                </div>
            </div>
        `;
        displayArea.appendChild(detailDiv);
    } catch (err) {
        console.error("Error al cargar detalle:", err);
    }
}

function closeDetail() {
    document.getElementById('orders-table-container').style.display = 'block';
    const detail = document.getElementById('order-detail-view');
    if (detail) detail.remove();
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}