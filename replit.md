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

### November 11, 2025
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
-   **Frontend Styling**: TailwindCSS (CDN)
-   **Charting Library**: Chart.js
-   **External APIs for CNPJ Lookup (with fallback)**:
    -   ReceitaWS
    -   BrasilAPI
    -   publica.cnpj.ws
-   **Avatar Generation**: ui-avatars.com (for default user avatars)