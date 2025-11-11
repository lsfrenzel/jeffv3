// Variáveis globais
let projetos = [];
let consultores = [];
let empresas = [];
let visualizacao = 'timeline';

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    if (typeof checkAuth !== 'undefined') {
        checkAuth();
    }
    
    // Obter usuário
    if (typeof getUsuario !== 'undefined') {
        const usuario = getUsuario();
        if (usuario && document.getElementById('userInfo')) {
            document.getElementById('userInfo').textContent = `${usuario.nome} (${usuario.tipo})`;
        }
    }
    
    // Carregar dados iniciais
    carregarDados();
    
    // Atualizar dados a cada 60 segundos
    setInterval(carregarDados, 60000);
});

async function carregarDados() {
    try {
        await Promise.all([
            carregarProjetos(),
            carregarConsultores(),
            carregarEmpresas()
        ]);
        
        atualizarEstatisticas();
        renderizarVisualizacao();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

async function carregarProjetos(filtros = {}) {
    try {
        const params = new URLSearchParams();
        if (filtros.consultor_id) params.append('consultor_id', filtros.consultor_id);
        if (filtros.empresa_id) params.append('empresa_id', filtros.empresa_id);
        if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
        params.append('page_size', '200');
        
        const response = await apiRequest(`/api/cronograma/projetos?${params}`);
        projetos = await response.json();
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        projetos = [];
    }
}

async function carregarConsultores() {
    try {
        const response = await apiRequest('/api/consultores/?page_size=100');
        const data = await response.json();
        consultores = data.items || [];
        
        const select = document.getElementById('filtroConsultor');
        select.innerHTML = '<option value="">Todos</option>';
        consultores.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar consultores:', error);
    }
}

async function carregarEmpresas() {
    try {
        const response = await apiRequest('/api/empresas/?page_size=200');
        const data = await response.json();
        empresas = data.items || [];
        
        const select = document.getElementById('filtroEmpresa');
        select.innerHTML = '<option value="">Todas</option>';
        empresas.forEach(e => {
            const option = document.createElement('option');
            option.value = e.id;
            option.textContent = e.empresa;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
    }
}

function atualizarEstatisticas() {
    const total = projetos.length;
    const emAndamento = projetos.filter(p => p.status === 'em_andamento').length;
    const concluidos = projetos.filter(p => p.status === 'concluido').length;
    
    document.getElementById('totalProjetos').textContent = total;
    document.getElementById('projetosAndamento').textContent = emAndamento;
    document.getElementById('projetosConcluidos').textContent = concluidos;
}

function renderizarVisualizacao() {
    if (visualizacao === 'timeline') {
        renderizarTimeline();
    } else {
        renderizarLista();
    }
}

function renderizarTimeline() {
    const container = document.getElementById('ganttChart');
    
    if (projetos.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">Nenhum projeto encontrado</div>';
        return;
    }
    
    const projetosOrdenados = [...projetos].sort((a, b) => {
        if (!a.data_inicio) return 1;
        if (!b.data_inicio) return 1;
        return new Date(a.data_inicio) - new Date(b.data_inicio);
    });
    
    let html = '<div class="space-y-2">';
    
    projetosOrdenados.forEach(projeto => {
        if (!projeto.data_inicio || !projeto.data_termino) return;
        
        const inicio = new Date(projeto.data_inicio);
        const fim = new Date(projeto.data_termino);
        const hoje = new Date();
        
        const duracao = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
        const progresso = Math.min(100, Math.max(0, ((hoje - inicio) / (fim - inicio)) * 100));
        
        const statusCor = {
            'planejado': 'bg-gray-600',
            'em_andamento': 'bg-green-600',
            'concluido': 'bg-blue-600',
            'pausado': 'bg-yellow-600',
            'cancelado': 'bg-red-600'
        }[projeto.status] || 'bg-gray-600';
        
        html += `
            <div class="bg-dark-bg rounded p-3">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex-1">
                        <h4 class="text-white font-medium">${projeto.proposta || 'Sem proposta'}</h4>
                        <p class="text-gray-400 text-sm">${projeto.sigla || projeto.cnpj || ''} - ${projeto.consultor_nome || 'Sem consultor'}</p>
                    </div>
                    <div class="text-right">
                        <span class="inline-block px-3 py-1 rounded text-xs text-white ${statusCor}">
                            ${projeto.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <p class="text-gray-400 text-xs mt-1">${duracao} dias</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 text-sm">
                    <span class="text-gray-400">
                        <i class="far fa-calendar mr-1"></i>
                        ${new Date(projeto.data_inicio).toLocaleDateString('pt-BR')} - ${new Date(projeto.data_termino).toLocaleDateString('pt-BR')}
                    </span>
                    <span class="text-gray-400">
                        <i class="fas fa-clock mr-1"></i>
                        ${projeto.horas_totais || 0}h
                    </span>
                </div>
                <div class="mt-2">
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-blue-500 h-2 rounded-full transition-all" style="width: ${progresso}%"></div>
                    </div>
                    <p class="text-gray-400 text-xs mt-1">${Math.round(progresso)}% do tempo decorrido</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderizarLista() {
    const container = document.getElementById('listaProjetos');
    
    if (projetos.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">Nenhum projeto encontrado</div>';
        return;
    }
    
    let html = '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-gray-700">';
    html += '<th class="text-left text-gray-400 pb-2">Proposta</th>';
    html += '<th class="text-left text-gray-400 pb-2">Empresa</th>';
    html += '<th class="text-left text-gray-400 pb-2">Consultor</th>';
    html += '<th class="text-left text-gray-400 pb-2">Início</th>';
    html += '<th class="text-left text-gray-400 pb-2">Término</th>';
    html += '<th class="text-left text-gray-400 pb-2">Horas</th>';
    html += '<th class="text-left text-gray-400 pb-2">Status</th>';
    html += '</tr></thead><tbody>';
    
    projetos.forEach(projeto => {
        const statusCor = {
            'planejado': 'bg-gray-600',
            'em_andamento': 'bg-green-600',
            'concluido': 'bg-blue-600',
            'pausado': 'bg-yellow-600',
            'cancelado': 'bg-red-600'
        }[projeto.status] || 'bg-gray-600';
        
        html += `
            <tr class="border-b border-gray-800 hover:bg-dark-hover">
                <td class="py-3 text-white">${projeto.proposta || '-'}</td>
                <td class="py-3 text-white">${projeto.sigla || projeto.cnpj || '-'}</td>
                <td class="py-3 text-white">${projeto.consultor_nome || '-'}</td>
                <td class="py-3 text-gray-400">${projeto.data_inicio ? new Date(projeto.data_inicio).toLocaleDateString('pt-BR') : '-'}</td>
                <td class="py-3 text-gray-400">${projeto.data_termino ? new Date(projeto.data_termino).toLocaleDateString('pt-BR') : '-'}</td>
                <td class="py-3 text-gray-400">${projeto.horas_totais || 0}h</td>
                <td class="py-3">
                    <span class="inline-block px-3 py-1 rounded text-xs text-white ${statusCor}">
                        ${projeto.status.replace('_', ' ').toUpperCase()}
                    </span>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function alternarVisualizacao(tipo) {
    visualizacao = tipo;
    
    document.getElementById('btnTimeline').className = tipo === 'timeline' 
        ? 'bg-blue-600 text-white px-4 py-2 rounded transition'
        : 'bg-gray-600 text-white px-4 py-2 rounded transition';
    
    document.getElementById('btnLista').className = tipo === 'lista'
        ? 'bg-blue-600 text-white px-4 py-2 rounded transition'
        : 'bg-gray-600 text-white px-4 py-2 rounded transition';
    
    document.getElementById('timelineView').className = tipo === 'timeline' ? 'overflow-x-auto' : 'hidden';
    document.getElementById('listaView').className = tipo === 'lista' ? '' : 'hidden';
    
    renderizarVisualizacao();
}

async function aplicarFiltros() {
    const filtros = {
        consultor_id: document.getElementById('filtroConsultor').value,
        empresa_id: document.getElementById('filtroEmpresa').value,
        data_inicio: document.getElementById('filtroDataInicio').value,
        data_fim: document.getElementById('filtroDataFim').value
    };
    
    await carregarProjetos(filtros);
    atualizarEstatisticas();
    renderizarVisualizacao();
}

function limparFiltros() {
    document.getElementById('filtroConsultor').value = '';
    document.getElementById('filtroEmpresa').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    
    aplicarFiltros();
}

function abrirModalImportar() {
    document.getElementById('modalImportar').classList.remove('hidden');
}

function fecharModalImportar() {
    document.getElementById('modalImportar').classList.add('hidden');
}
