checkAuth();

const usuario = getUsuario();
document.getElementById('userInfo').textContent = `${usuario.nome} (${usuario.tipo})`;

if (usuario.tipo !== 'admin') {
    document.getElementById('btnNovaEmpresa').style.display = 'none';
    document.getElementById('btnUploadExcel').style.display = 'none';
}

let paginaAtual = 1;
const itensPorPagina = 20;
let filtrosAtuais = {};

async function carregarEmpresas(filtros = {}, pagina = 1) {
    try {
        paginaAtual = pagina;
        filtrosAtuais = filtros;
        
        let url = `/api/empresas/?page=${pagina}&page_size=${itensPorPagina}`;
        if (filtros.nome) url += `&nome=${filtros.nome}`;
        if (filtros.cnpj) url += `&cnpj=${filtros.cnpj}`;
        if (filtros.municipio) url += `&municipio=${filtros.municipio}`;
        if (filtros.er) url += `&er=${filtros.er}`;
        if (filtros.carteira) url += `&carteira=${filtros.carteira}`;
        
        const response = await apiRequest(url);
        const data = await response.json();
        
        const tbody = document.getElementById('tabelaEmpresas');
        
        if (!data.items || data.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">Nenhuma empresa encontrada</td></tr>';
            atualizarPaginacao({total_count: 0, page: 1, page_size: itensPorPagina, total_pages: 0});
            return;
        }
        
        tbody.innerHTML = data.items.map(emp => `
            <tr class="hover:bg-dark-hover cursor-pointer" onclick="window.location.href='/empresa/${emp.id}'">
                <td class="px-6 py-4 text-gray-300">${emp.empresa}</td>
                <td class="px-6 py-4 text-gray-300">${emp.cnpj || '-'}</td>
                <td class="px-6 py-4 text-gray-300">${emp.municipio || '-'}</td>
                <td class="px-6 py-4 text-gray-300">${emp.er || '-'}</td>
                <td class="px-6 py-4 text-gray-300">${emp.carteira || '-'}</td>
                <td class="px-6 py-4">
                    <button onclick="event.stopPropagation(); window.location.href='/empresa/${emp.id}'" 
                        class="text-blue-400 hover:text-blue-300">Ver Detalhes</button>
                </td>
            </tr>
        `).join('');
        
        atualizarPaginacao(data);
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
        document.getElementById('tabelaEmpresas').innerHTML = 
            '<tr><td colspan="6" class="px-6 py-8 text-center text-red-400">Erro ao carregar empresas</td></tr>';
    }
}

function atualizarPaginacao(data) {
    const info = document.getElementById('paginacaoInfo');
    const controles = document.getElementById('paginacaoControles');
    
    if (!info || !controles) return;
    
    if (data.total_count === 0) {
        info.textContent = 'Nenhuma empresa encontrada';
        controles.innerHTML = '';
        return;
    }
    
    const inicio = (data.page - 1) * data.page_size + 1;
    const fim = Math.min(data.page * data.page_size, data.total_count);
    
    info.textContent = `Mostrando ${inicio} a ${fim} de ${data.total_count} empresas`;
    
    let botoesHTML = '';
    
    if (data.page > 1) {
        botoesHTML += `<button onclick="carregarEmpresas(filtrosAtuais, 1)" class="px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-dark-hover">Primeira</button>`;
        botoesHTML += `<button onclick="carregarEmpresas(filtrosAtuais, ${data.page - 1})" class="px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-dark-hover">Anterior</button>`;
    }
    
    const maxBotoes = 5;
    let inicioPagina = Math.max(1, data.page - Math.floor(maxBotoes / 2));
    let fimPagina = Math.min(data.total_pages, inicioPagina + maxBotoes - 1);
    
    if (fimPagina - inicioPagina < maxBotoes - 1) {
        inicioPagina = Math.max(1, fimPagina - maxBotoes + 1);
    }
    
    for (let i = inicioPagina; i <= fimPagina; i++) {
        if (i === data.page) {
            botoesHTML += `<button class="px-3 py-1 bg-blue-600 text-white rounded">${i}</button>`;
        } else {
            botoesHTML += `<button onclick="carregarEmpresas(filtrosAtuais, ${i})" class="px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-dark-hover">${i}</button>`;
        }
    }
    
    if (data.page < data.total_pages) {
        botoesHTML += `<button onclick="carregarEmpresas(filtrosAtuais, ${data.page + 1})" class="px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-dark-hover">Próxima</button>`;
        botoesHTML += `<button onclick="carregarEmpresas(filtrosAtuais, ${data.total_pages})" class="px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-dark-hover">Última</button>`;
    }
    
    controles.innerHTML = botoesHTML;
}

