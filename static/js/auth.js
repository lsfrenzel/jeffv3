function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
}

function setUsuario(usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
}

function getUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

function atualizarSidebar() {
    const usuario = getUsuario();
    if (!usuario) return;
    
    const userNameEl = document.getElementById('userName');
    const userInfoEl = document.getElementById('userInfo');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) {
        userNameEl.textContent = usuario.nome || 'Usuário';
    }
    
    if (userInfoEl) {
        const tipoFormatado = usuario.tipo === 'admin' ? 'Administrador' : 'Consultor';
        userInfoEl.textContent = tipoFormatado;
    }
    
    if (userAvatarEl) {
        if (usuario.foto_url) {
            userAvatarEl.innerHTML = `<img src="${usuario.foto_url}" alt="Foto" class="w-10 h-10 rounded-full object-cover">`;
        } else {
            const iniciais = (usuario.nome || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            userAvatarEl.innerHTML = `<span class="text-white text-sm font-semibold">${iniciais}</span>`;
        }
    }
    
    const adminLink = document.getElementById('adminLink');
    if (adminLink && usuario.tipo === 'admin') {
        adminLink.classList.remove('hidden');
    }
}

function logout() {
    removeToken();
    window.location.href = '/';
}

async function apiRequest(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        logout();
        return;
    }
    
    return response;
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '/';
    }
}

if (window.location.pathname !== '/' && !getToken()) {
    window.location.href = '/';
}
