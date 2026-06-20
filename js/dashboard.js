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
    document.getElementById('profile-id').value = userId;

    loadOrders();
    loadProfile();
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

async function showOrderDetail(orderId) {
    const tableContainer = document.getElementById('orders-table-container');
    const displayArea = document.getElementById('orders-display-area');
    tableContainer.style.display = 'none';

    try {
        const response = await fetch(`https://localhost:7073/api/Orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const order = await response.json();

        const itemDetails = await Promise.all(order.items.map(async (item) => {
            try {
                const prodRes = await fetch(`https://localhost:7073/api/Products/${item.productId}`);
                const prodData = await prodRes.json();
                return { ...item, imageUrl: prodData.mainImage, status: prodData.status };
            } catch {
                return { ...item, imageUrl: null, status: 2 };
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

// === NUEVA LÓGICA DE PERFIL ===

async function loadProfile() {
    const token = localStorage.getItem('token');
    
    fillInputField('profile-fullname', localStorage.getItem('fullName'));
    fillInputField('profile-dni', localStorage.getItem('dni'));
    fillInputField('profile-phone', localStorage.getItem('phoneNumber'));
    fillInputField('profile-address', localStorage.getItem('address'));
    fillInputField('profile-city', localStorage.getItem('city'));
    fillInputField('profile-cp', localStorage.getItem('cp'));

    try {
        const response = await fetch('https://localhost:7073/api/Profile/address', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            fillInputField('profile-fullname', data.fullName);
            fillInputField('profile-dni', data.dni);
            fillInputField('profile-phone', data.phoneNumber);
            fillInputField('profile-address', data.address);
            fillInputField('profile-city', data.city);
            fillInputField('profile-cp', data.postalCode);
        }
    } catch (err) {
        console.warn("No se pudieron refrescar datos del perfil.");
    }

    // Activamos validación en vivo y autorellenado de dirección
    setupRealTimeValidation('profile-phone', 'profile-dni', 'profile-phone-error', 'profile-dni-error');
    setupAddressAutocomplete('profile-address', 'profile-city', 'profile-cp');
}

function fillInputField(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
}

// Nuevo Autocompletado Profesional con Menú Desplegable (Texto Limpio)
function setupAddressAutocomplete(addressId, cityId, cpId) {
    const addressInput = document.getElementById(addressId);
    const cityInput = document.getElementById(cityId);
    const cpInput = document.getElementById(cpId);

    if (!addressInput || !cityInput || !cpInput) return;

    // 1. Crear el contenedor del menú desplegable de sugerencias
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
                        
                        // --- AQUÍ ESTÁ LA MAGIA DEL TEXTO LIMPIO ---
                        const street = details.road || details.pedestrian || details.street || item.name || '';
                        const houseNumber = details.house_number || '';
                        const city = details.province || details.state || details.city || details.town || details.village || '';
                        const cp = details.postcode || '';

                        // Construimos la calle con el número si lo hay
                        const streetDisplay = houseNumber ? `${street}, ${houseNumber}` : street;
                        
                        // Construimos la frase final para el desplegable
                        let shortName = streetDisplay;
                        if (city) shortName += ` - ${city}`;
                        if (cp) shortName += ` (${cp})`;
                        
                        // Fallback por si Nominatim nos devuelve algo raro
                        if (!shortName.trim()) shortName = item.display_name.split(',')[0];

                        // Asignamos el nombre corto y bonito al desplegable
                        li.innerText = shortName;
                        // ------------------------------------------

                        // Lo que pasa al hacer CLIC en una sugerencia
                        li.addEventListener('click', () => {
                            // Rellenar los inputs limpios
                            addressInput.value = streetDisplay;
                            cityInput.value = city;
                            cpInput.value = cp;

                            // Efecto de éxito visual
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
                console.error("Error en autocompletado:", e);
                dropdown.innerHTML = '<li class="px-4 py-3 text-red-400">Error de conexión</li>';
            }
        }, 600); 
    });

    // Cerrar el menú si hacemos clic fuera
    document.addEventListener('click', (e) => {
        if (e.target !== addressInput && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// Lógica de bordes rojos en tiempo real
function setupRealTimeValidation(phoneId, dniId, phoneErrorId, dniErrorId) {
    const phoneInput = document.getElementById(phoneId);
    const dniInput = document.getElementById(dniId);
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
    validate(phoneInput, phoneRegex, phoneErrorId);
    validate(dniInput, dniRegex, dniErrorId);
}

// Guardado del Perfil
async function saveProfile() {
    const token = localStorage.getItem('token');
    const payload = {
        fullName: document.getElementById('profile-fullname').value,
        dni: document.getElementById('profile-dni').value,
        phoneNumber: document.getElementById('profile-phone').value,
        address: document.getElementById('profile-address').value,
        city: document.getElementById('profile-city').value,
        postalCode: document.getElementById('profile-cp').value
    };

    const btn = document.getElementById('save-profile-btn');
    btn.innerText = "GUARDANDO...";
    btn.disabled = true;

    try {
        const response = await fetch('https://localhost:7073/api/Profile/address', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            localStorage.setItem('fullName', payload.fullName);
            localStorage.setItem('dni', payload.dni);
            localStorage.setItem('phoneNumber', payload.phoneNumber);
            localStorage.setItem('address', payload.address);
            localStorage.setItem('city', payload.city);
            localStorage.setItem('cp', payload.postalCode);
            alert("Datos guardados correctamente");
        } else {
            const errorText = await response.text();
            throw new Error(errorText || "Error al guardar los datos.");
        }
    } catch(e) { 
        alert(e.message); 
    } finally { 
        btn.innerText = "GUARDAR CAMBIOS"; 
        btn.disabled = false; 
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