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
            apiRequest('/api/empresas/'),
            apiRequest('/api/prospeccoes/'),
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
        
        if (usuario.tipo !== 'admin') {
            await carregarEmpresasAtribuidas();
        } else {
            document.getElementById('empresasAtribuidasSection').style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

async function carregarEmpresasAtribuidas() {
    try {
        const response = await apiRequest(`/api/atribuicoes/consultor/${usuario.id}`);
        const atribuicoes = await response.json();
        
        const container = document.getElementById('empresasAtribuidas');
        
        if (atribuicoes.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-8 col-span-full">Nenhuma empresa atribuída no momento</p>';
            return;
        }
        
        let html = '';
        atribuicoes.forEach(atrib => {
            const empresa = atrib.empresa;
            html += `
                <div class="bg-dark-card p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition cursor-pointer" onclick="window.location.href='/empresa/${empresa.id}'">
                    <h4 class="text-white font-semibold mb-2">${empresa.empresa}</h4>
                    <p class="text-gray-400 text-sm mb-1"><span class="text-gray-500">CNPJ:</span> ${empresa.cnpj || 'N/A'}</p>
                    <p class="text-gray-400 text-sm mb-1"><span class="text-gray-500">Município:</span> ${empresa.municipio || 'N/A'}</p>
                    <p class="text-gray-400 text-sm"><span class="text-gray-500">Estado:</span> ${empresa.estado || 'N/A'}</p>
                    <div class="mt-3 pt-3 border-t border-gray-700">
                        <button onclick="event.stopPropagation(); criarProspeccaoRapida(${empresa.id})" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition">
                            Nova Prospecção
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar empresas atribuídas:', error);
        document.getElementById('empresasAtribuidas').innerHTML = '<p class="text-red-400 text-center py-8 col-span-full">Erro ao carregar empresas atribuídas</p>';
    }
}

function criarProspeccaoRapida(empresaId) {
    window.location.href = `/prospeccao?empresa_id=${empresaId}`;
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
