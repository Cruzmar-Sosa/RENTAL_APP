# Rent_App Architecture & Technical Specification

> **Architectural Entry Point & Index Document**  
> *For in-depth strategic specifications, refer to the detailed handbook in [`docs/architecture/`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture).*

---

## 1. Executive Summary
Rent_App is a high-performance, production-grade SaaS platform designed for bike rental management. It leverages a modern full-stack architecture to handle real-time GPS tracking, complex rental lifecycles, role-based access control (RBAC), and automated financial settlements.

---

## 2. Technology Stack

### Core Technologies
- **Frontend**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Backend**: [NestJS](https://nestjs.com/) (Node.js framework)
- **Primary Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/) (Supabase)
- **Presence Storage**: [Redis](https://redis.io/) (Volatile presence & real-time sessions)
- **Telemetry Storage**: [TimescaleDB](https://www.timescale.com/) (Time-series GPS historical storage)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Real-time**: [Socket.io](https://socket.io/) (WebSockets)
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)

### State & Data Management
- **Frontend State**: [Zustand](https://github.com/pmndrs/zustand) (Client-side) & [TanStack Query](https://tanstack.com/query/latest) (Server-state)
- **API Client**: [Axios](https://axios-http.com/) (Centralized instance with interceptors)
- **Exporting**: `jspdf`, `jspdf-autotable`, and `xlsx` for reports.

---

## 3. System Architecture

### 3.1 Backend Architecture (Current Modular Monolith & Platform Vision)
Currently (Phase 0–1), the backend is structured as a domain-driven Modular Monolith inside NestJS.

> ⚠️ **Architectural Note on Tracking**: The `tracking/` folder in `backend/src/modules/` serves as a **temporary logical module** during Phase 0–1. In the target enterprise architecture (Phase 3+), Tracking evolves into a physically independent platform (**Tracking Platform**). See [`03_TrackingArchitecture.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/03_TrackingArchitecture.md) and [`ADR-002`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/adr/ADR-002-Tracking-Platform.md).

```
backend/src/
├── core/                   # Shared infrastructure
│   └── database/           # Global PrismaService & Module
├── common/                 # Cross-cutting concerns
│   ├── decorators/         # @Roles, @Permissions, @Public
│   ├── guards/             # JwtAuthGuard, PermissionsGuard
│   ├── filters/            # Global Exception Filters
│   └── interceptors/       # Response Transform Interceptor
├── modules/                # Domain Logic
│   ├── auth/               # JWT strategy, Registration, Login
│   ├── users/              # RBAC & User Management
│   ├── bikes/              # Inventory & Status tracking
│   ├── stations/           # Geolocation-based bike hubs
│   ├── reservations/       # Rental lifecycle management
│   ├── tracking/           # Real-time GPS & Socket.io Gateways (Phase 0-1 location)
│   ├── payments/           # Financial transactions & Stripe-ready logic
│   └── routes/             # Path & POI management for users
```

### 3.2 Frontend (Component-Driven)
The frontend follows a modern React pattern, emphasizing reusability and performance.

```
frontend/src/
├── app/                    # Next.js Routes (Layouts & Pages)
├── components/             # UI Layer
│   ├── ui/                 # Shadcn standard components
│   ├── modals/             # Standardized BaseModal system
│   └── MapViewer.tsx       # Real-time visualization component
├── context/                # React Context providers (ModalProvider)
├── hooks/                  # Logic extraction (useAuth, usePermissions)
├── lib/                    # Configuration (Axios, Utils)
├── types/                  # Global TypeScript definitions
└── store/                  # Zustand global stores
```

---

## 4. Key Architectural Features

### 4.1 Real-Time Tracking & Telemetry Separation
- **Mechanism**: Real-time telemetry is ingested via Socket.io. Telemetry never mutates business state directly.
- **Presence Storage**: Current live locations and heartbeat states are held in Redis (TTL 30s).
- **Historical Telemetry**: Time-series GPS points are stored in TimescaleDB.
- **Frontend**: The `MapViewer` component subscribes to real-time events to display live bike positions.

### 4.2 Hardened Rental Lifecycle
1. **Reservation**: Initial booking (PENDING/CONFIRMED).
2. **Check-In**: Physical verification of bike condition before start.
3. **Active Ride**: Real-time tracking and duration calculation.
4. **Settlement**: Server-authoritative financial closure, calculation of usage, overtime, and incident billing.

### 4.3 Permissions & Security (RBAC+)
- **Roles**: `ADMIN`, `USER`, `INVITED`.
- **Granular Control**: Permissions are defined at the module and action level (e.g., `BIKES:CREATE`, `USERS:PAGE`).
- **Overrides**: Support for individual user permission overrides beyond their assigned role.

### 4.4 Financial & Timezone Standards
- **Currency**: Default to USD.
- **Timezone**: All operations are standardized to **America/Managua** (Nicaragua) to ensure financial consistency.
- **Pricing**: Dynamic calculation based on hourly rates, extras (helmets, etc.), and incident-based refunds/penalties.

---

## 5. Storage Architecture & Source of Truth

- **Server-Authoritative Principle**: The NestJS Backend is the sole source of truth for business state transitions and calculations. Frontend clients only submit requests and render state.
- **Transactional Persistence (PostgreSQL / Prisma)**: Canonical storage for Users, Fleet, Reservations, Payments, Stations, and Settlement summaries.
- **Presence Storage (Redis)**: Volatile cache for active sockets, live GPS heartbeats, and device connectivity states.
- **Time-Series Telemetry (TimescaleDB)**: Optimized storage for high-frequency GPS logs, historical routes, and route replay.

---

## 6. Architecture Documentation Index

For detailed architectural specifications, consult the following documents in [`docs/architecture/`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture):

1. [`00_SystemVision.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/00_SystemVision.md) — System Vision & Core Design Principles
2. [`01_DomainArchitecture.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/01_DomainArchitecture.md) — Domain Boundaries & Bounded Contexts
3. [`02_BusinessArchitecture.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/02_BusinessArchitecture.md) — Business Processes & Lifecycles
4. [`03_TrackingArchitecture.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/03_TrackingArchitecture.md) — Tracking Platform & Telemetry Architecture
5. [`04_MobileArchitecture.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/04_MobileArchitecture.md) — Mobile Platform Architecture (React Native)
6. [`05_DeploymentArchitecture.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/05_DeploymentArchitecture.md) — Cloud Infrastructure & Deployment Topology
7. [`06_SecurityArchitecture.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/06_SecurityArchitecture.md) — Zero-Trust Security Architecture
8. [`07_ScalabilityRoadmap.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/07_ScalabilityRoadmap.md) — 10-Phase Platform Evolution Roadmap
9. [`08_GlossaryAndConventions.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/08_GlossaryAndConventions.md) — Enterprise Glossary & Architectural Conventions

---

## 7. Implementation Guidelines
- **Development**: Use `npm run dev` for both frontend and backend.
- **Coding Standard**: Strict TypeScript, no `any`, modular exports.
- **UI/UX**: Follow the Standardized Modal pattern using `BaseModal` for consistency across all modules.
- **Naming**: PascalCase for components/types, camelCase for variables/functions.


