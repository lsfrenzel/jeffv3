checkAuth();

const usuario = getUsuario();
document.getElementById('userInfo').textContent = `${usuario.nome} (${usuario.tipo})`;

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

async function carregarProspeccoes() {
    try {
        const response = await apiRequest('/api/prospeccoes/');
        const prospeccoes = await response.json();
        
        mostrarProspeccoesCards(prospeccoes);
    } catch (error) {
        console.error('Erro ao carregar prospecções:', error);
        document.getElementById('prospeccoesCards').innerHTML = '<div class="col-span-full text-center py-8 text-red-400">Erro ao carregar prospecções</div>';
    }
}

function mostrarProspeccoesCards(prospeccoes) {
    const container = document.getElementById('prospeccoesCards');
    
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
        
        html += `
            <div class="bg-dark-sidebar rounded-lg shadow-lg overflow-hidden border-l-4 ${resultadoClass} hover:shadow-xl transition">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white mb-1">${prosp.empresa.empresa}</h3>
                            <p class="text-gray-400 text-sm">${prosp.empresa.municipio || 'N/A'} - ${prosp.empresa.estado || 'N/A'}</p>
                        </div>
                        <button onclick="exportarPDF(${prosp.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition">
                            📄 PDF
                        </button>
                    </div>
                    
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center text-sm">
                            <span class="text-gray-400 w-24">Consultor:</span>
                            <span class="text-white">${prosp.consultor.nome}</span>
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

function showNovaProspeccaoModal() {
    carregarEmpresas();
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
}

async function carregarEmpresas() {
    try {
        const response = await apiRequest('/api/empresas/?limit=1000');
        const empresas = await response.json();
        
        const select = document.getElementById('empresa_id');
        select.innerHTML = '<option value="">Selecione uma empresa...</option>';
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = `${empresa.empresa} - ${empresa.municipio || 'N/A'}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
    }
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
    
    const consultorId = usuario.tipo === 'admin' ? 
        parseInt(document.getElementById('consultor_id').value) : 
        usuario.id;
    
    const agendarProxima = document.getElementById('agendar_proxima').checked;
    const dataProxima = document.getElementById('data_proxima_ligacao').value;
    
    if (agendarProxima && !dataProxima) {
        alert('Por favor, selecione a data da próxima ligação');
        return;
    }
    
    const prospeccaoData = {
        empresa_id: parseInt(document.getElementById('empresa_id').value),
        consultor_id: consultorId,
        data_ligacao: document.getElementById('data_ligacao').value || null,
        hora_ligacao: document.getElementById('hora_ligacao').value || null,
        resultado: document.getElementById('resultado').value || null,
        observacoes: document.getElementById('observacoes').value || null,
        
        nome_contato: document.getElementById('nome_contato').value || null,
        telefone_contato: document.getElementById('telefone_contato').value || null,
        email_contato: document.getElementById('email_contato').value || null,
        cargo_contato: document.getElementById('cargo_contato').value || null,
        
        interesse_treinamento: document.getElementById('interesse_treinamento').checked,
        interesse_consultoria: document.getElementById('interesse_consultoria').checked,
        interesse_certificacao: document.getElementById('interesse_certificacao').checked,
        interesse_eventos: document.getElementById('interesse_eventos').checked,
        interesse_produtos: document.getElementById('interesse_produtos').checked,
        interesse_seguranca: document.getElementById('interesse_seguranca').checked,
        interesse_meio_ambiente: document.getElementById('interesse_meio_ambiente').checked,
        outros_interesses: document.getElementById('outros_interesses').value || null,
        
        potencial_negocio: document.getElementById('potencial_negocio').value || null,
        status_follow_up: document.getElementById('status_follow_up').value || null
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
