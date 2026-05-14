function updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return; // Seguridad por si la página no tiene el div

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userName = localStorage.getItem('userName');

    if (token && userName) {
        // ESTADO: LOGUEADO
        authSection.innerHTML = `
            <div class="flex items-center gap-4 animate-in fade-in duration-500">
                <span class="text-xs font-mono text-slate-500">${userName.toUpperCase()}</span>
                ${role === 'Admin' ? 
                    `<a href="admin.html" class="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full font-bold hover:bg-blue-500 hover:text-white transition-all">ADMIN</a>` 
                    : ''}
                <button onclick="logout()" class="text-[10px] text-red-500/70 hover:text-red-400 font-bold uppercase tracking-widest">Salir</button>
            </div>
        `;
    } else {
        // ESTADO: NO LOGUEADO (Volvemos a poner el botón original)
        authSection.innerHTML = `
            <button onclick="openLoginModal()" class="text-xs bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-white/5">
                LOGIN
            </button>
        `;
    }
}
function openLoginModal() {
    console.log("Abriendo modal..."); // Añade este log para depurar
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        console.error("No se encontró el elemento login-modal");
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}