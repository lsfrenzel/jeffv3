checkAuth();

const usuario = getUsuario();
document.getElementById('userInfo').textContent = `${usuario.nome} (${usuario.tipo})`;

let todasProspeccoes = [];
let visualizacaoAtual = 'cards';

document.getElementById('agendar_proxima').addEventListener('change', function() {
    const opcoes = document.getElementById('agendamentoOptions');
    const dataInput = document.getElementById('data_proxima_ligacao');
    opcoes.classList.toggle('hidden', !this.checked);
    
    if (this.checked && !dataInput.value) {
        const hoje = new Date();
        hoje.setDate(hoje.getDate() + 7);
        dataInput.value = hoje.toISOString().split('T')[0];
    }
    
    dataInput.required = this.checked;
});

function toggleVisualizacao(modo) {
    visualizacaoAtual = modo;
    
    const btnCards = document.getElementById('btnCards');
    const btnLista = document.getElementById('btnLista');
    const viewCards = document.getElementById('viewCards');
    const viewLista = document.getElementById('viewLista');
    
    if (modo === 'cards') {
        btnCards.classList.remove('bg-gray-600');
        btnCards.classList.add('bg-blue-600');
        btnLista.classList.remove('bg-blue-600');
        btnLista.classList.add('bg-gray-600');
        viewCards.classList.remove('hidden');
        viewLista.classList.add('hidden');
    } else {
        btnLista.classList.remove('bg-gray-600');
        btnLista.classList.add('bg-blue-600');
        btnCards.classList.remove('bg-blue-600');
        btnCards.classList.add('bg-gray-600');
        viewLista.classList.remove('hidden');
        viewCards.classList.add('hidden');
    }
    
    renderizarProspeccoes(todasProspeccoes);
}

function aplicarFiltros() {
    const filtroEmpresa = document.getElementById('filtroEmpresa').value.toLowerCase();
    const filtroConsultor = document.getElementById('filtroConsultor').value;
    const filtroResultado = document.getElementById('filtroResultado').value;
    const filtroStatus = document.getElementById('filtroStatus').value;
    
    let prospeccoesFiltradas = todasProspeccoes.filter(prosp => {
        const empresaNome = (prosp.empresa?.empresa || prosp.empresa_nome || '').toLowerCase();
        const consultorId = prosp.consultor?.id || prosp.consultor_id;
        
        const matchEmpresa = !filtroEmpresa || empresaNome.includes(filtroEmpresa);
        const matchConsultor = !filtroConsultor || consultorId == filtroConsultor;
        const matchResultado = !filtroResultado || prosp.resultado === filtroResultado;
        const matchStatus = !filtroStatus || prosp.status_follow_up === filtroStatus;
        
        return matchEmpresa && matchConsultor && matchResultado && matchStatus;
    });
    
    renderizarProspeccoes(prospeccoesFiltradas);
}

function limparFiltros() {
    document.getElementById('filtroEmpresa').value = '';
    document.getElementById('filtroConsultor').value = '';
    document.getElementById('filtroResultado').value = '';
    document.getElementById('filtroStatus').value = '';
    renderizarProspeccoes(todasProspeccoes);
}

function renderizarProspeccoes(prospeccoes) {
    if (visualizacaoAtual === 'cards') {
        mostrarProspeccoesCards(prospeccoes);
    } else {
        mostrarProspeccoesLista(prospeccoes);
    }
}

async function carregarProspeccoes() {
    try {
        const response = await apiRequest('/api/prospeccoes/');
        todasProspeccoes = await response.json();
        
        await carregarConsultoresParaFiltro();
        renderizarProspeccoes(todasProspeccoes);
    } catch (error) {
        console.error('Erro ao carregar prospecções:', error);
        document.getElementById('viewCards').innerHTML = '<div class="col-span-full text-center py-8 text-red-400">Erro ao carregar prospecções</div>';
    }
}

