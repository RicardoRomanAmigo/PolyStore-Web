const API_URL = 'https://localhost:7073/api/products';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificación de Seguridad
    const role = localStorage.getItem('role');
    if (role !== 'Admin') {
        window.location.href = 'index.html';
        return;
    }

    // 2. Cargar lista de productos
    loadProducts();

    // 3. Vincular el formulario
    const form = document.getElementById('product-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

async function handleFormSubmit(e) {
    e.preventDefault();
    console.log("Iniciando envío de formulario...");

    const id = document.getElementById('p-id').value;
    const token = localStorage.getItem('token');

    // Mapeo exacto para tu CreateLiveProductRequest de C#
    const productData = {
        name: document.getElementById('p-name').value,
        description: document.getElementById('p-description').value,
        price: parseFloat(document.getElementById('p-price').value),
        stock: parseInt(document.getElementById('p-stock').value) || 0,
        mainImage: document.getElementById('p-main-image').value,
        videoUrl: document.getElementById('p-video').value || null,
        renderUrl: document.getElementById('p-render').value || null,
        // Convertimos el texto de la galería en un Array de URLs
        gallery: document.getElementById('p-gallery').value
            .split(',')
            .map(url => url.trim())
            .filter(url => url !== ""),
        // Convertimos los tags en Array
        tags: document.getElementById('p-tags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t !== ""),
        primaryColor: document.getElementById('p-color-primary').value,
        accentColor: document.getElementById('p-color-accent').value,
        fontFamily: document.getElementById('p-font').value || 'sans-serif',
        backgroundImageUrl: document.getElementById('p-bg-url').value || '',
        customCss: null
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            alert("¡Sincronizado con éxito!");
            resetForm();
            loadProducts();
        } else {
            const error = await response.json();
            console.error("Error de la API:", error);
            alert("Error: " + (error.message || "Revisa los datos"));
        }
    } catch (err) {
        console.error("Error de conexión:", err);
        alert("No se pudo conectar con el servidor.");
    }
}

async function loadProducts() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;

    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        
        tbody.innerHTML = products.map(p => `
            <tr class="hover:bg-white/5 transition border-b border-white/5">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="${p.mainImage || 'https://via.placeholder.com/50'}" class="w-8 h-8 rounded-md object-cover border border-white/10">
                        <span class="font-bold text-xs">${p.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center font-mono text-xs ${p.stock === 0 ? 'text-red-500' : 'text-slate-400'}">
                    ${p.stock}
                </td>
                <td class="px-6 py-4 font-mono text-xs">${p.price}€</td>
                <td class="px-6 py-4">
                    <span class="text-[9px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-bold uppercase tracking-tighter">
                        ${p.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editProduct('${p.id}')" class="text-blue-400 hover:text-white mr-3 text-xs">Edit</button>
                    <button onclick="deleteProduct('${p.id}')" class="text-red-900 hover:text-red-400 text-xs">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-slate-600">Error cargando productos</td></tr>`;
    }
}

function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('p-id').value = '';
}

// Para editar, simplemente rellenamos el formulario con los datos actuales
async function editProduct(id) {
    const response = await fetch(`${API_URL}/${id}`);
    const p = await response.json();

    document.getElementById('p-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-description').value = p.description;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-stock').value = p.stock;
    document.getElementById('p-main-image').value = p.mainImage;
    document.getElementById('p-video').value = p.videoUrl;
    document.getElementById('p-render').value = p.renderUrl;
    document.getElementById('p-gallery').value = (p.gallery || []).join(', ');
    document.getElementById('p-tags').value = (p.tags || []).join(', ');
    document.getElementById('p-color-primary').value = p.primaryColor || '#020617';
    document.getElementById('p-color-accent').value = p.accentColor || '#3b82f6';
    document.getElementById('p-font').value = p.fontFamily;
    document.getElementById('p-bg-url').value = p.backgroundImageUrl;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Para eliminar un producto
async function deleteProduct(id) {
    if (!confirm("¿Seguro que deseas eliminar permanentemente este producto de PostgreSQL?")) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("¡Producto eliminado correctamente!");
            loadProducts(); // Refresca la tabla
            if (document.getElementById('p-id').value === id) {
                resetForm(); // Limpia el formulario si se estaba editando ese mismo ítem
            }
        } else {
            const error = await response.json();
            console.error("Error al eliminar:", error);
            alert("Error al eliminar: " + (error.message || "No se pudo completar la acción"));
        }
    } catch (err) {
        console.error("Error de conexión:", err);
        alert("Error de conexión con el servidor.");
    }
}
