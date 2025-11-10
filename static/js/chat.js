checkAuth();

const usuario = getUsuario();
document.getElementById('userInfo').textContent = `${usuario.nome} (${usuario.tipo})`;

let conversaAtual = null;
let conversas = [];

async function carregarConversas() {
    try {
        const response = await apiRequest('/api/mensagens/conversas');
        conversas = await response.json();
        
        const container = document.getElementById('listaConversas');
        
        if (conversas.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-gray-400">Nenhuma conversa ainda</div>';
            return;
        }
        
        container.innerHTML = conversas.map(conv => `
            <div onclick="abrirConversa(${conv.usuario.id})" class="p-4 border-b border-gray-700 hover:bg-dark-hover cursor-pointer transition ${conversaAtual && conversaAtual.id === conv.usuario.id ? 'bg-dark-hover' : ''}">
                <div class="flex items-start">
                    <img src="${conv.usuario.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.usuario.nome)}&size=40&background=3b82f6&color=fff`}" 
                         alt="${conv.usuario.nome}" 
                         class="w-10 h-10 rounded-full mr-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h4 class="text-white font-medium truncate">${conv.usuario.nome}</h4>
                            ${conv.mensagens_nao_lidas > 0 ? `<span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">${conv.mensagens_nao_lidas}</span>` : ''}
                        </div>
                        <p class="text-gray-400 text-sm truncate">${conv.ultima_mensagem || 'Sem mensagens'}</p>
                        ${conv.data_ultima_mensagem ? `<p class="text-gray-500 text-xs mt-1">${new Date(conv.data_ultima_mensagem).toLocaleString('pt-BR')}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        document.getElementById('listaConversas').innerHTML = 
            '<div class="p-4 text-center text-red-400">Erro ao carregar conversas</div>';
    }
}

async function abrirConversa(usuarioId) {
    try {
        const response = await apiRequest(`/api/mensagens/conversa/${usuarioId}`);
        const mensagens = await response.json();
        
        const conversaUsuario = conversas.find(c => c.usuario.id === usuarioId);
        conversaAtual = conversaUsuario ? conversaUsuario.usuario : null;
        
        if (!conversaAtual) {
            const userResponse = await apiRequest(`/api/consultores/${usuarioId}`);
            const userData = await userResponse.json();
            conversaAtual = userData.perfil;
        }
        
        const fotoUrl = conversaAtual.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversaAtual.nome)}&size=40&background=3b82f6&color=fff`;
        document.getElementById('fotoDestinatario').src = fotoUrl;
        document.getElementById('nomeDestinatario').textContent = conversaAtual.nome;
        document.getElementById('emailDestinatario').textContent = conversaAtual.email;
        
        document.getElementById('cabecalhoChat').classList.remove('hidden');
        document.getElementById('formularioMensagem').classList.remove('hidden');
        
        exibirMensagens(mensagens);
        carregarConversas();
    } catch (error) {
        console.error('Erro ao abrir conversa:', error);
    }
}

function exibirMensagens(mensagens) {
    const container = document.getElementById('areaMensagens');
    
    if (mensagens.length === 0) {
        container.innerHTML = '<div class="h-full flex items-center justify-center text-gray-400">Nenhuma mensagem ainda. Envie a primeira!</div>';
        return;
    }
    
    container.innerHTML = mensagens.map(msg => {
        const ehMinhaMsg = msg.remetente_id === usuario.id;
        return `
            <div class="mb-4 flex ${ehMinhaMsg ? 'justify-end' : 'justify-start'}">
                <div class="${ehMinhaMsg ? 'bg-blue-600' : 'bg-dark-card'} max-w-md rounded-lg p-3">
                    <p class="text-white">${msg.conteudo}</p>
                    <p class="text-xs ${ehMinhaMsg ? 'text-blue-200' : 'text-gray-500'} mt-1">
                        ${new Date(msg.data_envio).toLocaleString('pt-BR')}
                        ${msg.lida ? ' • Lida' : ''}
                    </p>
                </div>
            </div>
        `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

async function enviarMensagem() {
    if (!conversaAtual) {
        alert('Selecione uma conversa primeiro');
        return;
    }
    
    const input = document.getElementById('inputMensagem');
    const conteudo = input.value.trim();
    
    if (!conteudo) {
        alert('Digite uma mensagem');
        return;
    }
    
    try {
        await apiRequest('/api/mensagens/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                destinatario_id: conversaAtual.id,
                conteudo: conteudo
            })
        });
        
        input.value = '';
        await abrirConversa(conversaAtual.id);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem');
    }
}

document.getElementById('inputMensagem')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
    }
});

document.getElementById('buscarConversa')?.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const itens = document.querySelectorAll('#listaConversas > div');
    
    itens.forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = texto.includes(termo) ? 'block' : 'none';
    });
});

async function abrirModalNovaConversa() {
    document.getElementById('modalNovaConversa').classList.remove('hidden');
    await carregarConsultoresModal();
}

function fecharModalNovaConversa() {
    document.getElementById('modalNovaConversa').classList.add('hidden');
}

async function carregarConsultoresModal() {
    try {
        const response = await apiRequest('/api/consultores/?page=1&page_size=100');
        const data = await response.json();
        
        const container = document.getElementById('listaConsultoresModal');
        
        const consultoresFiltrados = data.consultores.filter(c => c.id !== usuario.id);
        
        if (consultoresFiltrados.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 py-4">Nenhum consultor disponível</div>';
            return;
        }
        
        container.innerHTML = consultoresFiltrados.map(consultor => `
            <div onclick="iniciarNovaConversa(${consultor.id})" class="p-4 border border-gray-700 rounded-lg hover:bg-dark-hover cursor-pointer transition mb-3">
                <div class="flex items-center">
                    <img src="${consultor.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(consultor.nome)}&size=50&background=3b82f6&color=fff`}" 
                         alt="${consultor.nome}" 
                         class="w-12 h-12 rounded-full mr-4">
                    <div class="flex-1">
                        <h4 class="text-white font-medium">${consultor.nome}</h4>
                        <p class="text-gray-400 text-sm">${consultor.email}</p>
                        ${consultor.telefone ? `<p class="text-gray-500 text-sm">${consultor.telefone}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar consultores:', error);
        document.getElementById('listaConsultoresModal').innerHTML = 
            '<div class="text-center text-red-400 py-4">Erro ao carregar consultores</div>';
    }
}

async function iniciarNovaConversa(consultorId) {
    fecharModalNovaConversa();
    await abrirConversa(consultorId);
}

document.getElementById('buscarConsultorModal')?.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const itens = document.querySelectorAll('#listaConsultoresModal > div');
    
    itens.forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = texto.includes(termo) ? 'block' : 'none';
    });
});

carregarConversas();
setInterval(carregarConversas, 10000);

if (conversaAtual) {
    setInterval(() => abrirConversa(conversaAtual.id), 5000);
}