async function carregarConsultoresParaFiltro() {
    try {
        const response = await apiRequest('/api/admin/usuarios');
        const usuarios = await response.json();
        
        const consultores = usuarios.filter(u => u.tipo === 'consultor' || u.tipo === 'admin');
        const select = document.getElementById('filtroConsultor');
        select.innerHTML = '<option value="">Todos</option>';
        consultores.forEach(consultor => {
            const option = document.createElement('option');
            option.value = consultor.id;
            option.textContent = consultor.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar consultores:', error);
    }
}

function mostrarProspeccoesLista(prospeccoes) {
    const tbody = document.getElementById('listaProspeccoesTable');
    
    if (prospeccoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400">Nenhuma prospecção encontrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = prospeccoes.map(prosp => {
        const resultadoClass = prosp.resultado && prosp.resultado.includes('Interesse') ? 'text-green-400' : 
                              prosp.resultado && prosp.resultado.includes('Sem interesse') ? 'text-red-400' : 
                              'text-blue-400';
        
        const empresaNome = prosp.empresa?.empresa || prosp.empresa_nome || 'N/A';
        const empresaMunicipio = prosp.empresa?.municipio || prosp.municipio || 'N/A';
        const empresaEstado = prosp.empresa?.estado || prosp.estado || 'N/A';
        const consultorNome = prosp.consultor?.nome || prosp.consultor_nome || 'N/A';
        
        return `
            <tr class="hover:bg-dark-hover transition">
                <td class="px-6 py-4">
                    <div class="text-white font-medium">${empresaNome}</div>
                    <div class="text-gray-400 text-sm">${empresaMunicipio} - ${empresaEstado}</div>
                </td>
                <td class="px-6 py-4 text-white">${consultorNome}</td>
                <td class="px-6 py-4 text-white">${prosp.data_ligacao ? new Date(prosp.data_ligacao).toLocaleDateString('pt-BR') : 'N/A'}</td>
                <td class="px-6 py-4 ${resultadoClass} font-semibold">${prosp.resultado || 'N/A'}</td>
                <td class="px-6 py-4 text-white">${prosp.status_follow_up || 'N/A'}</td>
                <td class="px-6 py-4 text-white">${prosp.potencial_negocio || 'N/A'}</td>
                <td class="px-6 py-4">
                    <button onclick="exportarPDF(${prosp.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition">
                        📄 PDF
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function mostrarProspeccoesCards(prospeccoes) {
    const container = document.getElementById('viewCards');
    
    if (prospeccoes.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-400">Nenhuma prospecção encontrada</div>';
        return;
    }
    
    let html = '';
    prospeccoes.forEach(prosp => {
        const interesses = [];
        if (prosp.interesse_treinamento) interesses.push('📚 Treinamento');
        if (prosp.interesse_consultoria) interesses.push('💼 Consultoria');
        if (prosp.interesse_certificacao) interesses.push('🎓 Certificação');
        if (prosp.interesse_eventos) interesses.push('🎪 Eventos');
        if (prosp.interesse_produtos) interesses.push('📦 Produtos');
        
        const resultadoClass = prosp.resultado && prosp.resultado.includes('Interesse') ? 'bg-green-900/30 border-green-500' : 
                              prosp.resultado && prosp.resultado.includes('Sem interesse') ? 'bg-red-900/30 border-red-500' : 
                              'bg-blue-900/30 border-blue-500';
        
        const empresaNome = prosp.empresa?.empresa || prosp.empresa_nome || 'N/A';
        const empresaMunicipio = prosp.empresa?.municipio || prosp.municipio || 'N/A';
        const empresaEstado = prosp.empresa?.estado || prosp.estado || 'N/A';
        const consultorNome = prosp.consultor?.nome || prosp.consultor_nome || 'N/A';
        
        html += `
            <div class="bg-dark-sidebar rounded-lg shadow-lg overflow-hidden border-l-4 ${resultadoClass} hover:shadow-xl transition">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white mb-1">${empresaNome}</h3>
                            <p class="text-gray-400 text-sm">${empresaMunicipio} - ${empresaEstado}</p>
                        </div>
                        <button onclick="exportarPDF(${prosp.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition">
                            📄 PDF
                        </button>
                    </div>
                    
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center text-sm">
                            <span class="text-gray-400 w-24">Consultor:</span>
                            <span class="text-white">${consultorNome}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <span class="text-gray-400 w-24">Data:</span>
                            <span class="text-white">${prosp.data_ligacao ? new Date(prosp.data_ligacao).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <span class="text-gray-400 w-24">Resultado:</span>
                            <span class="text-white font-semibold">${prosp.resultado || 'N/A'}</span>
                        </div>
                    </div>
                    
                    ${interesses.length > 0 ? `
                    <div class="bg-dark-card p-3 rounded mb-4">
                        <p class="text-gray-400 text-xs mb-2">INTERESSES:</p>
                        <div class="flex flex-wrap gap-2">
                            ${interesses.map(i => `<span class="bg-blue-600 text-white text-xs px-2 py-1 rounded">${i}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${prosp.observacoes ? `
                    <div class="bg-dark-card p-3 rounded">
                        <p class="text-gray-400 text-xs mb-1">OBSERVAÇÕES:</p>
                        <p class="text-white text-sm">${prosp.observacoes}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function exportarPDF(prospeccaoId) {
    try {
        const response = await fetch(`/api/prospeccoes/export-pdf/${prospeccaoId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao exportar PDF');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prospeccao_${prospeccaoId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('PDF exportado com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        alert('Erro ao exportar PDF');
    }
}

let empresaSelecionada = null;

const empresaSearchInput = document.getElementById('empresa_search');
const empresaAutocomplete = document.getElementById('empresa_autocomplete');
const empresaIdInput = document.getElementById('empresa_id');

let searchTimeout;

empresaSearchInput.addEventListener('input', async function() {
    const query = this.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length < 2) {
        empresaAutocomplete.classList.add('hidden');
        empresaIdInput.value = '';
        empresaSelecionada = null;
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            const response = await apiRequest(`/api/empresas/?nome=${encodeURIComponent(query)}&page_size=10`);
            const data = await response.json();
            const empresas = data.items || [];
            
            if (empresas.length === 0) {
                empresaAutocomplete.innerHTML = '<div class="p-3 text-gray-400 text-sm">Nenhuma empresa encontrada</div>';
                empresaAutocomplete.classList.remove('hidden');
                return;
            }
            
            empresaAutocomplete.innerHTML = '';
            empresas.forEach(empresa => {
                const div = document.createElement('div');
                div.className = 'p-3 hover:bg-dark-hover cursor-pointer border-b border-gray-700 last:border-0';
                div.dataset.empresaId = empresa.id;
                
                const nomeDiv = document.createElement('div');
                nomeDiv.className = 'text-white font-medium';
                nomeDiv.textContent = empresa.empresa;
                
                const localDiv = document.createElement('div');
                localDiv.className = 'text-gray-400 text-sm';
                localDiv.textContent = `${empresa.municipio || 'N/A'} - ${empresa.estado || 'N/A'}`;
                
                div.appendChild(nomeDiv);
                div.appendChild(localDiv);
                
                div.addEventListener('click', () => {
                    selecionarEmpresa(empresa.id, empresa.empresa, empresa.municipio || '');
                });
                
                empresaAutocomplete.appendChild(div);
            });
            
            empresaAutocomplete.classList.remove('hidden');
        } catch (error) {
            console.error('Erro ao buscar empresas:', error);
        }
    }, 300);
});

empresaSearchInput.addEventListener('blur', function() {
    setTimeout(() => {
        empresaAutocomplete.classList.add('hidden');
    }, 200);
});

empresaSearchInput.addEventListener('focus', function() {
    if (empresaAutocomplete.innerHTML && !empresaAutocomplete.classList.contains('hidden')) {
        empresaAutocomplete.classList.remove('hidden');
    }
});

function selecionarEmpresa(id, nome, municipio) {
    empresaSelecionada = { id, nome, municipio };
    empresaSearchInput.value = `${nome} - ${municipio || 'N/A'}`;
    empresaIdInput.value = id;
    empresaAutocomplete.classList.add('hidden');
}

function showNovaProspeccaoModal() {
    if (usuario.tipo === 'admin') {
        carregarConsultores();
    } else {
        document.getElementById('consultorDiv').style.display = 'none';
        document.getElementById('consultor_id').value = usuario.id;
    }
    document.getElementById('novaProspeccaoModal').classList.remove('hidden');
}

function hideNovaProspeccaoModal() {
    document.getElementById('novaProspeccaoModal').classList.add('hidden');
    document.getElementById('novaProspeccaoForm').reset();
    document.getElementById('agendamentoOptions').classList.add('hidden');
    document.getElementById('data_proxima_ligacao').required = false;
    document.getElementById('data_proxima_ligacao').value = '';
    empresaSearchInput.value = '';
    empresaIdInput.value = '';
    empresaSelecionada = null;
    empresaAutocomplete.classList.add('hidden');
}


async function carregarConsultores() {
    try {
        const response = await apiRequest('/api/admin/usuarios');
        const usuarios = await response.json();
        
        const consultores = usuarios.filter(u => u.tipo === 'consultor' || u.tipo === 'admin');
        const select = document.getElementById('consultor_id');
        select.innerHTML = '<option value="">Selecione um consultor...</option>';
        consultores.forEach(consultor => {
            const option = document.createElement('option');
            option.value = consultor.id;
            option.textContent = consultor.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar consultores:', error);
    }
}

document.getElementById('novaProspeccaoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const empresaIdValue = document.getElementById('empresa_id').value;
    if (!empresaIdValue || isNaN(parseInt(empresaIdValue))) {
        alert('Por favor, selecione uma empresa da lista de sugestões');
        return;
    }
    
    const consultorId = usuario.tipo === 'admin' ? 
        parseInt(document.getElementById('consultor_id').value) : 
        usuario.id;
    
    const agendarProxima = document.getElementById('agendar_proxima').checked;
    const dataProxima = document.getElementById('data_proxima_ligacao').value;
    
    if (agendarProxima && !dataProxima) {
        alert('Por favor, selecione a data da próxima ligação');
        return;
    }
    
    const getCheckboxValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.checked : false;
    };
    
    const getInputValue = (id) => {
        const element = document.getElementById(id);
        return element ? (element.value || null) : null;
    };
    
    const prospeccaoData = {
        empresa_id: parseInt(document.getElementById('empresa_id').value),
        consultor_id: consultorId,
        data_ligacao: getInputValue('data_ligacao'),
        hora_ligacao: getInputValue('hora_ligacao'),
        resultado: getInputValue('resultado'),
        observacoes: getInputValue('observacoes'),
        
        nome_contato: getInputValue('nome_contato'),
        telefone_contato: getInputValue('telefone_contato'),
        email_contato: getInputValue('email_contato'),
        cargo_contato: getInputValue('cargo_contato'),
        
        interesse_treinamento: getCheckboxValue('interesse_treinamento'),
        interesse_consultoria: getCheckboxValue('interesse_consultoria'),
        interesse_certificacao: getCheckboxValue('interesse_certificacao'),
        interesse_eventos: getCheckboxValue('interesse_eventos'),
        interesse_produtos: getCheckboxValue('interesse_produtos'),
        interesse_seguranca: getCheckboxValue('interesse_seguranca'),
        interesse_meio_ambiente: getCheckboxValue('interesse_meio_ambiente'),
        outros_interesses: getInputValue('outros_interesses'),
        
        potencial_negocio: getInputValue('potencial_negocio'),
        status_follow_up: getInputValue('status_follow_up')
    };
    
    try {
        const url = agendarProxima ? 
            `/api/prospeccoes/com-agendamento?agendar_proxima=true&data_proxima_ligacao=${dataProxima}` :
            '/api/prospeccoes/';
        
        const response = await apiRequest(url, {
            method: 'POST',
            body: JSON.stringify(prospeccaoData)
        });
        
        if (!response.ok) throw new Error('Erro ao criar prospecção');
        
        alert(agendarProxima ? 'Prospecção criada e próxima ligação agendada!' : 'Prospecção criada com sucesso!');
        hideNovaProspeccaoModal();
        carregarProspeccoes();
    } catch (error) {
        console.error('Erro ao criar prospecção:', error);
        alert('Erro ao criar prospecção');
    }
});

carregarProspeccoes();
