# Núcleo 1.03 - Sistema de Gestão e Prospecção de Empresas

## Visão Geral
Sistema web completo desenvolvido em Python com FastAPI para gestão e prospecção de empresas. Permite cadastro de empresas, controle de prospecções, acompanhamento de agendamentos e histórico de ligações.

## Arquitetura

### Backend
- **Framework**: FastAPI
- **Banco de Dados**: PostgreSQL
- **ORM**: SQLAlchemy
- **Autenticação**: JWT (JSON Web Token)
- **Validação**: Pydantic

### Frontend
- **Templates**: Jinja2
- **Estilização**: TailwindCSS (CDN)
- **JavaScript**: Vanilla JS com Fetch API
- **Tema**: Escuro profissional

## Estrutura do Projeto

```
.
├── backend/
│   ├── models/          # Modelos SQLAlchemy
│   │   ├── usuarios.py
│   │   ├── empresas.py
│   │   ├── prospeccoes.py
│   │   └── agendamentos.py
│   ├── routers/         # Rotas da API
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── empresas.py
│   │   ├── prospeccoes.py
│   │   └── agendamentos.py
│   ├── utils/          # Utilitários
│   │   └── seed.py     # Criação do admin padrão
│   ├── schemas/         # Schemas Pydantic
│   │   ├── usuarios.py
│   │   ├── empresas.py
│   │   ├── prospeccoes.py
│   │   └── agendamentos.py
│   ├── auth/           # Segurança e autenticação
│   │   └── security.py
│   └── database.py     # Configuração do banco
├── templates/          # Templates HTML
│   ├── base.html
│   ├── login.html
│   ├── dashboard.html
│   ├── admin_usuarios.html
│   ├── empresas.html
│   ├── empresa_perfil.html
│   ├── prospeccao.html
│   └── alertas.html
├── static/            # Arquivos estáticos
│   ├── css/
│   └── js/
│       ├── auth.js
│       ├── login.js
│       ├── dashboard.js
│       ├── admin_usuarios.js
│       ├── empresas.js
│       ├── empresa_perfil.js
│       ├── prospeccao.js
│       └── alertas.js
└── main.py           # Arquivo principal da aplicação
```

## Funcionalidades Implementadas

### 1. Autenticação e Usuários (Admin-Only)
- ✅ Sistema de autenticação admin-only (sem registro público)
- ✅ Usuário admin padrão criado automaticamente (admin@admin.com / admin123)
- ✅ Dois tipos de usuário: Admin e Consultor
- ✅ Apenas admins podem criar novos usuários
- ✅ Interface de administração para gerenciar usuários
- ✅ Sessão persistente com JWT
- ✅ Logout seguro
- ✅ Controle de acesso baseado em permissões

### 2. Cadastro de Empresas
- ✅ Campos completos: empresa, CNPJ, sigla, porte, ER, carteira, endereço, etc.
- ✅ Listagem com filtros (nome, CNPJ, município, ER, carteira)
- ✅ Página de perfil com dados completos
- ✅ Histórico de prospecções por empresa
- ✅ Apenas Admin pode cadastrar empresas
- ✅ **Upload de planilha Excel para cadastro em massa (novembro 2025)**
- ✅ **Atribuição de empresas a consultores via interface admin (novembro 2025)**

### 3. Módulo de Prospecção
- ✅ Admin pode criar prospecções e atribuir a consultores
- ✅ Consultor pode registrar ligações
- ✅ **Autocomplete de empresas (novembro 2025)**:
  - Busca em tempo real ao digitar o nome da empresa
  - Sugestões aparecem automaticamente (mínimo 2 caracteres)
  - Proteção contra XSS e validação obrigatória
  - Debounce de 300ms para otimização
- ✅ **Checklist enriquecido com campos detalhados (novembro 2025)**:
  - Dados do contato: nome, telefone, email, cargo (opcionais)
  - Potencial de negócio (alto/médio/baixo)
  - Status de follow-up
- ✅ **Agendamento de próxima ligação (novembro 2025)**:
  - Checkbox para agendar automaticamente
  - Seletor de data com calendário
  - Data padrão sugerida: hoje + 7 dias
- ✅ Campos: data, hora, resultado, observações
- ✅ Vinculação com empresa e consultor
- ✅ Histórico completo de prospecções
- ✅ Agendamentos salvos e visíveis no perfil da empresa

### 4. Módulo de Agendamentos
- ✅ Criação de agendamentos vinculados a prospecções
- ✅ Status: pendente, realizado, vencido
- ✅ Consultor vê apenas seus agendamentos
- ✅ Admin visualiza todos os agendamentos

