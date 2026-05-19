// js/cart-helper.js

// Obtener el carrito actual del localStorage (si no existe, devuelve un array vacío)
function getCart() {
    const cart = localStorage.getItem('polystore_cart');
    return cart ? JSON.parse(cart) : [];
}

// Guardar el estado del carrito en el localStorage
function saveCart(cart) {
    localStorage.setItem('polystore_cart', JSON.stringify(cart));
    updateCartCount(); // Funcion opcional por si se quere poner un contador visual en el menu
}

// Añadir un producto al carrito
function addToCart(product){
    let cart = getCart();

    // Buscamos si el producto ya está en el carrito
    const existingProduct = cart.find(item => item.id === product.id);

    if (existingProduct) {
        // Si ya existe, le sumamos uno a la cantidad
        existingProduct.quantity += 1;
    } else {
        // Si es nuevo, lo metemos en el array con cantidad 1
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.mainImage,
            quantity: 1
        });
    }

    saveCart(cart);
    alert(`¡${product.name} añadido al carrito!`);
}

// Actualizar un contador visual en la web (en icono de carrito con un número)
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    const countBadge = document.getElementById('cart-count');
    if (countBadge) {
        countBadge.innerText = totalItems;
        if (totalItems > 0) {
            countBadge.classList.remove('hidden');
        } else {
            countBadge.classList.add('hidden');
        }
    }
}

// Ejecutar al cargar el script para que el contador esté al día
document.addEventListener('DOMContentLoaded', updateCartCount);