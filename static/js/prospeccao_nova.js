checkAuth();
atualizarSidebar();

const usuario = getUsuario();

let todasProspeccoes = [];
let visualizacaoAtual = 'lista';

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
        if (!response) {
            document.getElementById('viewCards').innerHTML = '<div class="col-span-full text-center py-8 text-red-400">Sessão expirada. Faça login novamente.</div>';
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na API:', response.status, errorText);
            document.getElementById('viewCards').innerHTML = `<div class="col-span-full text-center py-8 text-red-400">Erro ao carregar prospecções (${response.status})</div>`;
            return;
        }
        
        todasProspeccoes = await response.json();
        
        await carregarConsultoresParaFiltro();
        renderizarProspeccoes(todasProspeccoes);
    } catch (error) {
        console.error('Erro ao carregar prospecções:', error);
        document.getElementById('viewCards').innerHTML = '<div class="col-span-full text-center py-8 text-red-400">Erro ao carregar prospecções. Verifique sua conexão.</div>';
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

let prospeccaoEditandoId = null;
let prospeccaoEditandoCodigo = null;

function mostrarProspeccoesLista(prospeccoes) {
    const tbody = document.getElementById('listaProspeccoesTable');
    
    if (prospeccoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-2 py-4 text-center text-gray-400 text-xs">Nenhuma prospecção encontrada</td></tr>';
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
        const codigo = prosp.codigo || '-';
        
        const observacoes = prosp.observacoes || '';
        const obsLength = observacoes.length;
        const obsFontClass = obsLength > 100 ? 'text-[10px]' : 'text-xs';
        const obsText = observacoes || '-';
        
        return `
            <tr class="hover:bg-dark-hover/50 transition border-b border-gray-700/30">
                <td class="px-2 py-1.5 align-top">
                    <div class="text-blue-400 text-[10px] font-mono truncate cursor-pointer hover:text-blue-300" onclick="abrirEditarProspeccao(${prosp.id})" title="${codigo}">${codigo}</div>
                </td>
                <td class="px-2 py-1.5 align-top">
                    <div class="text-white text-xs font-medium truncate" title="${empresaNome}">${empresaNome}</div>
                    <div class="text-gray-500 text-[10px] truncate">${empresaMunicipio}-${empresaEstado}</div>
                </td>
                <td class="px-2 py-1.5 text-gray-300 text-xs truncate align-top" title="${consultorNome}">${consultorNome}</td>
                <td class="px-2 py-1.5 text-gray-300 text-xs align-top whitespace-nowrap">${prosp.data_ligacao ? new Date(prosp.data_ligacao).toLocaleDateString('pt-BR') : '-'}</td>
                <td class="px-2 py-1.5 ${resultadoClass} text-xs font-medium align-top">${prosp.resultado || '-'}</td>
                <td class="px-2 py-1.5 text-gray-300 text-xs align-top">${prosp.status_follow_up || '-'}</td>
                <td class="px-2 py-1.5 text-gray-300 text-xs align-top">${prosp.potencial_negocio || '-'}</td>
                <td class="px-2 py-1.5 align-top">
                    <div class="${obsFontClass} text-gray-400 leading-tight max-h-16 overflow-y-auto break-words" title="${obsText}">${obsText}</div>
                </td>
                <td class="px-2 py-1.5 align-top">
                    <div class="flex gap-1">
                        <button onclick="abrirEditarProspeccao(${prosp.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-[10px] transition" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="abrirHistorico(${prosp.id}, '${codigo}')" class="bg-purple-600 hover:bg-purple-700 text-white px-2 py-0.5 rounded text-[10px] transition" title="Histórico">
                            <i class="fas fa-history"></i>
                        </button>
                        <button onclick="exportarPDF(${prosp.id})" class="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[10px] transition" title="PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function abrirEditarProspeccao(prospeccaoId) {
    try {
        const response = await apiRequest(`/api/prospeccoes/${prospeccaoId}`);
        const prosp = await response.json();
        
        prospeccaoEditandoId = prosp.id;
        prospeccaoEditandoCodigo = prosp.codigo;
        
        document.getElementById('edit_prospeccao_id').value = prosp.id;
        document.getElementById('editCodigoDisplay').textContent = `Código: ${prosp.codigo}`;
        document.getElementById('edit_empresa_nome').value = prosp.empresa?.empresa || '';
        document.getElementById('edit_consultor_nome').value = prosp.consultor?.nome || '';
        document.getElementById('edit_nome_contato').value = prosp.nome_contato || '';
        document.getElementById('edit_cargo_contato').value = prosp.cargo_contato || '';
        document.getElementById('edit_telefone_contato').value = prosp.telefone_contato || '';
        document.getElementById('edit_email_contato').value = prosp.email_contato || '';
        document.getElementById('edit_data_ligacao').value = prosp.data_ligacao || '';
        document.getElementById('edit_hora_ligacao').value = prosp.hora_ligacao || '';
        document.getElementById('edit_resultado').value = prosp.resultado || '';
        document.getElementById('edit_potencial_negocio').value = prosp.potencial_negocio || '';
        document.getElementById('edit_status_follow_up').value = prosp.status_follow_up || '';
        document.getElementById('edit_observacoes').value = prosp.observacoes || '';
        
        document.getElementById('editarProspeccaoModal').classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao carregar prospecção:', error);
        alert('Erro ao carregar prospecção para edição');
    }
}

function hideEditarProspeccaoModal() {
    document.getElementById('editarProspeccaoModal').classList.add('hidden');
    document.getElementById('editarProspeccaoForm').reset();
    prospeccaoEditandoId = null;
    prospeccaoEditandoCodigo = null;
}

document.getElementById('editarProspeccaoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!prospeccaoEditandoId) {
        alert('Erro: ID da prospecção não encontrado');
        return;
    }
    
    const dados = {
        nome_contato: document.getElementById('edit_nome_contato').value || null,
        cargo_contato: document.getElementById('edit_cargo_contato').value || null,
        telefone_contato: document.getElementById('edit_telefone_contato').value || null,
        email_contato: document.getElementById('edit_email_contato').value || null,
        data_ligacao: document.getElementById('edit_data_ligacao').value || null,
        hora_ligacao: document.getElementById('edit_hora_ligacao').value || null,
        resultado: document.getElementById('edit_resultado').value || null,
        potencial_negocio: document.getElementById('edit_potencial_negocio').value || null,
        status_follow_up: document.getElementById('edit_status_follow_up').value || null,
        observacoes: document.getElementById('edit_observacoes').value || null
    };
    
    try {
        const response = await apiRequest(`/api/prospeccoes/${prospeccaoEditandoId}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar prospecção');
        
        alert('Prospecção atualizada com sucesso! As alterações foram salvas no histórico.');
        hideEditarProspeccaoModal();
        carregarProspeccoes();
    } catch (error) {
        console.error('Erro ao atualizar prospecção:', error);
        alert('Erro ao atualizar prospecção');
    }
});

