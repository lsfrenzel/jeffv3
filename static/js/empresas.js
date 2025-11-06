checkAuth();

const usuario = getUsuario();
document.getElementById('userInfo').textContent = `${usuario.nome} (${usuario.tipo})`;

if (usuario.tipo !== 'admin') {
    document.getElementById('btnNovaEmpresa').style.display = 'none';
    document.getElementById('btnUploadExcel').style.display = 'none';
}

async function carregarEmpresas(filtros = {}) {
    try {
        let url = '/api/empresas/?';
        if (filtros.nome) url += `nome=${filtros.nome}&`;
        if (filtros.cnpj) url += `cnpj=${filtros.cnpj}&`;
        if (filtros.municipio) url += `municipio=${filtros.municipio}&`;
        if (filtros.er) url += `er=${filtros.er}&`;
        
        const response = await apiRequest(url);
        const empresas = await response.json();
        
        const tbody = document.getElementById('tabelaEmpresas');
        
        if (empresas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">Nenhuma empresa encontrada</td></tr>';
            return;
        }
        
        tbody.innerHTML = empresas.map(emp => `
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
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
    }
}

function aplicarFiltros() {
    const filtros = {
        nome: document.getElementById('filtroNome').value,
        cnpj: document.getElementById('filtroCNPJ').value,
        municipio: document.getElementById('filtroMunicipio').value,
        er: document.getElementById('filtroER').value
    };
    carregarEmpresas(filtros);
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
            alert('Empresa cadastrada com sucesso!');
            hideNovaEmpresaModal();
            carregarEmpresas();
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
