const CONFIG = { API_URL: 'https://localhost:7129/api' };

async function fetchProductDetail() {
    // 1. Obtener el ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'archived.html';
        return;
    }

    try {
        // 2. Llamar a la API por ID (asegúrate de tener este endpoint en C#)
        const response = await fetch(`${CONFIG.API_URL}/products/${productId}`);
        const p = await response.json();

        // 3. Aplicar estilos dinámicos (Personalidad del mueble)
        document.body.style.backgroundColor = p.primaryColor || '#0f172a';
        
        const container = document.getElementById('detail-container');
        container.innerHTML = `
            <div class="rounded-3xl overflow-hidden shadow-2xl">
                <img src="${p.mainImageUrl}" class="w-full h-auto object-cover" alt="${p.name}">
            </div>
            <div class="space-y-6">
                <h1 class="text-6xl font-black uppercase tracking-tighter">${p.name}</h1>
                <p class="text-xl text-gray-300 leading-relaxed">${p.description}</p>
                <div class="text-5xl font-bold" style="color: ${p.accentColor}">
                    ${p.price}€
                </div>
                <button class="w-full py-4 rounded-xl font-bold text-xl transition-transform hover:scale-105"
                        style="background-color: ${p.accentColor}; color: white;">
                    AÑADIR AL CARRITO
                </button>
            </div>
        `;
    } catch (error) {
        console.error("Error:", error);
    }
}

fetchProductDetail();