### 5. Módulo de Alertas
- ✅ Categorização por cores:
  - Vermelho: Agendamentos vencidos
  - Amarelo: Agendamentos de hoje
  - Verde: Agendamentos futuros
- ✅ Atualização automática
- ✅ Filtro por permissão de usuário

### 6. Interface
- ✅ Tema escuro em todas as telas
- ✅ Layout profissional com sidebar fixa
- ✅ Cabeçalho com nome do usuário e botão de logout
- ✅ Responsivo e otimizado
- ✅ Navegação intuitiva

## Como Usar

### 1. Primeiro Acesso
1. Acesse o sistema em http://localhost:5000
2. Faça login com o usuário admin padrão:
   - **Email**: admin@admin.com
   - **Senha**: admin123
3. **IMPORTANTE**: Altere a senha do admin após o primeiro acesso (recomendado)
4. Para criar novos usuários, acesse o menu "Administração" (disponível apenas para admins)

### 2. Gerenciar Usuários (Admin)
1. No menu lateral, clique em "Administração"
2. Clique em "+ Novo Usuário"
3. Preencha os dados: nome, email, senha e tipo (Admin ou Consultor)
4. Clique em "Criar Usuário"
5. Você também pode alterar o tipo de usuário ou deletar usuários existentes

### 3. Cadastrar Empresas (Admin)
1. No menu lateral, clique em "Empresas"
2. Clique em "+ Nova Empresa"
3. Preencha os dados da empresa
4. Clique em "Salvar Empresa"

### 4. Criar Prospecção
1. No menu lateral, clique em "Prospecções"
2. Clique em "+ Nova Prospecção"
3. **Digite o nome da empresa** - sugestões aparecem automaticamente
4. **Clique na empresa** desejada para selecionar
5. Selecione o consultor (se você for Admin)
6. Preencha os dados da prospecção:
   - Data e hora da ligação
   - Resultado da ligação
   - Dados de contato (opcionais): nome, telefone, email, cargo
   - Potencial de negócio e status de follow-up
   - Observações
7. (Opcional) Marque "Agendar próxima ligação" e escolha a data
8. Clique em "Salvar Prospecção"

### 5. Criar Agendamento
1. Na lista de prospecções, clique em "Agendar"
2. Digite a data e hora do agendamento
3. Adicione observações (opcional)

### 6. Visualizar Alertas
1. No menu lateral, clique em "Alertas"
2. Veja os agendamentos categorizados por cores
3. Marque como "realizado" quando completar

## API Endpoints

### Autenticação
- `POST /api/auth/registro` - Criar nova conta (requer autenticação de admin)
- `POST /api/auth/login` - Fazer login

### Administração (Apenas Admin)
- `GET /api/admin/usuarios` - Listar todos os usuários
- `POST /api/admin/usuarios` - Criar novo usuário
- `DELETE /api/admin/usuarios/{id}` - Deletar usuário
- `PUT /api/admin/usuarios/{id}/tipo` - Alterar tipo do usuário

### Empresas
- `GET /api/empresas` - Listar empresas (com filtros)
- `POST /api/empresas` - Criar empresa (Admin)
- `GET /api/empresas/{id}` - Obter empresa específica
- `PUT /api/empresas/{id}` - Atualizar empresa (Admin)
- `DELETE /api/empresas/{id}` - Deletar empresa (Admin)

### Prospecções
- `GET /api/prospeccoes` - Listar prospecções
- `POST /api/prospeccoes` - Criar prospecção
- `GET /api/prospeccoes/{id}` - Obter prospecção específica

### Agendamentos
- `GET /api/agendamentos` - Listar agendamentos
- `POST /api/agendamentos` - Criar agendamento
- `PUT /api/agendamentos/{id}` - Atualizar agendamento
- `GET /api/agendamentos/alertas` - Obter alertas categorizados

## Banco de Dados

### Tabelas
1. **usuarios** - Usuários do sistema (Admin/Consultor)
2. **empresas** - Cadastro de empresas
3. **prospeccoes** - Registro de prospecções e ligações
4. **agendamentos** - Agendamentos de retorno

### Relacionamentos
- Prospecção → Empresa (many-to-one)
- Prospecção → Usuário/Consultor (many-to-one)
- Agendamento → Prospecção (many-to-one)

## Tecnologias