function verHistorico() {
    if (prospeccaoEditandoId && prospeccaoEditandoCodigo) {
        abrirHistorico(prospeccaoEditandoId, prospeccaoEditandoCodigo);
    }
}

async function abrirHistorico(prospeccaoId, codigo) {
    document.getElementById('historicoCodigoDisplay').textContent = `Código: ${codigo}`;
    document.getElementById('historicoContent').innerHTML = '<div class="text-center py-8 text-gray-400">Carregando histórico...</div>';
    document.getElementById('historicoModal').classList.remove('hidden');
    
    try {
        const response = await apiRequest(`/api/prospeccoes/${prospeccaoId}/historico`);
        const historico = await response.json();
        
        if (historico.length === 0) {
            document.getElementById('historicoContent').innerHTML = '<div class="text-center py-8 text-gray-400">Nenhuma alteração registrada ainda.</div>';
            return;
        }
        
        const html = historico.map(h => {
            const data = new Date(h.data_alteracao).toLocaleString('pt-BR');
            const usuarioNome = h.usuario?.nome || 'Usuário desconhecido';
            
            let tipoIcon = '';
            let tipoBg = '';
            switch(h.tipo_alteracao) {
                case 'criacao':
                    tipoIcon = '<i class="fas fa-plus-circle text-green-400"></i>';
                    tipoBg = 'border-l-green-500';
                    break;
                case 'edicao':
                    tipoIcon = '<i class="fas fa-edit text-blue-400"></i>';
                    tipoBg = 'border-l-blue-500';
                    break;
                case 'agendamento':
                    tipoIcon = '<i class="fas fa-calendar text-yellow-400"></i>';
                    tipoBg = 'border-l-yellow-500';
                    break;
                default:
                    tipoIcon = '<i class="fas fa-info-circle text-gray-400"></i>';
                    tipoBg = 'border-l-gray-500';
            }
            
            let detalhes = '';
            if (h.campo_alterado) {
                detalhes = `
                    <div class="mt-2 text-sm">
                        <span class="text-gray-400">Campo:</span> <span class="text-white">${h.campo_alterado}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div class="bg-red-900/20 p-2 rounded">
                            <span class="text-red-400">Anterior:</span>
                            <div class="text-gray-300 mt-1">${h.valor_anterior || '-'}</div>
                        </div>
                        <div class="bg-green-900/20 p-2 rounded">
                            <span class="text-green-400">Novo:</span>
                            <div class="text-gray-300 mt-1">${h.valor_novo || '-'}</div>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="bg-dark-card p-4 rounded-lg border-l-4 ${tipoBg}">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-2">
                            ${tipoIcon}
                            <span class="text-white font-medium capitalize">${h.tipo_alteracao}</span>
                        </div>
                        <span class="text-gray-500 text-xs">${data}</span>
                    </div>
                    <div class="text-gray-400 text-sm mt-1">por ${usuarioNome}</div>
                    ${h.descricao ? `<div class="text-gray-300 text-sm mt-2">${h.descricao}</div>` : ''}
                    ${detalhes}
                </div>
            `;
        }).join('');
        
        document.getElementById('historicoContent').innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        document.getElementById('historicoContent').innerHTML = '<div class="text-center py-8 text-red-400">Erro ao carregar histórico</div>';
    }
}

function hideHistoricoModal() {
    document.getElementById('historicoModal').classList.add('hidden');
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

async function selecionarEmpresa(id, nome, municipio) {
    empresaSelecionada = { id, nome, municipio };
    empresaSearchInput.value = `${nome} - ${municipio || 'N/A'}`;
    empresaIdInput.value = id;
    empresaAutocomplete.classList.add('hidden');
    
    await preencherDadosContato(id);
}

async function preencherDadosContato(empresaId) {
    try {
        const response = await apiRequest(`/api/empresas/${empresaId}/ultimo-contato`);
        if (!response || !response.ok) return;
        
        const dados = await response.json();
        
        if (dados.tem_contato) {
            const nomeContatoInput = document.getElementById('nome_contato');
            const cargoContatoInput = document.getElementById('cargo_contato');
            const telefoneContatoInput = document.getElementById('telefone_contato');
            const emailContatoInput = document.getElementById('email_contato');
            
            if (dados.nome_contato && nomeContatoInput && !nomeContatoInput.value) {
                nomeContatoInput.value = dados.nome_contato;
            }
            if (dados.cargo_contato && cargoContatoInput && !cargoContatoInput.value) {
                cargoContatoInput.value = dados.cargo_contato;
            }
            if (dados.telefone_contato && telefoneContatoInput && !telefoneContatoInput.value) {
                telefoneContatoInput.value = dados.telefone_contato;
            }
            if (dados.email_contato && emailContatoInput && !emailContatoInput.value) {
                emailContatoInput.value = dados.email_contato;
            }
            
            const dadosPreenchidos = [
                dados.nome_contato ? 'Nome' : null,
                dados.cargo_contato ? 'Cargo' : null,
                dados.telefone_contato ? 'Telefone' : null,
                dados.email_contato ? 'E-mail' : null
            ].filter(Boolean);
            
            if (dadosPreenchidos.length > 0) {
                console.log(`Dados do contato preenchidos automaticamente: ${dadosPreenchidos.join(', ')}`);
            }
        }
    } catch (error) {
        console.error('Erro ao buscar dados do contato:', error);
    }
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

async function verificarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const empresaId = urlParams.get('empresa_id');
    const consultorIdParam = urlParams.get('consultor_id');
    
    if (empresaId) {
        try {
            const response = await apiRequest(`/api/empresas/${empresaId}`);
            if (response.ok) {
                const empresa = await response.json();
                empresaIdInput.value = empresa.id;
                empresaSearchInput.value = `${empresa.empresa} - ${empresa.municipio || 'N/A'}`;
                empresaSelecionada = { id: empresa.id, nome: empresa.empresa, municipio: empresa.municipio };
            }
        } catch (error) {
            console.error('Erro ao carregar empresa dos parâmetros:', error);
        }
    }
    
    if (consultorIdParam && usuario.tipo === 'admin') {
        await carregarConsultores();
        const select = document.getElementById('consultor_id');
        if (select) {
            select.value = consultorIdParam;
        }
    }
    
    if (empresaId || consultorIdParam) {
        showNovaProspeccaoModal();
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

verificarParametrosURL();
