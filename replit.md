# Núcleo 1.03 - Sistema de Gestão e Prospecção de Empresas

## Overview
Núcleo 1.03 is a comprehensive web-based system built with Python and FastAPI, designed for managing and prospecting businesses. It facilitates company registration, tracks prospecting activities, manages appointments, and maintains a call history. The system aims to streamline sales and client management processes, offering robust tools for administrators and consultants to enhance efficiency and improve client acquisition strategies. Key capabilities include user authentication, detailed company profiles, advanced prospecting workflows with automated scheduling, and a customizable alert system.

## User Preferences
- I prefer simple language and clear explanations.
- I like an iterative development approach, where features are built and reviewed in stages.
- Ask for confirmation before making any major architectural changes or deleting significant portions of code.
- Ensure all new features are well-documented, especially concerning API endpoints and database interactions.
- Prioritize security and data integrity in all implementations.

## System Architecture

### UI/UX Decisions
The system features a professional dark theme across all screens, offering a consistent and modern user experience. The layout includes a fixed sidebar for navigation, a header displaying user information and a logout button, and a responsive design optimized for various screen sizes. Modals are used for forms to improve user interaction and manage screen real estate. The alert system uses color-coding (red for overdue, yellow for today, green for future) for intuitive prioritization. Chart.js is integrated for data visualization in the dashboard, providing statistical insights.

### Technical Implementations
The backend is built with FastAPI, using PostgreSQL as the database and SQLAlchemy as the ORM. Authentication is handled via JWT. Pydantic is used for data validation, ensuring robust data integrity. The frontend utilizes Jinja2 for templating, TailwindCSS (via CDN) for styling, and vanilla JavaScript with Fetch API for dynamic interactions.

### Feature Specifications
-   **Authentication & User Management**: Admin-only authentication with JWT for persistent sessions. Supports Admin and Consultant roles, with Admins managing user creation and permissions. Includes an admin interface for user management.
-   **Company Registration**: Comprehensive company profiles with fields for CNPJ, trade name, size, address, etc. Supports filtering and detailed company profiles with prospecting history. Future plans include Excel upload for bulk registration and attributing companies to consultants.
-   **Prospecting Module**: Admins create and assign prospects to consultants. Consultants log calls, including contact details, business potential, and follow-up status. Features intelligent autocomplete for company selection, detailed checklists, and integrated scheduling for follow-up calls.
-   **Scheduling Module**: Manages appointments linked to prospecting activities, with statuses like pending, completed, and overdue. Consultants view their appointments, while Admins oversee all.
-   **Alerts Module**: Categorizes and displays alerts based on appointment urgency (overdue, today, future), with automatic updates and user-specific filtering.
-   **Dashboard & Reporting**: Provides visual statistics using Chart.js, including prospecções by result, appointments by status, and companies by consultant. Includes quick actions for consultants and detailed profile views with assigned companies and prospecting counts.
-   **CNPJ Lookup**: A dedicated page for searching company details by CNPJ, utilizing a robust fallback system across multiple free APIs (ReceitaWS, BrasilAPI, publica.cnpj.ws) to ensure data retrieval and proper mapping to the company model.
-   **Profile Picture System**: Consultants can upload profile pictures via URL, with automatic avatar generation for those without a photo.
-   **Cronograma Geral (General Schedule)**: Comprehensive project timeline management with Excel import capability. Features include: project tracking with proposals, companies, consultants, dates, hours, and statuses (planned, in_progress, completed, paused, canceled); visual timeline and list views with progress indicators; advanced filtering by consultant, company, and date range; automatic status calculation based on dates; Excel import script for bulk data loading from spreadsheets; detailed project statistics and metrics.
-   **Chat System**: Internal messaging system between users with real-time conversation management, message read status, unread message counts, and robust user lookup that works for all user types (not just consultants).

### System Design Choices
The project is structured with clear separation of concerns: `backend/` for API logic, `templates/` for UI, and `static/` for assets. This modular approach facilitates maintenance and scalability. Security is emphasized with JWT for authentication, password hashing using `passlib` and `bcrypt`, and XSS protection in dynamic content. The system uses environment variables for sensitive configurations like database URLs and session secrets, enhancing deployability and security.

