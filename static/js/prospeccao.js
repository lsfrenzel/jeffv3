let empresasCache = [];
let consultoresCache = [];
let usuario = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando...');
    
    const token = getToken();
    if (!token) {
        console.log('Sem token, redirecionando para login');
        window.location.href = '/';
        return;
    }
    
    usuario = getUsuario();
    console.log('Usuário:', usuario);
    
    atualizarSidebar();
    carregarProspeccoes();
});

async function carregarProspeccoes() {
    console.log('Carregando prospecções...');
    const tbody = document.getElementById('tabelaProspeccoes');
    
    if (!tbody) {
        console.error('Elemento tabelaProspeccoes não encontrado');
        return;
    }
    
    try {
        const response = await apiRequest('/api/prospeccoes/');
        console.log('Response status:', response?.status);
        
        if (!response) {
            console.error('Response nula - possível problema de autenticação');
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Sessão expirada. Faça login novamente.</td></tr>';
            return;
        }
        
        if (!response.ok) {
            console.error('Erro na resposta:', response.status);
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Erro ao carregar prospecções (código ' + response.status + ')</td></tr>';
            return;
        }
        
        const prospeccoes = await response.json();
        console.log('Prospecções carregadas:', prospeccoes?.length || 0);
        
        try {
            const empresasResponse = await apiRequest('/api/empresas/');
            if (empresasResponse && empresasResponse.ok) {
                const empresasData = await empresasResponse.json();
                empresasCache = empresasData.items || [];
            }
        } catch (e) {
            console.warn('Erro ao carregar empresas para cache:', e);
        }
        
        if (!prospeccoes || prospeccoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Nenhuma prospecção encontrada. Clique em "Nova Prospecção" para criar uma.</td></tr>';
            return;
        }
        
        tbody.innerHTML = prospeccoes.map(p => {
            const empresaNome = p.empresa ? p.empresa.empresa : (empresasCache.find(e => e.id === p.empresa_id)?.empresa || 'N/A');
            const consultorNome = p.consultor ? p.consultor.nome : `Consultor ${p.consultor_id}`;
            return `
                <tr class="hover:bg-dark-hover transition-colors">
                    <td class="px-6 py-4 text-gray-300">${p.data_ligacao ? new Date(p.data_ligacao).toLocaleDateString('pt-BR') : '-'}</td>
                    <td class="px-6 py-4 text-gray-300">${empresaNome}</td>
                    <td class="px-6 py-4 text-gray-300">${consultorNome}</td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${getResultadoClass(p.resultado)}">${p.resultado || '-'}</span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex gap-2">
                            <button onclick="verDetalhes(${p.id})" class="text-blue-400 hover:text-blue-300 text-sm" title="Ver detalhes">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="criarAgendamento(${p.id})" class="text-green-400 hover:text-green-300 text-sm" title="Agendar retorno">
                                <i class="fas fa-calendar-plus"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log('Tabela atualizada com sucesso');
    } catch (error) {
        console.error('Erro ao carregar prospecções:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Erro ao carregar dados: ' + error.message + '</td></tr>';
    }
}

function getResultadoClass(resultado) {
    if (!resultado) return 'bg-gray-600 text-gray-200';
    const lower = resultado.toLowerCase();
    if (lower.includes('interessado') || lower.includes('proposta')) return 'bg-green-600/30 text-green-400';
    if (lower.includes('agend') || lower.includes('reunião')) return 'bg-blue-600/30 text-blue-400';
    if (lower.includes('retorno') || lower.includes('aguard')) return 'bg-yellow-600/30 text-yellow-400';
    if (lower.includes('contato')) return 'bg-purple-600/30 text-purple-400';
    return 'bg-gray-600/30 text-gray-300';
}

function verDetalhes(prospeccaoId) {
    window.location.href = `/empresa_perfil?prospeccao_id=${prospeccaoId}`;
}

async function showNovaProspeccaoModal() {
    document.getElementById('novaProspeccaoModal').classList.remove('hidden');
    
    if (empresasCache.length === 0) {
        const response = await apiRequest('/api/empresas/');
        const data = await response.json();
        empresasCache = data.items || [];
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

const novaProspeccaoForm = document.getElementById('novaProspeccaoForm');
if (novaProspeccaoForm) {
    novaProspeccaoForm.addEventListener('submit', async (e) => {
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
}

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
