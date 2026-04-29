// js/main.js
const CONFIG = {
    API_URL: 'https://localhost:5181/api'
};

async function fetchLiveProduct() {
    try {
        //  /live al final de la URL
        const response = await fetch(`${CONFIG.API_URL}/products/live`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        // Como GetLiveProduct devuelve un SOLO objeto, no una lista
        const liveProduct = await response.json();

        // --- 1. Camnbio los Textos e Imágenes ---
        // Ya no hace falta el .find(), porque la API ya nos filtró el producto
        document.getElementById('p-name').innerText = liveProduct.name;
        document.getElementById('p-description').innerText = liveProduct.description ?? '';
        document.getElementById('p-price').innerText = `${liveProduct.price}€`;
        document.getElementById('p-image').src = liveProduct.mainImage || 'https://via.placeholder.com/400';

        // --- 2. Aplicacion del estilo dinamico ---
        // 1. Color de fondo (Primary)
        if(liveProduct.primaryColor){
            document.body.style.backgroundColor = liveProduct.primaryColor;
        }

        // 2. Colores de Acento (Precio y boton)
        if(liveProduct.accentColor) {
            //A. El precio: Cambia dolo el color del texto
            const priceElement = document.getElementById('p-price');
            if (priceElement) priceElement.style.color = liveProduct.accentColor;

            //B. El boton: Cambia el fondo
            const buyBotton = document.getElementById('button');
            if(buyBotton){
                buyBotton.style.backgroundColor = liveProduct.accentColor;
                //Fuerza color blanco en el texto del boton
                buyBotton.style.color = '#ffffff'
            } 
        }

        // 3. Tipografia (Font Family)
        if(liveProduct.fontFamily) {
            document.body.style.fontFamily = liveProduct.fontFamily;
        }

        // 4. Imagen de Fondo Decorativa (Opcional)
        if(liveProduct.backgroundImageUrl){
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