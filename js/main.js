// js/main.js
const CONFIG = {
    API_URL: 'https://localhost:7129/api'
};

async function fetchLiveProduct() {
    try {
        // CAMBIO AQUÍ: Añadimos /Live al final de la URL
        const response = await fetch(`${CONFIG.API_URL}/products/Live`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        // Como GetLiveProduct devuelve un SOLO objeto, no una lista
        const liveProduct = await response.json();

        // --- 1. Cambiamos los Textos e Imágenes ---
        // Ya no hace falta el .find(), porque la API ya nos filtró el producto
        document.getElementById('p-name').innerText = liveProduct.name;
        document.getElementById('p-description').innerText = liveProduct.description;
        document.getElementById('p-price').innerText = `${liveProduct.price}€`;
        document.getElementById('p-image').src = liveProduct.mainImageUrl || 'https://via.placeholder.com/400';

        // --- 2. Aplicamos el Estilo Dinámico (La Magia) ---
        // 1. Color de Fondo (Primary)
        if (liveProduct.primaryColor) {
            document.body.style.backgroundColor = liveProduct.primaryColor;
        }

        // 2. Colores de Acento (Precio y Botón)
        if (liveProduct.accentColor) {
            // A. El Precio: Cambiamos solo el color del texto
            const priceElement = document.getElementById('p-price');
            if (priceElement) priceElement.style.color = liveProduct.accentColor;

            // B. El Botón: Cambiamos el fondo
            const buyButton = document.querySelector('button');
            if (buyButton) {
                buyButton.style.backgroundColor = liveProduct.accentColor;
                // Forzamos texto blanco para que contraste con el azul
                buyButton.style.color = '#ffffff';
            }
        }
        // 3. Tipografía (Font Family)
        if (liveProduct.fontFamily) {
            document.body.style.fontFamily = liveProduct.fontFamily;
        }

        // 4. Imagen de Fondo Decorativa (Opcional)
        if (liveProduct.backgroundImageUrl) {
            document.body.style.backgroundImage = `url('${liveProduct.backgroundImageUrl}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
        }

        // --- 3. Mostramos la tarjeta ---
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('product-card').classList.remove('hidden');

    } catch (error) {
        document.getElementById('loader').innerText = "No hay productos en directo.";
        console.error("Detalle:", error);
    }
}

fetchLiveProduct();