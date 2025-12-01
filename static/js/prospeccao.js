checkAuth();
atualizarSidebar();

const usuario = getUsuario();

let empresasCache = [];
let consultoresCache = [];

async function carregarProspeccoes() {
    try {
        const response = await apiRequest('/api/prospeccoes/');
        const prospeccoes = await response.json();
        
        const empresasResponse = await apiRequest('/api/empresas/');
        empresasCache = await empresasResponse.json();
        
        const tbody = document.getElementById('tabelaProspeccoes');
        
        if (prospeccoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Nenhuma prospecção encontrada</td></tr>';
            return;
        }
        
        tbody.innerHTML = prospeccoes.map(p => {
            const empresa = empresasCache.find(e => e.id === p.empresa_id);
            return `
                <tr class="hover:bg-dark-hover">
                    <td class="px-6 py-4 text-gray-300">${p.data_ligacao ? new Date(p.data_ligacao).toLocaleDateString('pt-BR') : '-'}</td>
                    <td class="px-6 py-4 text-gray-300">${empresa ? empresa.empresa : 'N/A'}</td>
                    <td class="px-6 py-4 text-gray-300">Consultor ${p.consultor_id}</td>
                    <td class="px-6 py-4 text-gray-300">${p.resultado || '-'}</td>
                    <td class="px-6 py-4">
                        <button onclick="criarAgendamento(${p.id})" class="text-blue-400 hover:text-blue-300">Agendar</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar prospecções:', error);
    }
}

async function showNovaProspeccaoModal() {
    document.getElementById('novaProspeccaoModal').classList.remove('hidden');
    
    if (empresasCache.length === 0) {
        const response = await apiRequest('/api/empresas/');
        empresasCache = await response.json();
    }
    
    const selectEmpresa = document.getElementById('empresa_id');
    selectEmpresa.innerHTML = '<option value="">Selecione uma empresa</option>' + 
        empresasCache.map(e => `<option value="${e.id}">${e.empresa}</option>`).join('');
    
    if (usuario.tipo === 'admin') {
        const response = await apiRequest('/api/empresas/');
        document.getElementById('consultor_id').innerHTML = '<option value="">Selecione um consultor</option>';
    } else {
        document.getElementById('consultorDiv').style.display = 'none';
    }
}

function hideNovaProspeccaoModal() {
    document.getElementById('novaProspeccaoModal').classList.add('hidden');
    document.getElementById('novaProspeccaoForm').reset();
}

document.getElementById('novaProspeccaoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prospeccao = {
        empresa_id: parseInt(document.getElementById('empresa_id').value),
        consultor_id: usuario.tipo === 'admin' && document.getElementById('consultor_id').value ? 
            parseInt(document.getElementById('consultor_id').value) : usuario.id,
        data_ligacao: document.getElementById('data_ligacao').value || null,
        hora_ligacao: document.getElementById('hora_ligacao').value || null,
        resultado: document.getElementById('resultado').value || null,
        observacoes: document.getElementById('observacoes').value || null
    };
    
    try {
        const response = await apiRequest('/api/prospeccoes/', {
            method: 'POST',
            body: JSON.stringify(prospeccao)
        });
        
        if (response.ok) {
            alert('Prospecção criada com sucesso!');
            hideNovaProspeccaoModal();
            carregarProspeccoes();
        } else {
            const error = await response.json();
            alert(error.detail || 'Erro ao criar prospecção');
        }
    } catch (error) {
        alert('Erro de conexão com o servidor');
    }
});

async function criarAgendamento(prospeccaoId) {
    const data = prompt('Digite a data e hora do agendamento (AAAA-MM-DD HH:MM):');
    if (!data) return;
    
    const observacoes = prompt('Observações (opcional):');
    
    try {
        const response = await apiRequest('/api/agendamentos/', {
            method: 'POST',
            body: JSON.stringify({
                prospeccao_id: prospeccaoId,
                data_agendada: data,
                status: 'pendente',
                observacoes: observacoes
            })
        });
        
        if (response.ok) {
            alert('Agendamento criado com sucesso!');
        } else {
            const error = await response.json();
            alert(error.detail || 'Erro ao criar agendamento');
        }
    } catch (error) {
        alert('Erro de conexão com o servidor');
    }
}

carregarProspeccoes();