## Recent Changes

### November 27, 2025
-   **Correção das Ações Rápidas no Perfil do Consultor**: Funcionalidades de atribuição corrigidas
    -   Padrão de chamada `apiRequest()` corrigido em admin_atribuicoes.html e consultor_perfil.js
    -   URLs corrigidas para incluir trailing slash (`/api/atribuicoes/`)
    -   Backend atualizado com `joinedload` para retornar dados completos de empresa
    -   Verificações de permissão de admin adicionadas no frontend (JS)
    -   Botões de admin (Atribuir Prospecção, Atribuir Empresas, Definir Ações) ocultos para consultores
    -   Tratamento robusto de erros com null-checks em todas as respostas de API
    -   Filtros defensivos para atribuições com dados de empresa válidos
-   **Sidebar User Info Enhancement**: Sidebar atualizado para exibir informações do usuário logado
    -   Função centralizada `atualizarSidebar()` em auth.js
    -   Exibe foto do usuário (ou iniciais como fallback)
    -   Mostra nome e tipo do usuário (Administrador/Consultor)
    -   Link de Admin visível apenas para administradores
-   **Consultant Profile Quick Actions**: Botões de ação rápida no perfil do consultor aprimorados
    -   "Ver Empresas" agora abre modal com lista de empresas atribuídas clicáveis
    -   URL handling para pré-preencher formulário de nova prospecção
    -   Verificações defensivas para prevenir erros de runtime
-   **Chat File Attachments**: Sistema de anexos do chat verificado e configurado
    -   Diretório `static/uploads/` criado para armazenamento de arquivos
    -   Dependência do sistema `libmagic` (file) instalada para detecção de tipos MIME
    -   Backend com endpoint `/api/mensagens/upload` funcional
    -   Frontend com funções `anexarArquivo()`, `handleFileSelect()`, `uploadArquivo()` implementadas
    -   Suporte para imagens (JPEG, PNG, GIF, WebP), PDFs, Word, Excel e arquivos de texto
    -   Limite de 10MB por arquivo com validação de tipo
    -   Preview de anexos antes do envio com opção de cancelar
    -   Exibição de anexos nas mensagens com download e visualização de imagens

### November 26, 2025
-   **Gestão de Consultores para Admin**: Funcionalidade completa de inserir e excluir consultores na página de consultores
    -   Botão "Novo Consultor" visível apenas para administradores
    -   Modal de criação com campos: nome, email e senha
    -   Botão "Excluir" em cada linha da tabela (apenas para admin)
    -   Modal de confirmação antes de excluir
    -   Exclusão remove automaticamente prospecções e atribuições associadas
    -   Endpoints seguros com validação de admin no backend
    -   Proteção contra XSS usando DOM seguro (createElement/textContent)

### November 25, 2025
-   **Railway Deployment Preparation**: Sistema completamente adaptado para deploy no Railway com migrações automáticas
    -   **Alembic integrado**: Sistema de migrações de banco de dados versionado e automático
    -   **Migração PostgreSQL otimizada**: Migração inicial (`bf387194a72b`) criada com handling correto de tipos Enum PostgreSQL
        - Tipos Enum criados explicitamente com `CREATE TYPE` antes das tabelas
        - Todas as colunas Enum usam `create_type=False` para evitar duplicação
        - Downgrade seguro com `DROP TYPE IF EXISTS`
    -   **Script start.sh**: Executa `alembic upgrade head` automaticamente antes de iniciar o servidor
    -   **Configuração Railway**: Arquivos `railway.toml` e `Procfile` criados para deploy automático
    -   **Documentação completa**: `RAILWAY_DEPLOY.md` com guia passo a passo para deploy
    -   **Remoção de create_all()**: `Base.metadata.create_all()` removido do main.py - agora usa apenas Alembic
    -   **Arquivo .env.example**: Template de variáveis de ambiente para facilitar configuração
    -   Sistema pronto para deploy com um clique no Railway com PostgreSQL automático

