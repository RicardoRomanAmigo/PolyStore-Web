// js/archived-detail.js
const CONFIG = {
    API_URL: 'https://localhost:7073/api'
};

async function fetchCatalogProduct() {
    try {
        // 1. Pillamos el ID que viaja en la URL (?id=...)
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            window.location.href = 'archived.html'; // Si no hay ID, patada al catálogo general
            return;
        }

        // 2. Al ataque a la API (tu endpoint por ID)
        const response = await fetch(`${CONFIG.API_URL}/products/${productId}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        const product = await response.json();

        // 3. Inyectamos los textos e imagen principal
        document.getElementById('p-name').innerText = product.name;
        document.getElementById('p-description').innerText = product.description ?? 'Sin descripción disponible.';
        document.getElementById('p-price').innerText = `${product.price}€`;
        document.getElementById('p-image').src = product.mainImage || 'https://via.placeholder.com/600';

        // 4. Montamos la galería estilo Amazon
        setupCatalogGallery(product);

        // --- NUEVO: 4.5. ASIGNAR ACCIÓN AL BOTÓN DE COMPRA ---
        const buyButton = document.getElementById('button');
        if (buyButton) {
            buyButton.onclick = function() {
                addToCart(product); // Llama al cerebro de js/cart-helper.js
            };
        }

        // 5. Mostramos la tarjeta y escondemos el loader
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('product-card').classList.remove('hidden');

    } catch (error) {
        document.getElementById('loader').innerText = "Error al cargar el producto del catálogo.";
        console.error("Detalle:", error);
    }
}

function setupCatalogGallery(product) {
    const rail = document.getElementById('p-gallery-rail');
    if (!rail) return;

    // La primera miniatura siempre es la imagen principal del producto
    let html = `
        <button onclick="document.getElementById('p-image').src='${product.mainImage}'" class="w-full aspect-square rounded-xl overflow-hidden border-2 border-transparent bg-white/5 opacity-70 hover:opacity-100 hover:border-blue-500 transition-all duration-200">
            <img src="${product.mainImage}" class="w-full h-full object-cover">
        </button>
    `;

    // Si tiene más fotos en el array de la galería, las mapeamos detrás
    if (product.gallery && Array.isArray(product.gallery)) {
        product.gallery.forEach(imgUrl => {
            html += `
                <button onclick="document.getElementById('p-image').src='${imgUrl}'" class="w-full aspect-square rounded-xl overflow-hidden border-2 border-transparent bg-white/5 opacity-70 hover:opacity-100 hover:border-blue-500 transition-all duration-200">
                    <img src="${imgUrl}" class="w-full h-full object-cover">
                </button>
            `;
        });
    }

    rail.innerHTML = html;
}

// Arrancamos la carga
fetchCatalogProduct();