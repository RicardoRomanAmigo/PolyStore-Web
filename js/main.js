// js/main.js
const CONFIG = {
    API_URL: 'https://localhost:7073/api'
};

// --- FUNCIÓN COMPARTIDA: Aplica la identidad visual del producto a la página ---
function applyDynamicStyles(product) {
    if (!product) return;

    // 1. Color de Fondo (Primary)
    if (product.primaryColor) {
        document.body.style.backgroundColor = product.primaryColor;
    }

    // 2. Colores de Acento (Precios, Logos y Botones)
    if (product.accentColor) {
        const priceElement = document.getElementById('p-price');
        if (priceElement) priceElement.style.color = product.accentColor;

        const buyButton = document.getElementById('button');
        if (buyButton) {
            buyButton.style.backgroundColor = product.accentColor;
            buyButton.style.color = '#ffffff';
        }
        
        // Acento del logo si existe en el HTML
        const logoAccent = document.getElementById('logo-accent');
        if (logoAccent) logoAccent.style.color = product.accentColor;
    }

    // 3. Tipografía (Font Family)
    if (product.fontFamily) {
        document.body.style.fontFamily = product.fontFamily;
    }

    // 4. Imagen de Fondo Decorativa
    if (product.backgroundImageUrl) {
        document.body.style.backgroundImage = `url('${product.backgroundImageUrl}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    }
}

// --- LOGICA DE CARGA ---
async function initPage() {
    try {
        // Determinamos si buscamos un ID en la URL (página detalles) o si es el Live directo (index)
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        let url = `${CONFIG.API_URL}/products/live`;
        if (productId) {
            url = `${CONFIG.API_URL}/products/${productId}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error API: ${response.status}`);
        const product = await response.json();

        // 1. Rellenar Textos Comunes en cualquier vista
        if(document.getElementById('p-name')) document.getElementById('p-name').innerText = product.name;
        if(document.getElementById('p-description')) document.getElementById('p-description').innerText = product.description ?? '';
        if(document.getElementById('p-price')) document.getElementById('p-price').innerText = `${product.price}€`;
        
        // 2. Ejecutar estilos dinámicos de tu base de datos
        applyDynamicStyles(product);

        // 3. Lógica específica si estamos en INDEX.HTML
        if (document.getElementById('p-image-link')) {
            document.getElementById('p-image').src = product.mainImage || 'https://via.placeholder.com/400';
            
            // Seteamos los links dinámicos apuntando a detalles con el ID de este producto
            document.getElementById('p-image-link').href = `product-detail.html?id=${product.id}`;
            document.getElementById('p-details-btn').href = `product-detail.html?id=${product.id}`;
        }

        // 4. Lógica específica si estamos en PRODUCT-DETAIL.HTML (Tu layout Amazon)
        if (document.getElementById('p-gallery-rail')) {
            document.getElementById('p-image').src = product.mainImage || 'https://via.placeholder.com/600';
            setupAmazonGallery(product);
        }

        // Mostrar contenido y quitar loader
        if(document.getElementById('loader')) document.getElementById('loader').classList.add('hidden');
        if(document.getElementById('product-card')) document.getElementById('product-card').classList.remove('hidden');

    } catch (error) {
        if(document.getElementById('loader')) document.getElementById('loader').innerText = "Error al conectar con el producto.";
        console.error(error);
    }
}

// --- FUNCIÓN PARA GENERAR LA GALERÍA ESTILO AMAZON ---
function setupAmazonGallery(product) {
    const rail = document.getElementById('p-gallery-rail');
    if (!rail) return;

    // Inicializamos el riel metiendo primero la foto principal
    let html = `
        <button onclick="document.getElementById('p-image').src='${product.mainImage}'" class="w-full aspect-square rounded-xl overflow-hidden border-2 border-transparent bg-white/5 opacity-70 hover:opacity-100 hover:border-[${product.accentColor || '#3b82f6'}] transition-all duration-200">
            <img src="${product.mainImage}" class="w-full h-full object-cover">
        </button>
    `;

    // Si tu producto trae un array de imágenes secundarias en gallery, las mapeamos
    if (product.gallery && Array.isArray(product.gallery)) {
        product.gallery.forEach(imgUrl => {
            html += `
                <button onclick="document.getElementById('p-image').src='${imgUrl}'" class="w-full aspect-square rounded-xl overflow-hidden border-2 border-transparent bg-white/5 opacity-70 hover:opacity-100 hover:border-[${product.accentColor || '#3b82f6'}] transition-all duration-200">
                    <img src="${imgUrl}" class="w-full h-full object-cover">
                </button>
            `;
        });
    }

    rail.innerHTML = html;
}

// Arrancar la maquinaria al cargar el script
initPage();