### November 11, 2025
-   **Cronograma em Formato de Calendário com Dias Clicáveis**: Visualização interativa de calendário implementada
    -   Adicionado botão "Calendário" como primeira opção de visualização (Timeline e Lista ainda disponíveis)
    -   Calendário mensal exibe projetos em andamento em cada dia baseado nas datas de início e término
    -   **Dias clicáveis**: Clicar em um dia abre modal com detalhes completos de todos os projetos daquele dia
    -   **Cores por tipo de solução**: Projetos coloridos conforme o tipo de solução (Implantação=Azul, Consultoria=Verde, Treinamento=Roxo, Suporte=Amarelo, Desenvolvimento=Rosa, Personalização=Índigo, Migração=Laranja, Outros=Teal)
    -   **Legenda de cores**: Tabela de legenda mostrando o significado de cada cor
    -   **Modal de detalhes**: Exibe proposta, empresa, consultor, datas, horas, porte, região, município, UF e contato
    -   Navegação entre meses com botões "Anterior" e "Próximo"
    -   Dia atual destacado em azul para fácil identificação
    -   Limite de 3 projetos exibidos por dia com contador "+X mais" quando necessário
    -   Sidebar e header corrigidos para navegação consistente
-   **Correção do Chat**: Erro "Erro ao carregar consultores" corrigido
    -   Alterado endpoint de `/api/consultores/` para `/api/usuarios/`
    -   Corrigida propriedade de acesso de `data.consultores` para `data.items`
    -   Chat agora carrega todos os usuários corretamente para iniciar conversas
-   **Cronograma System Fixed and Populated**: Sistema de cronograma corrigido e dados importados com sucesso
    -   Corrigidos erros JavaScript de inicialização (checkAuth, visualizacao, projetos não definidos)
    -   Ajustada ordem de carregamento dos scripts (auth.js antes de cronograma.js)
    -   Adicionadas verificações de tipo defensivas para prevenir erros de runtime
    -   Reintroduzido refresh automático a cada 60 segundos
    -   **224 projetos importados permanentemente no banco de dados** (219 concluídos, 5 em andamento)
    -   Campo UF expandido para VARCHAR(50) para acomodar valores como "BRASIL"
    -   Dados incluem: proposta, empresa, CNPJ, consultor, datas, horas, status, região, município, contatos

## External Dependencies

-   **Database**: PostgreSQL
-   **Database Migrations**: Alembic (for version-controlled schema migrations)
-   **Frontend Styling**: TailwindCSS (CDN)
-   **Charting Library**: Chart.js
-   **External APIs for CNPJ Lookup (with fallback)**:
    -   ReceitaWS
    -   BrasilAPI
    -   publica.cnpj.ws
-   **Avatar Generation**: ui-avatars.com (for default user avatars)

## Deployment

### Railway (Docker-based - Nov 27, 2025)
O sistema usa **Dockerfile** para deploy determinístico no Railway:

**Arquitetura de Deploy:**
-   **Dockerfile**: Imagem Python 3.11-slim com Gunicorn + Uvicorn workers
-   **docker-entrypoint.sh**: Script de inicialização robusto que:
    -   Verifica DATABASE_URL (falha se não configurada)
    -   Aguarda banco de dados estar pronto (30 tentativas)
    -   Executa migrações Alembic antes de iniciar
    -   Roda seeding uma vez antes dos workers
    -   Define SKIP_STARTUP_SEED para evitar duplicação

**Health Check:**
-   Endpoint `/health` independente do banco de dados
-   Resposta rápida para evitar timeout do Railway
-   HEALTHCHECK nativo do Docker configurado

**Configuração Railway:**
-   `railway.toml` usa builder DOCKERFILE
-   `healthcheckTimeout=120` para permitir startup
-   Gunicorn com 2 workers Uvicorn

**Para fazer deploy:**
1. Conecte o repositório GitHub ao Railway
2. Adicione PostgreSQL ao projeto
3. Configure a variável DATABASE_URL (automático se usar addon)
4. Deploy automático a cada push

Veja `RAILWAY_DEPLOY.md` para instruções detalhadas