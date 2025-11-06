checkAuth();

const usuario = getUsuario();
document.getElementById('userInfo').textContent = `${usuario.nome} (${usuario.tipo})`;

async function carregarAlertas() {
    try {
        const response = await apiRequest('/api/agendamentos/alertas');
        const alertas = await response.json();
        
        const empresasResponse = await apiRequest('/api/empresas/');
        const empresas = await empresasResponse.json();
        
        const prospeccoesResponse = await apiRequest('/api/prospeccoes/');
        const prospeccoes = await prospeccoesResponse.json();
        
        mostrarAlertas('alertasVencidos', alertas.vencidos, empresas, prospeccoes, 'text-red-400');
        mostrarAlertas('alertasHoje', alertas.hoje, empresas, prospeccoes, 'text-yellow-400');
        mostrarAlertas('alertasFuturos', alertas.futuros, empresas, prospeccoes, 'text-green-400');
    } catch (error) {
        console.error('Erro ao carregar alertas:', error);
    }
}

function mostrarAlertas(elementId, alertas, empresas, prospeccoes, colorClass) {
    const container = document.getElementById(elementId);
    
    if (alertas.length === 0) {
        container.innerHTML = '<p class="text-gray-400">Nenhum agendamento</p>';
        return;
    }
    
    container.innerHTML = alertas.map(alerta => {
        const prospeccao = prospeccoes.find(p => p.id === alerta.prospeccao_id);
        const empresa = prospeccao ? empresas.find(e => e.id === prospeccao.empresa_id) : null;
        
        return `
            <div class="bg-dark-card p-4 rounded">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold ${colorClass}">${empresa ? empresa.empresa : 'Empresa não encontrada'}</p>
                        <p class="text-gray-300 text-sm mt-1">${new Date(alerta.data_agendada).toLocaleString('pt-BR')}</p>
                        <p class="text-gray-400 text-sm mt-2">${alerta.observacoes || 'Sem observações'}</p>
                    </div>
                    <button onclick="marcarComoRealizado(${alerta.id})" 
                        class="text-green-400 hover:text-green-300 text-sm">
                        Marcar como realizado
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function marcarComoRealizado(agendamentoId) {
    if (!confirm('Marcar este agendamento como realizado?')) return;
    
    try {
        const response = await apiRequest(`/api/agendamentos/${agendamentoId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'realizado' })
        });
        
        if (response.ok) {
            alert('Agendamento marcado como realizado!');
            carregarAlertas();
        } else {
            const error = await response.json();
            alert(error.detail || 'Erro ao atualizar agendamento');
        }
    } catch (error) {
        alert('Erro de conexão com o servidor');
    }
}

carregarAlertas();
setInterval(carregarAlertas, 60000);