### Python Packages
- FastAPI 0.109.0
- SQLAlchemy 2.0.25
- PostgreSQL (via psycopg2-binary)
- Pydantic 2.5.3 (com validação de email)
- python-jose (JWT)
- passlib 1.7.4 (hashing de senhas)
- bcrypt 4.3.0 (compatibilidade com passlib)
- Jinja2 3.1.3
- Uvicorn (servidor ASGI)

## Variáveis de Ambiente (Obrigatórias)

O sistema requer as seguintes variáveis de ambiente configuradas:

- **`DATABASE_URL`** - URL de conexão PostgreSQL (obrigatório)
  - Formato: `postgresql://user:password@host:port/database`
  - No Replit, configurado automaticamente
  
- **`SESSION_SECRET`** - Chave secreta para JWT (obrigatório)
  - Deve ser uma string aleatória segura
  - No Replit, configurado automaticamente

- **`ADMIN_EMAIL`** - Email do admin padrão (opcional, padrão: admin@admin.com)
- **`ADMIN_PASSWORD`** - Senha do admin padrão (opcional, padrão: admin123)
- **`ADMIN_NAME`** - Nome do admin padrão (opcional, padrão: Administrador)
  
**Importante**: O sistema não inicia sem as variáveis DATABASE_URL e SESSION_SECRET configuradas. O usuário admin é criado automaticamente no primeiro startup.

## Consultores no Sistema

O sistema possui dois consultores criados automaticamente:

1. **Gabriel**
   - Email: gabriel@consultoria.com
   - Senha: gabriel123
   - Tipo: Consultor

2. **Lucas**
   - Email: lucas@consultoria.com
   - Senha: lucas123
   - Tipo: Consultor

**Nota**: Administradores podem atribuir empresas a estes consultores através da interface de administração.

## Melhorias Futuras
- Exportação de relatórios (CSV/PDF)
- Dashboard com gráficos e estatísticas
- Notificações em tempo real
- Histórico de alterações
- Adoção de Alembic para migrações de banco de dados

## Data de Criação
06 de Novembro de 2025

## Última Atualização
10 de Novembro de 2025 - Melhorias implementadas:

### Manhã (importação inicial)
- Upload Excel de empresas
- Checklist enriquecido de prospecção
- Criação de consultores (Gabriel e Lucas)
- Interface de atribuição de empresas

### Tarde (melhorias de UX e CRUD completo)
- ✅ **Edição completa de usuários**: Implementado CRUD completo para usuários (nome, email, senha, tipo)
  - Novo schema `UsuarioAtualizar` com campos opcionais
  - Senha opcional na edição (mantém a anterior se não informada)
  - Interface com modal de edição
- ✅ **Remoção de emojis**: Removidos todos os emojis da interface
  - Checklist de interesses do cliente removido
  - Emojis removidos de selects (Resultado, Potencial, Status)
  - Emojis removidos de resultados de upload
- ✅ **Melhorias de scroll**: Formulários agora têm scroll adequado
  - Modais com `max-height: 90vh` e `overflow-y-auto`
  - Melhor experiência em telas menores
- ✅ **Formato CRUD completo**: Todas as entidades agora suportam edição completa

### Noite (correções críticas - 06/11)
- ✅ **Correção de carregamento de empresas**: Resolvido problema de 307 redirect
  - Todas as URLs de API agora incluem barra final (trailing slash)
  - Empresas, prospecções, agendamentos e alertas carregam corretamente
  - Fix aplicado em: dashboard.js, empresas.js, alertas.js, prospeccao_nova.js
- ✅ **Substituição do campo de agendamento**: Mudança de "dias para próxima ligação" para "data da próxima ligação"
  - Campo de data com seletor de calendário
  - Data padrão de hoje+7 dias quando checkbox é marcado
  - Validação apenas quando agendamento está habilitado
  - Reset adequado do formulário entre usos
  - Backend retorna boolean correto para agendamento_criado

### Autocomplete de Empresas (10/11)
- ✅ **Autocomplete inteligente na criação de prospecções**:
  - Substituído select por campo de busca com autocomplete
  - Busca em tempo real ao digitar (mínimo 2 caracteres)
  - Sugestões mostram nome da empresa, município e estado
  - Debounce de 300ms para otimizar performance de rede
- ✅ **Segurança e validação**:
  - Proteção contra XSS usando createElement/textContent
  - Validação obrigatória: não permite enviar sem selecionar empresa válida
  - Mensagens de erro claras para o usuário
- ✅ **Simplificação do formulário**:
  - Campos de contato (nome, telefone, email, cargo) são opcionais
  - Campos de interesse tornados opcionais no JavaScript
  - Formulário mais limpo e focado nas informações essenciais
