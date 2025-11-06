const API_URL = '/api';

function showAddUserModal() {
    document.getElementById('addUserModal').classList.remove('hidden');
}

function hideAddUserModal() {
    document.getElementById('addUserModal').classList.add('hidden');
    document.getElementById('addUserForm').reset();
    document.getElementById('addUserError').classList.add('hidden');
}

function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError(elementId) {
    document.getElementById(elementId).classList.add('hidden');
}

async function carregarUsuarios() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        const response = await fetch(`${API_URL}/admin/usuarios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                alert('Acesso negado. Apenas administradores podem acessar esta página.');
                window.location.href = '/dashboard';
                return;
            }
            throw new Error('Erro ao carregar usuários');
        }

        const usuarios = await response.json();
        const tableBody = document.getElementById('usuariosTable');
        
        if (usuarios.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400">Nenhum usuário encontrado</td></tr>';
            return;
        }

        tableBody.innerHTML = usuarios.map(usuario => `
            <tr class="border-b border-dark-hover hover:bg-dark-hover transition">
                <td class="p-4">${usuario.id}</td>
                <td class="p-4">${usuario.nome}</td>
                <td class="p-4">${usuario.email}</td>
                <td class="p-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                        usuario.tipo === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                    }">
                        ${usuario.tipo === 'admin' ? 'Administrador' : 'Consultor'}
                    </span>
                </td>
                <td class="p-4">
                    <div class="flex space-x-2">
                        <button onclick="alterarTipo(${usuario.id}, '${usuario.tipo === 'admin' ? 'consultor' : 'admin'}')" 
                            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">
                            ${usuario.tipo === 'admin' ? 'Tornar Consultor' : 'Tornar Admin'}
                        </button>
                        <button onclick="deletarUsuario(${usuario.id})" 
                            class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition">
                            Deletar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Erro:', error);
        const tableBody = document.getElementById('usuariosTable');
        tableBody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-red-400">Erro ao carregar usuários</td></tr>';
    }
}

async function alterarTipo(usuarioId, novoTipo) {
    if (!confirm(`Deseja realmente alterar o tipo deste usuário para ${novoTipo === 'admin' ? 'Administrador' : 'Consultor'}?`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/usuarios/${usuarioId}/tipo?tipo=${novoTipo}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao alterar tipo do usuário');
        }

        await carregarUsuarios();
        alert('Tipo de usuário alterado com sucesso!');

    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    }
}

async function deletarUsuario(usuarioId) {
    if (!confirm('Deseja realmente deletar este usuário? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/usuarios/${usuarioId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao deletar usuário');
        }

        await carregarUsuarios();
        alert('Usuário deletado com sucesso!');

    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    }
}

document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('addUserError');

    const nome = document.getElementById('novo_nome').value;
    const email = document.getElementById('novo_email').value;
    const senha = document.getElementById('novo_senha').value;
    const tipo = document.getElementById('novo_tipo').value;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nome, email, senha, tipo })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao criar usuário');
        }

        hideAddUserModal();
        await carregarUsuarios();
        alert('Usuário criado com sucesso!');

    } catch (error) {
        console.error('Erro:', error);
        showError('addUserError', error.message);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/';
}

window.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (usuario.nome) {
        document.getElementById('userInfo').textContent = `${usuario.nome} (${usuario.tipo})`;
    }
    carregarUsuarios();
});
