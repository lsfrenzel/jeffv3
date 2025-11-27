let eventos = [];
let consultores = [];
let categorias = [];
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();
let dataSelecionada = null;

const CATEGORIA_CORES = {
    'C': { nome: 'Consultoria', cor: '#22c55e' },
    'K': { nome: 'Kick-off', cor: '#eab308' },
    'F': { nome: 'Reuniao Final', cor: '#3b82f6' },
    'M': { nome: 'Mentoria', cor: '#ef4444' },
    'T': { nome: 'T0 - Diagnostico', cor: '#f97316' },
    'P': { nome: 'Programado', cor: '#06b6d4' },
    'O': { nome: 'Outros', cor: '#6b7280' }
};

const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

document.addEventListener('DOMContentLoaded', () => {
    if (typeof checkAuth !== 'undefined') {
        checkAuth();
    }
    
    if (typeof atualizarSidebar !== 'undefined') {
        atualizarSidebar();
    }
    
    const hoje = new Date();
    document.getElementById('filtroMesAno').value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    
    carregarDados();
    
    document.getElementById('formEvento').addEventListener('submit', salvarEvento);
});

async function carregarDados() {
    try {
        await Promise.all([
            carregarConsultores(),
            carregarCategorias()
        ]);
        
        await carregarEventos();
        renderizarCalendario();
        atualizarResumo();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

async function carregarConsultores() {
    try {
        const response = await apiRequest('/api/consultores/?page_size=100');
        const data = await response.json();
        consultores = data.items || [];
        
        const selectFiltro = document.getElementById('filtroConsultor');
        const selectEvento = document.getElementById('eventoConsultor');
        
        selectFiltro.innerHTML = '<option value="">Todos os consultores</option>';
        selectEvento.innerHTML = '<option value="">Selecione o consultor...</option>';
        
        consultores.forEach(c => {
            const optFiltro = document.createElement('option');
            optFiltro.value = c.id;
            optFiltro.textContent = c.nome;
            selectFiltro.appendChild(optFiltro);
            
            const optEvento = document.createElement('option');
            optEvento.value = c.id;
            optEvento.textContent = c.nome;
            selectEvento.appendChild(optEvento);
        });
    } catch (error) {
        console.error('Erro ao carregar consultores:', error);
    }
}

async function carregarCategorias() {
    try {
        const response = await apiRequest('/api/cronograma/categorias');
        categorias = await response.json();
        
        const select = document.getElementById('filtroCategoria');
        select.innerHTML = '<option value="">Todas as categorias</option>';
        
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.codigo;
            option.textContent = `${cat.codigo} - ${cat.nome}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        categorias = Object.entries(CATEGORIA_CORES).map(([k, v]) => ({
            codigo: k,
            nome: v.nome,
            cor: v.cor
        }));
    }
}

async function carregarEventos() {
    try {
        const params = new URLSearchParams();
        
        const primeiroDia = new Date(anoAtual, mesAtual, 1);
        const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
        
        params.append('data_inicio', primeiroDia.toISOString().split('T')[0]);
        params.append('data_fim', ultimoDia.toISOString().split('T')[0]);
        
        const filtroConsultor = document.getElementById('filtroConsultor').value;
        const filtroCategoria = document.getElementById('filtroCategoria').value;
        
        if (filtroConsultor) params.append('consultor_id', filtroConsultor);
        if (filtroCategoria) params.append('categoria', filtroCategoria);
        
        const response = await apiRequest(`/api/cronograma/eventos?${params}`);
        eventos = await response.json();
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        eventos = [];
    }
}

function renderizarCalendario() {
    const container = document.getElementById('diasCalendario');
    document.getElementById('mesAnoAtual').textContent = `${MESES[mesAtual]} ${anoAtual}`;
    
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let html = '';
    
    for (let i = 0; i < diaSemanaInicio; i++) {
        html += '<div class="min-h-[120px] bg-dark-bg/30 rounded-lg"></div>';
    }
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataAtual = new Date(anoAtual, mesAtual, dia);
        const dataStr = dataAtual.toISOString().split('T')[0];
        
        const eventosDoDia = eventos.filter(e => e.data === dataStr);
        
        const isHoje = dataAtual.getTime() === hoje.getTime();
        const isDomingo = dataAtual.getDay() === 0;
        const isSabado = dataAtual.getDay() === 6;
        
        let classesDia = 'min-h-[120px] rounded-lg p-2 transition cursor-pointer hover:ring-2 hover:ring-blue-500/50 ';
        
        if (isHoje) {
            classesDia += 'bg-blue-900/40 ring-2 ring-blue-500 ';
        } else if (isDomingo) {
            classesDia += 'bg-red-900/20 ';
        } else if (isSabado) {
            classesDia += 'bg-blue-900/20 ';
        } else {
            classesDia += 'bg-dark-bg/50 hover:bg-dark-bg/70 ';
        }
        
        html += `<div class="${classesDia}" onclick="abrirDetalhesDia('${dataStr}', ${dia})">`;
        
        let classeDia = 'text-sm font-bold mb-2 ';
        if (isHoje) classeDia += 'text-blue-400';
        else if (isDomingo) classeDia += 'text-red-400';
        else if (isSabado) classeDia += 'text-blue-300';
        else classeDia += 'text-white';
        
        html += `<div class="${classeDia}">${dia}</div>`;
        
        if (eventosDoDia.length > 0) {
            html += '<div class="space-y-1">';
            
            eventosDoDia.slice(0, 4).forEach(evento => {
                const cor = CATEGORIA_CORES[evento.categoria]?.cor || '#6b7280';
                const titulo = evento.sigla_empresa ? 
                    `${evento.categoria}-${evento.sigla_empresa}` : 
                    evento.titulo || evento.categoria_nome;
                
                html += `
                    <div class="text-xs px-2 py-1 rounded truncate text-white font-medium" 
                         style="background-color: ${cor};"
                         title="${evento.consultor_nome}: ${titulo}">
                        ${titulo.substring(0, 12)}${titulo.length > 12 ? '...' : ''}
                    </div>
                `;
            });
            
            if (eventosDoDia.length > 4) {
                html += `<div class="text-xs text-gray-400 text-center">+${eventosDoDia.length - 4} mais</div>`;
            }
            
            html += '</div>';
        }
        
        html += '</div>';
    }
    
    const celulasRestantes = (7 - ((diaSemanaInicio + diasNoMes) % 7)) % 7;
    for (let i = 0; i < celulasRestantes; i++) {
        html += '<div class="min-h-[120px] bg-dark-bg/30 rounded-lg"></div>';
    }
    
    container.innerHTML = html;
}

function atualizarResumo() {
    document.getElementById('totalEventos').textContent = eventos.length;
    
    const contagem = {};
    eventos.forEach(e => {
        contagem[e.categoria] = (contagem[e.categoria] || 0) + 1;
    });
    
    const container = document.getElementById('resumoCategorias');
    let html = '';
    
    Object.entries(CATEGORIA_CORES).forEach(([codigo, info]) => {
        const qtd = contagem[codigo] || 0;
        if (qtd > 0) {
            html += `
                <div class="flex items-center justify-between p-2 rounded-lg" style="background-color: ${info.cor}20;">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style="background-color: ${info.cor};">${codigo}</div>
                        <span class="text-gray-300 text-sm">${info.nome}</span>
                    </div>
                    <span class="text-white font-bold">${qtd}</span>
                </div>
            `;
        }
    });
    
    container.innerHTML = html || '<p class="text-gray-500 text-sm col-span-2 text-center py-4">Nenhum evento neste mes</p>';
}

function abrirDetalhesDia(dataStr, dia) {
    dataSelecionada = dataStr;
    
    const dataObj = new Date(dataStr + 'T12:00:00');
    const diaSemana = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'][dataObj.getDay()];
    
    document.getElementById('modalDetalhesTitulo').innerHTML = `
        <i class="fas fa-calendar-day text-blue-400"></i>
        ${diaSemana}, ${dia} de ${MESES[mesAtual]} de ${anoAtual}
    `;
    
    const eventosDoDia = eventos.filter(e => e.data === dataStr);
    
    const container = document.getElementById('modalDetalhesConteudo');
    
    if (eventosDoDia.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-calendar-times text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Nenhum evento neste dia</p>
                <button onclick="abrirModalNovoEventoData()" class="mt-4 px-4 py-2 btn-primary text-white rounded-xl text-sm">
                    <i class="fas fa-plus mr-2"></i>Adicionar Evento
                </button>
            </div>
        `;
    } else {
        let html = '';
        
        const eventosPorConsultor = {};
        eventosDoDia.forEach(e => {
            if (!eventosPorConsultor[e.consultor_nome]) {
                eventosPorConsultor[e.consultor_nome] = [];
            }
            eventosPorConsultor[e.consultor_nome].push(e);
        });
        
        Object.entries(eventosPorConsultor).forEach(([consultor, evts]) => {
            html += `
                <div class="bg-dark-card/50 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="fas fa-user-tie text-blue-400"></i>
                        <span class="text-white font-medium">${consultor}</span>
                        <span class="text-gray-500 text-sm">(${evts.length} evento${evts.length > 1 ? 's' : ''})</span>
                    </div>
                    <div class="space-y-2">
            `;
            
            evts.forEach(evento => {
                const cor = CATEGORIA_CORES[evento.categoria]?.cor || '#6b7280';
                const titulo = evento.sigla_empresa ? 
                    `${evento.categoria}-${evento.sigla_empresa}` : 
                    evento.titulo || evento.categoria_nome;
                const periodo = evento.periodo === 'M' ? 'Manha' : evento.periodo === 'T' ? 'Tarde' : 'Dia todo';
                
                html += `
                    <div class="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50 hover:bg-dark-bg transition group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style="background-color: ${cor};">
                                ${evento.categoria}
                            </div>
                            <div>
                                <p class="text-white font-medium">${titulo}</p>
                                <p class="text-gray-500 text-xs">${evento.categoria_nome} - ${periodo}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onclick="editarEvento(${evento.id})" class="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 flex items-center justify-center transition">
                                <i class="fas fa-edit text-sm"></i>
                            </button>
                            <button onclick="confirmarExclusao(${evento.id})" class="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        container.innerHTML = html;
    }
    
    document.getElementById('modalDetalhesDia').classList.remove('hidden');
}

function fecharModalDetalhesDia() {
    document.getElementById('modalDetalhesDia').classList.add('hidden');
    dataSelecionada = null;
}

function abrirModalNovoEvento() {
    document.getElementById('modalEventoTitulo').innerHTML = '<i class="fas fa-calendar-plus text-blue-400"></i> Novo Evento';
    document.getElementById('formEvento').reset();
    document.getElementById('eventoId').value = '';
    document.getElementById('btnExcluirEvento').classList.add('hidden');
    
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('eventoData').value = hoje;
    
    document.getElementById('modalEvento').classList.remove('hidden');
}

function abrirModalNovoEventoData() {
    fecharModalDetalhesDia();
    
    document.getElementById('modalEventoTitulo').innerHTML = '<i class="fas fa-calendar-plus text-blue-400"></i> Novo Evento';
    document.getElementById('formEvento').reset();
    document.getElementById('eventoId').value = '';
    document.getElementById('btnExcluirEvento').classList.add('hidden');
    
    if (dataSelecionada) {
        document.getElementById('eventoData').value = dataSelecionada;
    }
    
    document.getElementById('modalEvento').classList.remove('hidden');
}

async function editarEvento(eventoId) {
    try {
        const response = await apiRequest(`/api/cronograma/eventos/${eventoId}`);
        const evento = await response.json();
        
        document.getElementById('modalEventoTitulo').innerHTML = '<i class="fas fa-calendar-edit text-blue-400"></i> Editar Evento';
        document.getElementById('eventoId').value = evento.id;
        document.getElementById('eventoData').value = evento.data;
        document.getElementById('eventoCategoria').value = evento.categoria;
        document.getElementById('eventoPeriodo').value = evento.periodo || 'D';
        document.getElementById('eventoConsultor').value = evento.consultor_id;
        document.getElementById('eventoSigla').value = evento.sigla_empresa || '';
        document.getElementById('eventoDescricao').value = evento.descricao || '';
        
        document.getElementById('btnExcluirEvento').classList.remove('hidden');
        
        fecharModalDetalhesDia();
        document.getElementById('modalEvento').classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao carregar evento:', error);
        alert('Erro ao carregar evento para edicao');
    }
}

function fecharModalEvento() {
    document.getElementById('modalEvento').classList.add('hidden');
}

async function salvarEvento(e) {
    e.preventDefault();
    
    const eventoId = document.getElementById('eventoId').value;
    const dados = {
        data: document.getElementById('eventoData').value,
        categoria: document.getElementById('eventoCategoria').value,
        periodo: document.getElementById('eventoPeriodo').value,
        consultor_id: parseInt(document.getElementById('eventoConsultor').value),
        sigla_empresa: document.getElementById('eventoSigla').value || null,
        descricao: document.getElementById('eventoDescricao').value || null
    };
    
    try {
        let response;
        if (eventoId) {
            response = await apiRequest(`/api/cronograma/eventos/${eventoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        } else {
            response = await apiRequest('/api/cronograma/eventos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        }
        
        if (response.ok) {
            fecharModalEvento();
            await carregarEventos();
            renderizarCalendario();
            atualizarResumo();
            
            if (dataSelecionada) {
                const dia = new Date(dataSelecionada + 'T12:00:00').getDate();
                abrirDetalhesDia(dataSelecionada, dia);
            }
        } else {
            const error = await response.json();
            alert(error.detail || 'Erro ao salvar evento');
        }
    } catch (error) {
        console.error('Erro ao salvar evento:', error);
        alert('Erro ao salvar evento');
    }
}

async function excluirEvento() {
    const eventoId = document.getElementById('eventoId').value;
    if (!eventoId) return;
    
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    
    try {
        const response = await apiRequest(`/api/cronograma/eventos/${eventoId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            fecharModalEvento();
            await carregarEventos();
            renderizarCalendario();
            atualizarResumo();
        } else {
            alert('Erro ao excluir evento');
        }
    } catch (error) {
        console.error('Erro ao excluir evento:', error);
        alert('Erro ao excluir evento');
    }
}

async function confirmarExclusao(eventoId) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    
    try {
        const response = await apiRequest(`/api/cronograma/eventos/${eventoId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await carregarEventos();
            renderizarCalendario();
            atualizarResumo();
            
            if (dataSelecionada) {
                const dia = new Date(dataSelecionada + 'T12:00:00').getDate();
                abrirDetalhesDia(dataSelecionada, dia);
            }
        } else {
            alert('Erro ao excluir evento');
        }
    } catch (error) {
        console.error('Erro ao excluir evento:', error);
        alert('Erro ao excluir evento');
    }
}

function mesAnterior() {
    mesAtual--;
    if (mesAtual < 0) {
        mesAtual = 11;
        anoAtual--;
    }
    document.getElementById('filtroMesAno').value = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}`;
    carregarEventos().then(() => {
        renderizarCalendario();
        atualizarResumo();
    });
}

function proximoMes() {
    mesAtual++;
    if (mesAtual > 11) {
        mesAtual = 0;
        anoAtual++;
    }
    document.getElementById('filtroMesAno').value = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}`;
    carregarEventos().then(() => {
        renderizarCalendario();
        atualizarResumo();
    });
}

function irParaHoje() {
    const hoje = new Date();
    mesAtual = hoje.getMonth();
    anoAtual = hoje.getFullYear();
    document.getElementById('filtroMesAno').value = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}`;
    carregarEventos().then(() => {
        renderizarCalendario();
        atualizarResumo();
    });
}

async function aplicarFiltros() {
    const mesAno = document.getElementById('filtroMesAno').value;
    if (mesAno) {
        const [ano, mes] = mesAno.split('-').map(Number);
        anoAtual = ano;
        mesAtual = mes - 1;
    }
    
    await carregarEventos();
    renderizarCalendario();
    atualizarResumo();
}

function limparFiltros() {
    document.getElementById('filtroConsultor').value = '';
    document.getElementById('filtroCategoria').value = '';
    
    const hoje = new Date();
    mesAtual = hoje.getMonth();
    anoAtual = hoje.getFullYear();
    document.getElementById('filtroMesAno').value = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}`;
    
    aplicarFiltros();
}

function filtrarPorCategoria(categoria) {
    document.getElementById('filtroCategoria').value = categoria;
    aplicarFiltros();
}
