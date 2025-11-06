checkAuth();

const usuario = getUsuario();
document.getElementById('userInfo').textContent = `${usuario.nome} (${usuario.tipo})`;

if (usuario.tipo === 'admin') {
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        adminLink.classList.remove('hidden');
    }
}

async function carregarDashboard() {
    try {
        const [empresasRes, prospeccoesRes, alertasRes] = await Promise.all([
            apiRequest('/api/empresas'),
            apiRequest('/api/prospeccoes'),
            apiRequest('/api/agendamentos/alertas')
        ]);
        
        const empresas = await empresasRes.json();
        const prospeccoes = await prospeccoesRes.json();
        const alertas = await alertasRes.json();
        
        document.getElementById('totalEmpresas').textContent = empresas.length;
        document.getElementById('totalProspeccoes').textContent = prospeccoes.length;
        
        const totalAgendamentos = alertas.vencidos.length + alertas.hoje.length + alertas.futuros.length;
        document.getElementById('totalAgendamentos').textContent = totalAgendamentos;
        
        mostrarAlertasRecentes(alertas);
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function mostrarAlertasRecentes(alertas) {
    const container = document.getElementById('alertasRecentes');
    
    if (alertas.vencidos.length === 0 && alertas.hoje.length === 0 && alertas.futuros.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">Nenhum alerta no momento</p>';
        return;
    }
    
    let html = '';
    
    alertas.vencidos.forEach(alerta => {
        html += `
            <div class="bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
                <p class="text-red-300 font-semibold">Vencido</p>
                <p class="text-gray-300 text-sm mt-1">${new Date(alerta.data_agendada).toLocaleString('pt-BR')}</p>
                <p class="text-gray-400 text-sm">${alerta.observacoes || 'Sem observações'}</p>
            </div>
        `;
    });
    
    alertas.hoje.forEach(alerta => {
        html += `
            <div class="bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded">
                <p class="text-yellow-300 font-semibold">Hoje</p>
                <p class="text-gray-300 text-sm mt-1">${new Date(alerta.data_agendada).toLocaleString('pt-BR')}</p>
                <p class="text-gray-400 text-sm">${alerta.observacoes || 'Sem observações'}</p>
            </div>
        `;
    });
    
    container.innerHTML = html || '<p class="text-gray-400 text-center py-4">Nenhum alerta no momento</p>';
}

carregarDashboard();
