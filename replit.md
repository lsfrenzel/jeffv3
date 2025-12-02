# Núcleo 1.03 - Sistema de Gestão e Prospecção de Empresas

## Overview
Núcleo 1.03 is a comprehensive web-based system designed for managing and prospecting businesses, built with Python and FastAPI. It streamlines sales and client management by offering features such as user authentication, detailed company profiles, advanced prospecting workflows, automated scheduling, and a customizable alert system. The system's purpose is to enhance efficiency and improve client acquisition strategies for administrators and consultants.

## User Preferences
- I prefer simple language and clear explanations.
- I like an iterative development approach, where features are built and reviewed in stages.
- Ask for confirmation before making any major architectural changes or deleting significant portions of code.
- Ensure all new features are well-documented, especially concerning API endpoints and database interactions.
- Prioritize security and data integrity in all implementations.

## System Architecture

### UI/UX Decisions
The system features a professional dark theme, a fixed sidebar for navigation, and a responsive design. Modals are used for forms, and an alert system uses color-coding for intuitive prioritization. Chart.js is integrated for data visualization on the dashboard.

### Technical Implementations
The backend uses FastAPI, PostgreSQL, and SQLAlchemy. Authentication is handled via JWT, and Pydantic is used for data validation. The frontend uses Jinja2 for templating, TailwindCSS for styling, and vanilla JavaScript with Fetch API for dynamic interactions. The system is designed for Railway deployment using Docker, Alembic for database migrations, and a robust startup script.

### Feature Specifications
-   **Authentication & User Management**: Admin-only authentication, JWT for sessions, Admin and Consultant roles, user creation and permission management.
-   **Company Registration**: Detailed company profiles, filtering, prospecting history, with future plans for bulk Excel upload and consultant attribution.
-   **Prospecting Module**: Admins assign prospects to consultants. Consultants log calls, track potential, and schedule follow-ups. Includes autocomplete and checklists.
-   **Scheduling Module**: Manages appointments linked to prospecting, with status tracking (pending, completed, overdue).
-   **Alerts Module**: Categorizes and displays time-sensitive alerts (overdue, today, future) with user-specific filtering.
-   **Dashboard & Reporting**: Visual statistics via Chart.js, covering prospecting results, appointment statuses, and company assignments.
-   **CNPJ Lookup**: Dedicated search page for company details using multiple fallback APIs.
-   **Profile Picture System**: Consultants can upload profile pictures via URL, with automatic avatar generation.
-   **Cronograma Geral (General Schedule)**: Complete calendar event management with CRUD operations. Features:
    - Monthly calendar view with color-coded categories
    - Categories: C-Consultoria (green), K-Kick-off (yellow), F-Reuniao Final (blue), M-Mentoria (red), T-Diagnostico (orange), P-Programado (cyan), O-Outros (gray)
    - 4,959 events imported from Excel spreadsheet (CRONOGRAMA 2.0)
    - 9 consultants imported with events:
      - André Shiguemitsu Aoki (485 eventos)
      - Fernando Luiz de Figueredo (472 eventos)
      - Leandro Silva (489 eventos)
      - Lucas Azimovas (683 eventos)
      - Marcello Figueiredo (711 eventos)
      - Matheus Fernando (393 eventos)
      - Rafael Paula dos Santos (269 eventos)
      - Ramon Silvati (677 eventos)
      - Ricardo Ciuccio (780 eventos)
    - Filtering by consultant, category, and month
    - Create, edit, and delete events via modals
    - Morning (M) and Afternoon (T) periods
-   **Chat System**: Internal messaging with real-time conversations, read statuses, unread counts, user lookup, and file attachment capabilities.

### System Design Choices
The project enforces separation of concerns (`backend/`, `templates/`, `static/`). Security measures include JWT authentication, password hashing, XSS protection, and environment variables for sensitive configurations. The system is fully mobile-responsive across all pages.

## External Dependencies

-   **Database**: PostgreSQL
-   **Database Migrations**: Alembic
-   **Frontend Styling**: TailwindCSS (CDN)
-   **Charting Library**: Chart.js
-   **External APIs for CNPJ Lookup**:
    -   ReceitaWS
    -   BrasilAPI
    -   publica.cnpj.ws
-   **Avatar Generation**: ui-avatars.com

## Recent Changes (December 2025)
-   Fixed 403 Forbidden error on `/api/consultores/{id}` endpoint - now allows admins and all user types to view profiles, not just consultors
-   Fixed 307 redirect issues by ensuring JavaScript API calls use trailing slashes to match FastAPI routes
-   Configured PostgreSQL database with seed data (admin user, consultores, empresas, pipeline stages, cronograma events)
-   **Fixed 500 errors on consultant profile and prospection endpoints** - Made `codigo` field optional in `ProspeccaoResposta` schema to handle legacy prospections without unique codes
-   **Added automatic database migration** - Startup now automatically adds the `codigo` column to the prospeccoes table if it doesn't exist (for Railway/production databases)
-   **Added automatic codigo generation** - Startup function now automatically generates unique codes for any existing prospections that don't have one (format: PROSP-YYYYMMDD-XXXX)
-   Disabled slow cronograma seed during startup for faster server boot time
-   **Mobile Responsiveness Improvements** - Enhanced prospeccao_nova.html with horizontal scroll for tables, responsive padding, and hidden columns on mobile
-   **Auto-fill Date/Time Feature** - Added auto-fill for "Data e hora da ligação" fields with current timestamp as default suggestion
-   **Date/Time Preservation in Editing** - Implemented timezone-safe string slicing to preserve original date/time values when editing prospections, with current timestamp fallback for empty fields
-   **Fixed bcrypt compatibility issue** - Changed bcrypt from 4.1.2 to 4.0.1 to fix `AttributeError: module 'bcrypt' has no attribute '__about__'` error with passlib
-   **Fixed JavaScript null pointer errors** - Added null checks for DOM elements before adding event listeners in prospeccao_nova.js to prevent script crashes that caused "Carregando..." to display forever
-   **Fixed prospeccoes table empty** - Added seed function `criar_prospeccoes_padrao()` to automatically create 5 test prospections when database is empty
-   **Fixed prospeccao.js display issue** - Updated JavaScript to properly use empresa/consultor data returned by API instead of requiring separate cache lookup; added better error handling and visual improvements to the table