function aplicarFiltros() {
    const filtros = {
        nome: document.getElementById('filtroNome').value,
        cnpj: document.getElementById('filtroCNPJ').value,
        municipio: document.getElementById('filtroMunicipio').value,
        er: document.getElementById('filtroER').value,
        carteira: document.getElementById('filtroCarteira').value
    };
    carregarEmpresas(filtros, 1);
}

function limparFiltros() {
    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroCNPJ').value = '';
    document.getElementById('filtroMunicipio').value = '';
    document.getElementById('filtroER').value = '';
    document.getElementById('filtroCarteira').value = '';
    carregarEmpresas({}, 1);
}

function showNovaEmpresaModal() {
    document.getElementById('novaEmpresaModal').classList.remove('hidden');
}

function hideNovaEmpresaModal() {
    document.getElementById('novaEmpresaModal').classList.add('hidden');
    document.getElementById('novaEmpresaForm').reset();
}

document.getElementById('novaEmpresaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const empresa = {
        empresa: document.getElementById('empresa').value,
        cnpj: document.getElementById('cnpj').value || null,
        sigla: document.getElementById('sigla').value || null,
        porte: document.getElementById('porte').value || null,
        er: document.getElementById('er').value || null,
        carteira: document.getElementById('carteira').value || null,
        endereco: document.getElementById('endereco').value || null,
        bairro: document.getElementById('bairro').value || null,
        municipio: document.getElementById('municipio').value || null,
        estado: document.getElementById('estado').value || null,
        numero_funcionarios: document.getElementById('numero_funcionarios').value ? parseInt(document.getElementById('numero_funcionarios').value) : null,
        observacao: document.getElementById('observacao').value || null
    };
    
    try {
        const response = await apiRequest('/api/empresas/', {
            method: 'POST',
            body: JSON.stringify(empresa)
        });
        
        if (response.ok) {
            const empresaCriada = await response.json();
            alert('Empresa cadastrada com sucesso! Redirecionando para adicionar informações de contato...');
            hideNovaEmpresaModal();
            window.location.href = `/empresa/${empresaCriada.id}`;
        } else {
            const error = await response.json();
            alert(error.detail || 'Erro ao cadastrar empresa');
        }
    } catch (error) {
        alert('Erro de conexão com o servidor');
    }
});

function showUploadExcelModal() {
    document.getElementById('uploadExcelModal').classList.remove('hidden');
}

function hideUploadExcelModal() {
    document.getElementById('uploadExcelModal').classList.add('hidden');
    document.getElementById('uploadExcelForm').reset();
    document.getElementById('uploadResult').classList.add('hidden');
}

document.getElementById('uploadExcelForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Selecione um arquivo');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/empresas/upload-excel', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.detail || 'Erro no upload');
        
        const resultDiv = document.getElementById('uploadResult');
        resultDiv.className = 'bg-green-900/30 border border-green-500 text-green-300 p-4 rounded';
        resultDiv.innerHTML = `
            <p class="font-semibold mb-2">${result.message}</p>
            <ul class="text-sm space-y-1">
                <li>Empresas criadas: ${result.empresas_criadas}</li>
                <li>Empresas ignoradas (já existentes): ${result.empresas_ignoradas}</li>
                <li>Total processado: ${result.total_processadas}</li>
            </ul>
        `;
        resultDiv.classList.remove('hidden');
        
        setTimeout(() => {
            hideUploadExcelModal();
            carregarEmpresas();
        }, 3000);
    } catch (error) {
        console.error('Erro no upload:', error);
        const resultDiv = document.getElementById('uploadResult');
        resultDiv.className = 'bg-red-900/30 border border-red-500 text-red-300 p-4 rounded';
        resultDiv.textContent = `Erro: ${error.message}`;
        resultDiv.classList.remove('hidden');
    }
});

carregarEmpresas();
