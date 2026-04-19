const CONFIG = {
    API_URL: 'https://localhost:7129/api' 
};

async function fetchArchivedProducts() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/products/archived`);
        
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const products = await response.json();
        const grid = document.getElementById('products-grid');

        // Limpiamos el loader
        grid.innerHTML = '';

        if (products.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-gray-500">Aún no hay tesoros en el archivo.</p>';
            return;
        }

        // Mapeamos los productos a HTML
        products.forEach(p => {
            const card = `
                <div class="product-grid-card rounded-xl overflow-hidden flex flex-col h-full">
                    <img src="${p.mainImageUrl || 'https://via.placeholder.com/400'}" 
                         class="w-full h-56 object-cover" 
                         alt="${p.name}">
                    
                    <div class="p-6 flex flex-col flex-grow">
                        <h3 class="text-xl font-bold mb-2 text-white">${p.name}</h3>
                        <p class="text-gray-400 text-sm flex-grow mb-4">${p.description}</p>
                        
                        <div class="flex justify-between items-center mt-auto">
                            <span class="text-2xl font-black" style="color: ${p.accentColor || '#3b82f6'}">
                                ${p.price}€
                            </span>
                            <span class="text-xs font-mono uppercase tracking-widest text-gray-500">
                                Ref: ${p.id.toString().slice(0, 8)}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', card);
        });

    } catch (error) {
        document.getElementById('loader').innerHTML = `<p class="text-red-400">Error al conectar con el servidor.</p>`;
        console.error("Error:", error);
    }
}

// Arrancamos la carga
fetchArchivedProducts();