// Variáveis globais
let projetos = [];
let consultores = [];
let empresas = [];
let visualizacao = 'calendario';
let mesAtual = new Date();
let anoAtual = new Date().getFullYear();
let mesNumero = new Date().getMonth();

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    if (typeof checkAuth !== 'undefined') {
        checkAuth();
    }
    
    // Atualizar sidebar com foto e nome do usuário
    if (typeof atualizarSidebar !== 'undefined') {
        atualizarSidebar();
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
    if (visualizacao === 'calendario') {
        renderizarCalendario();
    } else if (visualizacao === 'timeline') {
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
    
    document.getElementById('btnCalendario').className = tipo === 'calendario' 
        ? 'bg-blue-600 text-white px-4 py-2 rounded transition'
        : 'bg-gray-600 text-white px-4 py-2 rounded transition';
    
    document.getElementById('btnTimeline').className = tipo === 'timeline' 
        ? 'bg-blue-600 text-white px-4 py-2 rounded transition'
        : 'bg-gray-600 text-white px-4 py-2 rounded transition';
    
    document.getElementById('btnLista').className = tipo === 'lista'
        ? 'bg-blue-600 text-white px-4 py-2 rounded transition'
        : 'bg-gray-600 text-white px-4 py-2 rounded transition';
    
    document.getElementById('calendarioView').className = tipo === 'calendario' ? 'overflow-x-auto' : 'hidden';
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

function getCorPorSolucao(solucao) {
    if (!solucao) return 'bg-teal-600';
    
    const solucaoLower = solucao.toLowerCase();
    
    if (solucaoLower.includes('implanta')) return 'bg-blue-600';
    if (solucaoLower.includes('consultoria')) return 'bg-green-600';
    if (solucaoLower.includes('treinamento')) return 'bg-purple-600';
    if (solucaoLower.includes('suporte')) return 'bg-yellow-600';
    if (solucaoLower.includes('desenvolvimento') || solucaoLower.includes('desenvolv')) return 'bg-pink-600';
    if (solucaoLower.includes('personaliza')) return 'bg-indigo-600';
    if (solucaoLower.includes('migra')) return 'bg-orange-600';
    
    return 'bg-teal-600';
}

function renderizarCalendario() {
    const container = document.getElementById('calendarioContainer');
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    document.getElementById('mesAnoAtual').textContent = `${meses[mesNumero]} ${anoAtual}`;
    
    const primeiroDia = new Date(anoAtual, mesNumero, 1).getDay();
    const ultimoDia = new Date(anoAtual, mesNumero + 1, 0).getDate();
    
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let html = '<div class="grid grid-cols-7 gap-2">';
    
    diasSemana.forEach(dia => {
        html += `<div class="text-center font-semibold text-gray-400 p-2 border-b border-gray-700">${dia}</div>`;
    });
    
    for (let i = 0; i < primeiroDia; i++) {
        html += '<div class="bg-dark-bg rounded p-2 min-h-[100px]"></div>';
    }
    
    for (let dia = 1; dia <= ultimoDia; dia++) {
        const dataAtual = new Date(anoAtual, mesNumero, dia);
        const dataStr = dataAtual.toISOString().split('T')[0];
        
        const projetosDoDia = projetos.filter(p => {
            if (!p.data_inicio || !p.data_termino) return false;
            const inicio = new Date(p.data_inicio).setHours(0, 0, 0, 0);
            const fim = new Date(p.data_termino).setHours(0, 0, 0, 0);
            const atual = dataAtual.setHours(0, 0, 0, 0);
            return inicio <= atual && atual <= fim;
        });
        
        const hoje = new Date();
        const isHoje = dataAtual.toDateString() === hoje.toDateString();
        const corDia = isHoje ? 'bg-blue-900 border-2 border-blue-500' : 'bg-dark-bg';
        const classeClicavel = projetosDoDia.length > 0 ? 'cursor-pointer hover:bg-dark-hover transition' : '';
        
        html += `<div class="${corDia} ${classeClicavel} rounded p-2 min-h-[100px] overflow-hidden" ${projetosDoDia.length > 0 ? `onclick="abrirDetalhes('${dataStr}', ${dia})"` : ''}>`;
        html += `<div class="text-white font-semibold mb-1 ${isHoje ? 'text-blue-400' : ''}">${dia}</div>`;
        
        if (projetosDoDia.length > 0) {
            projetosDoDia.slice(0, 3).forEach(projeto => {
                const corSolucao = getCorPorSolucao(projeto.solucao);
                const nomeAbreviado = (projeto.proposta || projeto.sigla || 'Projeto').substring(0, 15);
                
                html += `
                    <div class="${corSolucao} text-white text-xs p-1 rounded mb-1 truncate" title="${projeto.proposta || 'Sem proposta'} - ${projeto.solucao || 'Sem solução'}">
                        ${nomeAbreviado}
                    </div>
                `;
            });
            
            if (projetosDoDia.length > 3) {
                html += `<div class="text-gray-400 text-xs">+${projetosDoDia.length - 3} mais</div>`;
            }
        }
        
        html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function abrirDetalhes(dataStr, dia) {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    document.getElementById('modalTitulo').textContent = `Projetos de ${dia} de ${meses[mesNumero]} de ${anoAtual}`;
    
    const dataAtual = new Date(anoAtual, mesNumero, dia);
    const projetosDoDia = projetos.filter(p => {
        if (!p.data_inicio || !p.data_termino) return false;
        const inicio = new Date(p.data_inicio).setHours(0, 0, 0, 0);
        const fim = new Date(p.data_termino).setHours(0, 0, 0, 0);
        const atual = dataAtual.setHours(0, 0, 0, 0);
        return inicio <= atual && atual <= fim;
    });
    
    let html = '';
    
    if (projetosDoDia.length === 0) {
        html = '<p class="text-gray-400 text-center py-8">Nenhum projeto neste dia</p>';
    } else {
        projetosDoDia.forEach(projeto => {
            const corSolucao = getCorPorSolucao(projeto.solucao);
            
            html += `
                <div class="bg-dark-bg rounded-lg p-4 border-l-4 ${corSolucao.replace('bg-', 'border-')}">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="text-white font-semibold text-lg">${projeto.proposta || 'Sem proposta'}</h4>
                        <span class="px-3 py-1 rounded text-xs text-white ${corSolucao}">
                            ${projeto.solucao || 'Sem solução'}
                        </span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p class="text-gray-400"><i class="fas fa-building mr-2"></i><strong>Empresa:</strong> ${projeto.sigla || projeto.cnpj || 'N/A'}</p>
                        <p class="text-gray-400"><i class="fas fa-user mr-2"></i><strong>Consultor:</strong> ${projeto.consultor_nome || 'N/A'}</p>
                        <p class="text-gray-400"><i class="fas fa-calendar mr-2"></i><strong>Início:</strong> ${projeto.data_inicio ? new Date(projeto.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        <p class="text-gray-400"><i class="fas fa-calendar-check mr-2"></i><strong>Término:</strong> ${projeto.data_termino ? new Date(projeto.data_termino).toLocaleDateString('pt-BR') : 'N/A'}</p>
                        <p class="text-gray-400"><i class="fas fa-clock mr-2"></i><strong>Horas:</strong> ${projeto.horas_totais || 0}h</p>
                        <p class="text-gray-400"><i class="fas fa-chart-line mr-2"></i><strong>Porte:</strong> ${projeto.porte || 'N/A'}</p>
                    </div>
                    ${projeto.regiao || projeto.municipio || projeto.uf ? `
                        <p class="text-gray-400 text-sm mt-2"><i class="fas fa-map-marker-alt mr-2"></i>${projeto.municipio || ''} ${projeto.uf ? '- ' + projeto.uf : ''} ${projeto.regiao ? '(' + projeto.regiao + ')' : ''}</p>
                    ` : ''}
                    ${projeto.contato ? `
                        <p class="text-gray-400 text-sm mt-2"><i class="fas fa-user-tie mr-2"></i><strong>Contato:</strong> ${projeto.contato} ${projeto.telefone || projeto.celular ? '- ' + (projeto.telefone || projeto.celular) : ''}</p>
                    ` : ''}
                </div>
            `;
        });
    }
    
    document.getElementById('modalConteudo').innerHTML = html;
    document.getElementById('modalDetalhes').classList.remove('hidden');
}

function fecharModalDetalhes() {
    document.getElementById('modalDetalhes').classList.add('hidden');
}

function mesAnterior() {
    mesNumero--;
    if (mesNumero < 0) {
        mesNumero = 11;
        anoAtual--;
    }
    renderizarCalendario();
}

function proximoMes() {
    mesNumero++;
    if (mesNumero > 11) {
        mesNumero = 0;
        anoAtual++;
    }
    renderizarCalendario();
}
