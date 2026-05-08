# Rent_App Architecture & Technical Specification

## 1. Executive Summary
Rent_App is a high-performance, production-grade SaaS platform designed for bike rental management. It leverages a modern full-stack architecture to handle real-time GPS tracking, complex rental lifecycles, role-based access control (RBAC), and automated financial settlements.

---

## 2. Technology Stack

### Core Technologies
- **Frontend**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Backend**: [NestJS](https://nestjs.com/) (Node.js framework)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Real-time**: [Socket.io](https://socket.io/) (WebSockets)
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)

### State & Data Management
- **Frontend State**: [Zustand](https://github.com/pmndrs/zustand) (Client-side) & [TanStack Query](https://tanstack.com/query/latest) (Server-state)
- **API Client**: [Axios](https://axios-http.com/) (Centralized instance with interceptors)
- **Exporting**: `jspdf`, `jspdf-autotable`, and `xlsx` for reports.

---

## 3. System Architecture

### 3.1 Backend (Modular Monolith)
The backend is structured into domain-specific modules, ensuring high maintainability and scalability.

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
│   ├── tracking/           # Real-time GPS & Socket.io Gateways
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

### 4.1 Real-Time Tracking Engine
- **Mechanism**: The backend `TrackingGateway` manages WebSocket connections using `socket.io`.
- **Persistence**: GPS data is ingested and stored in the `BikeLocation` table via Prisma.
- **Frontend**: The `MapViewer` component subscribes to real-time events to display live bike positions.

### 4.2 Hardened Rental Lifecycle
1. **Reservation**: Initial booking (PENDING/CONFIRMED).
2. **Check-In**: Physical verification of bike condition before start.
3. **Active Ride**: Real-time tracking and duration calculation.
4. **Settlement**: Ride finalization involving incident reporting, usage calculation, and payment adjustments.

### 4.3 Permissions & Security (RBAC+)
- **Roles**: `ADMIN`, `USER`, `INVITED`.
- **Granular Control**: Permissions are defined at the module and action level (e.g., `BIKES:CREATE`, `USERS:PAGE`).
- **Overrides**: Support for individual user permission overrides beyond their assigned role.

### 4.4 Financial & Timezone Standards
- **Currency**: Default to USD.
- **Timezone**: All operations are standardized to **America/Managua** (Nicaragua) to ensure financial consistency.
- **Pricing**: Dynamic calculation based on hourly rates, extras (helmets, etc.), and incident-based refunds/penalties.

---

## 5. Database Schema (Prisma)
The database is the source of truth for the entire system, featuring:
- **User/Auth**: Secure credentials and permission mapping.
- **Inventory**: `Bike` and `Station` relationship with status monitoring.
- **Operations**: `Reservation` table capturing snapshots of rates and conditions.
- **Financials**: `Payment` table tracking upfront deposits and final balances.

---

## 6. Implementation Guidelines
- **Development**: Use `npm run dev` for both frontend and backend.
- **Coding Standard**: Strict TypeScript, no `any`, modular exports.
- **UI/UX**: Follow the Standardized Modal pattern using `BaseModal` for consistency across all modules.
- **Naming**: PascalCase for components/types, camelCase for variables/functions.

