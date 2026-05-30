const AUTH_CONFIG = {
    API_URL: 'https://localhost:7073/api' // Asegúrate de que este puerto es el de tu API
};

function updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userName = localStorage.getItem('userName');

    if (token && userName) {
        authSection.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="text-xs font-mono text-slate-500">${userName.toUpperCase()}</span>
                ${role === 'Admin' ? 
                    `<a href="admin.html" class="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full font-bold hover:bg-blue-500 hover:text-white transition-all">ADMIN</a>` 
                    : ''}
                <button onclick="logout()" class="text-[10px] text-red-500/70 hover:text-red-400 font-bold uppercase tracking-widest">Salir</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <button onclick="openLoginModal()" class="text-xs bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-blue-500 hover:text-white transition-all">
                LOGIN
            </button>
        `;
    }
}

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();

    // 1. Capturamos los datos de los inputs
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        // 2. PETICIÓN REAL A LA API
        const response = await fetch(`${AUTH_CONFIG.API_URL}/account/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Credenciales inválidas");
        }

        const user = await response.json();
        
        // 3. Guardar sesión
        localStorage.setItem('token', user.token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userName', user.userName);
        localStorage.setItem('userId', user.userId);

        // 4. Limpiar interfaz
        closeLoginModal();
        updateAuthUI();

        // 5. Redirección si es Admin
        if (user.role === 'Admin') {
            window.location.href = 'admin.html';
        }

    } catch (err) {
        console.error("Error en login:", err);
        alert("Error: " + err.message);
    }
}

function logout() {
    localStorage.clear();
    window.location.reload();
}

// Vinculación de eventos
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    
    // IMPORTANTE: Buscamos el form cada vez que cargamos la página
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});