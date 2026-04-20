# Rent_App Architecture

This document describes the modular and scalable architecture of the Rent_App project.

## Project Structure

### Backend (NestJS)

The backend is organized into a modular architecture to ensure separation of concerns and maintainability.

```
backend/src/
├── app.module.ts           # Root module
├── main.ts                 # Main entry point
├── common/                 # Shared cross-cutting concerns
│   ├── decorators/         # Custom decorators (e.g., @Roles)
│   ├── filters/            # Exception filters
│   ├── guards/             # Authentication/Authorization guards
│   ├── interceptors/       # Request/Response interceptors
│   ├── middleware/         # Express middleware
│   └── pipes/              # Validation/Transformation pipes
├── config/                 # Configuration management
├── core/                   # Core system infrastructure
│   └── database/           # Prisma service and module
└── modules/                # Domain-specific modules
    ├── auth/               # Authentication logic & DTOs
    ├── users/              # User management & DTOs
    ├── stations/           # Station management & DTOs
    ├── bikes/              # Bike management & DTOs
    └── reservations/       # Reservation management & DTOs
```

#### Key Architecture Decisions
- **Centralized Prisma**: `PrismaService` is placed in `core/database` to ensure a single source of truth for database interactions.
- **Typed DTOs**: Every domain module defines its input types via DTOs, moving away from `any` for better type safety.
- **Common Layer**: Guards and decorators used across multiple modules are centralized in `common/`.

### Frontend (Next.js)

The frontend uses Next.js App Router and follows a functional directory structure.

```
frontend/src/
├── app/                    # Next.js Pages and layouts
│   ├── (auth)/             # Auth-related pages (login)
│   ├── dashboard/          # User dashboard
│   ├── admin/              # Admin management
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Entry redirect
├── components/             # React components
│   └── ui/                 # Reusable UI components
├── hooks/                  # Custom React hooks (e.g., useAuth)
├── lib/                    # Library configurations (Axios, API instance)
├── types/                  # Shared TypeScript interfaces
├── utils/                  # Helper functions
└── styles/                 # Global styles
```

#### Key Architecture Decisions
- **Shared Authentication Hook**: Authentication checks are centralized in `useAuth`, ensuring consistent security across protected pages.
- **Centralized Types**: Domain interfaces are defined once in `types/index.ts` and shared across all components and pages.
- **Feature-Ready Structure**: Placeholder directories are established for utilities and styles, ready for future expansion.

## API Overview

| Route | Method | Description | Role |
|-------|--------|-------------|------|
| `/auth/login` | POST | Authenticates a user and returns a token | PUBLIC |
| `/auth/register` | POST | Registers a new user | PUBLIC |
| `/stations` | GET | Lists all available stations | USER/ADMIN|
| `/reservations` | POST | Creates a new bike reservation | USER |
| `/reservations/my` | GET | Gets the logged-in user's reservations | USER |
| `/reservations/:id/complete` | PATCH | Completes a reservation | ADMIN |
