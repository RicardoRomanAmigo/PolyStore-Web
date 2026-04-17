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

        // Ya no hace falta el .find(), porque la API ya nos filtró el producto
        document.getElementById('p-name').innerText = liveProduct.name;
        document.getElementById('p-description').innerText = liveProduct.description;
        document.getElementById('p-price').innerText = `${liveProduct.price}€`;
        document.getElementById('p-image').src = liveProduct.mainImageUrl || 'https://via.placeholder.com/400';
        
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('product-card').classList.remove('hidden');

    } catch (error) {
        document.getElementById('loader').innerText = "No hay productos en directo.";
        console.error("Detalle:", error);
    }
}

fetchLiveProduct();