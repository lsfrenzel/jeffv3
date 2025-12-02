let formularios = [];
let envios = [];
let empresas = [];
let perguntaCount = 0;

document.addEventListener('DOMContentLoaded', function() {
    carregarFormularios();
    carregarEnvios();
    carregarEmpresas();
});

async function carregarFormularios() {
    try {
        const response = await fetch('/api/formularios/', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            formularios = await response.json();
            renderizarFormularios();
            atualizarEstatisticas();
        }
    } catch (error) {
        console.error('Erro ao carregar formulários:', error);
    }
}

async function carregarEnvios() {
    try {
        const response = await fetch('/api/formularios/envios/', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            envios = await response.json();
            renderizarEnvios();
            renderizarRespostas();
        }
    } catch (error) {
        console.error('Erro ao carregar envios:', error);
    }
}

async function carregarEmpresas() {
    try {
        const response = await fetch('/api/empresas/', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            empresas = await response.json();
            const select = document.getElementById('empresaDestinatario');
            select.innerHTML = '<option value="">Selecione uma empresa</option>';
            empresas.forEach(emp => {
                select.innerHTML += `<option value="${emp.id}">${emp.razao_social}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
    }
}

function renderizarFormularios() {
    const lista = document.getElementById('listaFormularios');
    
    if (formularios.length === 0) {
        lista.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-file-alt fa-2x mb-2"></i>
                    <p>Nenhum formulário cadastrado</p>
                    <button class="btn btn-primary btn-sm" onclick="criarFormularioLideranca()">
                        Criar Formulário Padrão
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    lista.innerHTML = formularios.map(form => `
        <tr>
            <td>
                <strong>${form.titulo}</strong>
                ${form.descricao ? `<br><small class="text-muted">${form.descricao}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-${form.tipo === 'padrao' ? 'primary' : 'info'}">
                    ${form.tipo === 'padrao' ? 'Padrão' : 'Personalizado'}
                </span>
            </td>
            <td>${form.total_perguntas}</td>
            <td>${form.total_envios}</td>
            <td>${form.total_respostas}</td>
            <td>
                <span class="badge bg-${form.ativo ? 'success' : 'secondary'}">
                    ${form.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="verFormulario(${form.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="abrirModalEnviar(${form.id})" title="Enviar">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="verEstatisticas(${form.id})" title="Estatísticas">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="excluirFormulario(${form.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderizarEnvios() {
    const lista = document.getElementById('listaEnvios');
    const enviosPendentes = envios.filter(e => !e.respondido);
    
    if (enviosPendentes.length === 0) {
        lista.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>Nenhum envio pendente</p>
                </td>
            </tr>
        `;
        return;
    }
    
    lista.innerHTML = enviosPendentes.map(envio => `
        <tr>
            <td>${envio.formulario?.titulo || '-'}</td>
            <td>${envio.nome_destinatario || envio.email_destinatario || '-'}</td>
            <td>${envio.empresa_nome || '-'}</td>
            <td>${formatarData(envio.data_envio)}</td>
            <td>
                <span class="badge bg-warning">Aguardando Resposta</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="copiarLinkEnvio('${envio.codigo_unico}')" title="Copiar Link">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderizarRespostas() {
    const lista = document.getElementById('listaRespostas');
    const enviosRespondidos = envios.filter(e => e.respondido);
    
    if (enviosRespondidos.length === 0) {
        lista.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>Nenhuma resposta recebida</p>
                </td>
            </tr>
        `;
        return;
    }
    
    lista.innerHTML = enviosRespondidos.map(envio => `
        <tr>
            <td>${envio.formulario?.titulo || '-'}</td>
            <td>${envio.nome_destinatario || envio.email_destinatario || '-'}</td>
            <td>${envio.empresa_nome || '-'}</td>
            <td>${formatarData(envio.data_resposta)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="verRespostas(${envio.id})">
                    <i class="fas fa-eye me-1"></i> Ver Respostas
                </button>
            </td>
        </tr>
    `).join('');
}

function atualizarEstatisticas() {
    document.getElementById('totalFormularios').textContent = formularios.length;
    
    const totalEnviados = formularios.reduce((acc, f) => acc + f.total_envios, 0);
    const totalRespondidos = formularios.reduce((acc, f) => acc + f.total_respostas, 0);
    
    document.getElementById('totalEnviados').textContent = totalEnviados;
    document.getElementById('totalRespondidos').textContent = totalRespondidos;
    
    const taxa = totalEnviados > 0 ? Math.round((totalRespondidos / totalEnviados) * 100) : 0;
    document.getElementById('taxaResposta').textContent = taxa + '%';
}

async function criarFormularioLideranca() {
    try {
        const response = await fetch('/api/formularios/seed-lideranca', {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            carregarFormularios();
        } else {
            const error = await response.json();
            alert(error.detail || 'Erro ao criar formulário');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão');
    }
}

function adicionarPergunta() {
    perguntaCount++;
    const container = document.getElementById('listaPerguntas');
    
    const html = `
        <div class="pergunta-item" id="pergunta-${perguntaCount}">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <strong>Pergunta ${perguntaCount}</strong>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removerPergunta(${perguntaCount})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mb-2">
                <input type="text" class="form-control" placeholder="Texto da pergunta" 
                       id="pergunta-texto-${perguntaCount}" required>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <select class="form-select" id="pergunta-tipo-${perguntaCount}" onchange="toggleOpcoes(${perguntaCount})">
                        <option value="escala">Escala (1-5)</option>
                        <option value="texto">Texto livre</option>
                        <option value="multipla_escolha">Múltipla escolha</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <input type="text" class="form-control" placeholder="Categoria (opcional)" 
                           id="pergunta-categoria-${perguntaCount}">
                </div>
            </div>
            <div id="opcoes-container-${perguntaCount}" class="mt-2">
                <div id="opcoes-${perguntaCount}"></div>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="adicionarOpcaoEscala(${perguntaCount})">
                    <i class="fas fa-plus me-1"></i> Usar Escala Padrão
                </button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
}

function removerPergunta(id) {
    document.getElementById(`pergunta-${id}`).remove();
}

function toggleOpcoes(perguntaId) {
    const tipo = document.getElementById(`pergunta-tipo-${perguntaId}`).value;
    const container = document.getElementById(`opcoes-container-${perguntaId}`);
    
    if (tipo === 'texto') {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
    }
}

function adicionarOpcaoEscala(perguntaId) {
    const container = document.getElementById(`opcoes-${perguntaId}`);
    container.innerHTML = `
        <div class="opcao-item"><small>1 - Nunca</small></div>
        <div class="opcao-item"><small>2 - Raramente</small></div>
        <div class="opcao-item"><small>3 - Ocasionalmente</small></div>
        <div class="opcao-item"><small>4 - Frequente</small></div>
        <div class="opcao-item"><small>5 - Muito frequente</small></div>
    `;
}

async function salvarFormulario() {
    const titulo = document.getElementById('tituloFormulario').value;
    const descricao = document.getElementById('descricaoFormulario').value;
    
    if (!titulo) {
        alert('Por favor, informe o título do formulário');
        return;
    }
    
    const perguntas = [];
    const perguntasElements = document.querySelectorAll('[id^="pergunta-texto-"]');
    
    perguntasElements.forEach((el, index) => {
        const id = el.id.replace('pergunta-texto-', '');
        const texto = el.value;
        const tipo = document.getElementById(`pergunta-tipo-${id}`).value;
        const categoria = document.getElementById(`pergunta-categoria-${id}`).value;
        
        if (texto) {
            const pergunta = {
                texto,
                tipo,
                categoria: categoria || null,
                ordem: index,
                opcoes: []
            };
            
            if (tipo === 'escala') {
                pergunta.opcoes = [
                    { texto: '1 - Nunca', descricao: 'O comportamento nunca é observado', valor: 1 },
                    { texto: '2 - Raramente', descricao: 'Observado em pouquíssimas ocasiões', valor: 2 },
                    { texto: '3 - Ocasionalmente', descricao: 'Não é consistente ou rotineiro', valor: 3 },
                    { texto: '4 - Frequente', descricao: 'Prática comum', valor: 4 },
                    { texto: '5 - Muito frequente', descricao: 'Prática constante e estabelecida', valor: 5 }
                ];
            }
            
            perguntas.push(pergunta);
        }
    });
    
    try {
        const response = await fetch('/api/formularios/', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo,
                descricao,
                tipo: 'personalizado',
                ativo: true,
                perguntas
            })
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalNovoFormulario')).hide();
            document.getElementById('formNovoFormulario').reset();
            document.getElementById('listaPerguntas').innerHTML = '';
            perguntaCount = 0;
            carregarFormularios();
            alert('Formulário criado com sucesso!');
        } else {
            const error = await response.json();
            alert(error.detail || 'Erro ao criar formulário');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão');
    }
}

function abrirModalEnviar(formularioId) {
    document.getElementById('enviarFormularioId').value = formularioId;
    document.getElementById('nomeDestinatario').value = '';
    document.getElementById('emailDestinatario').value = '';
    document.getElementById('empresaDestinatario').value = '';
    new bootstrap.Modal(document.getElementById('modalEnviar')).show();
}

async function enviarFormulario() {
    const formularioId = document.getElementById('enviarFormularioId').value;
    const nome = document.getElementById('nomeDestinatario').value;
    const email = document.getElementById('emailDestinatario').value;
    const empresaId = document.getElementById('empresaDestinatario').value;
    
    try {
        const response = await fetch('/api/formularios/enviar', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                formulario_id: parseInt(formularioId),
                nome_destinatario: nome || null,
                email_destinatario: email || null,
                empresa_id: empresaId ? parseInt(empresaId) : null
            })
        });
        
        if (response.ok) {
            const envio = await response.json();
            bootstrap.Modal.getInstance(document.getElementById('modalEnviar')).hide();
            
            const baseUrl = window.location.origin;
            const link = `${baseUrl}/formulario/responder/${envio.codigo_unico}`;
            document.getElementById('linkFormulario').value = link;
            new bootstrap.Modal(document.getElementById('modalLink')).show();
            
            carregarEnvios();
            carregarFormularios();
        } else {
            const error = await response.json();
            alert(error.detail || 'Erro ao gerar link');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão');
    }
}

function copiarLink() {
    const input = document.getElementById('linkFormulario');
    input.select();
    document.execCommand('copy');
    alert('Link copiado!');
}

function copiarLinkEnvio(codigo) {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/formulario/responder/${codigo}`;
    navigator.clipboard.writeText(link).then(() => {
        alert('Link copiado!');
    });
}

async function verFormulario(formularioId) {
    try {
        const response = await fetch(`/api/formularios/${formularioId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const form = await response.json();
            
            let html = `
                <h4>${form.titulo}</h4>
                ${form.descricao ? `<p class="text-muted">${form.descricao}</p>` : ''}
                <hr>
            `;
            
            let currentCategoria = '';
            form.perguntas.forEach((pergunta, index) => {
                if (pergunta.categoria && pergunta.categoria !== currentCategoria) {
                    currentCategoria = pergunta.categoria;
                    html += `
                        <div class="resposta-categoria mt-4">
                            <strong>${currentCategoria}</strong>
                            ${pergunta.descricao_categoria ? `<br><small>${pergunta.descricao_categoria}</small>` : ''}
                        </div>
                    `;
                }
                
                html += `
                    <div class="resposta-item">
                        <strong>${pergunta.texto}</strong>
                        <div class="mt-2">
                            ${pergunta.opcoes.map(o => `
                                <span class="badge bg-secondary me-1">${o.texto}</span>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
            
            document.getElementById('conteudoFormulario').innerHTML = html;
            new bootstrap.Modal(document.getElementById('modalVerFormulario')).show();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function verRespostas(envioId) {
    try {
        const response = await fetch(`/api/formularios/envios/${envioId}/respostas`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const dados = await response.json();
            
            let html = `
                <div class="mb-4">
                    <h5>${dados.formulario_titulo}</h5>
                    <p class="text-muted">
                        <strong>Respondido por:</strong> ${dados.nome_destinatario || dados.email_destinatario || 'Anônimo'}
                        ${dados.empresa_nome ? `<br><strong>Empresa:</strong> ${dados.empresa_nome}` : ''}
                        <br><strong>Data:</strong> ${formatarData(dados.data_resposta)}
                    </p>
                </div>
                <hr>
            `;
            
            let currentCategoria = '';
            dados.respostas.forEach(resp => {
                if (resp.categoria && resp.categoria !== currentCategoria) {
                    currentCategoria = resp.categoria;
                    html += `
                        <div class="resposta-categoria mt-4">
                            <strong>${currentCategoria}</strong>
                        </div>
                    `;
                }
                
                html += `
                    <div class="resposta-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <strong>${resp.pergunta_texto}</strong>
                            ${resp.valor_numerico !== null ? `
                                <span class="badge bg-primary fs-5">${resp.valor_numerico}</span>
                            ` : ''}
                        </div>
                        ${resp.opcao_texto ? `<small class="text-muted">${resp.opcao_texto}</small>` : ''}
                        ${resp.valor_texto ? `<p class="mt-2 mb-0">${resp.valor_texto}</p>` : ''}
                    </div>
                `;
            });
            
            document.getElementById('conteudoRespostas').innerHTML = html;
            new bootstrap.Modal(document.getElementById('modalVerRespostas')).show();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function verEstatisticas(formularioId) {
    try {
        const response = await fetch(`/api/formularios/${formularioId}/estatisticas`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            let html = `
                <h5>${stats.titulo}</h5>
                <div class="row mt-3">
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center">
                                <h3>${stats.total_envios}</h3>
                                <small>Envios</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center">
                                <h3>${stats.total_respostas}</h3>
                                <small>Respostas</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center">
                                <h3>${stats.taxa_resposta}%</h3>
                                <small>Taxa de Resposta</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            if (stats.media_por_pergunta && Object.keys(stats.media_por_pergunta).length > 0) {
                html += `
                    <h6 class="mt-4">Média por Pergunta</h6>
                    <div class="list-group">
                `;
                
                Object.values(stats.media_por_pergunta).forEach(item => {
                    const porcentagem = (item.media / 5) * 100;
                    html += `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small>${item.texto}</small>
                                <strong>${item.media}</strong>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar" style="width: ${porcentagem}%"></div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            document.getElementById('conteudoRespostas').innerHTML = html;
            new bootstrap.Modal(document.getElementById('modalVerRespostas')).show();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function excluirFormulario(formularioId) {
    if (!confirm('Tem certeza que deseja excluir este formulário? Todos os envios e respostas serão perdidos.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/formularios/${formularioId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            carregarFormularios();
            carregarEnvios();
            alert('Formulário excluído com sucesso');
        } else {
            const error = await response.json();
            alert(error.detail || 'Erro ao excluir formulário');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão');
    }
}

function formatarData(dataStr) {
    if (!dataStr) return '-';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`
    };
}
