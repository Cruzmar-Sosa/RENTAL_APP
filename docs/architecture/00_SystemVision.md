# Rent_App System Vision
**Document ID:** ARCH-00  
**Version:** 1.0.0  
**Status:** Draft  
**Owner:** Rent_App Architecture Team  
**Last Updated:** July 2026

---

# 1. Purpose

This document defines the long-term architectural vision of **Rent_App**.

Rather than describing implementation details, this document establishes the principles, goals, responsibilities and technological direction that every future component of the platform must follow.

Every architectural decision taken within the project should be evaluated against the vision described here.

---

# 2. Project Overview

Rent_App is a production-grade SaaS platform designed for companies that operate electric bicycle rental services.

The platform manages the complete rental lifecycle, including:

- Fleet management
- Customer management
- Reservations
- Financial settlements
- GPS tracking
- Maintenance operations
- Auditing
- Reporting
- Future IoT integrations

Unlike traditional CRUD systems, Rent_App is designed around business workflows, transactional integrity and operational visibility.

The long-term goal is to evolve into an enterprise fleet management platform capable of managing thousands of bicycles across multiple cities.

---

# 3. Vision Statement

> Build a scalable, highly reliable and operationally safe platform capable of managing electric mobility businesses through a modular, event-driven and transactionally consistent architecture.

---

# 4. Core Business Objectives

Rent_App exists to solve five major business problems.

## 4.1 Fleet Management

Provide operators with complete visibility of every bicycle within the fleet.

This includes:

- Current location
- Current rider
- Technical condition
- Operational availability
- Maintenance history
- Utilization metrics

---

## 4.2 Reservation Lifecycle

Every reservation must follow a predictable lifecycle.

Examples:

```
Reservation Created

↓

Confirmed

↓

Checked-In

↓

Ride Active

↓

Ride Finished

↓

Settlement Pending

↓

Settled
```

Every transition must be validated by the backend.

---

## 4.3 Financial Integrity

Financial operations are considered critical.

The system must guarantee:

- deterministic settlement calculations
- idempotent payment operations
- transactional consistency
- auditability
- reproducible financial reports

No financial calculation should depend on frontend logic.

---

## 4.4 Operational Visibility

Administrators must always know:

- where every bicycle is
- who is riding it
- battery status
- maintenance status
- operational status

The platform should become a real-time operational dashboard.

---

## 4.5 Scalability

The platform must support future growth including:

- multiple cities
- multiple companies
- multiple stations
- thousands of bikes
- millions of GPS points

without requiring architectural redesign.

---

# 5. Design Philosophy

Rent_App follows several architectural principles.

---

## Principle 1

### Backend is the Source of Truth

Business decisions are never made by clients.

Clients only submit requests.

The backend validates every transition.

---

## Principle 2

### Business State ≠ Telemetry

Business state:

- reservations
- payments
- settlements
- operational status

Telemetry:

- GPS
- battery
- speed
- signal
- heading

These domains must remain independent.

---

## Principle 3

### Every Critical Operation is Auditable

Critical business operations generate immutable events.

Examples:

- reservation created
- reservation cancelled
- payment completed
- maintenance started
- bike assigned
- operational status changed

Future versions will extend this into a complete Event Store.

---

## Principle 4

### Domain Separation

Each business capability owns its own logic.

Examples:

Authentication

↓

Reservations

↓

Payments

↓

Tracking

↓

Maintenance

↓

Notifications

No module should contain business logic belonging to another domain.

---

## Principle 5

### Offline First

Mobile applications must continue operating even with intermittent connectivity.

Synchronization should happen automatically when connectivity is restored.

---

## Principle 6

### Scalability Before Complexity

The architecture should evolve incrementally.

Current architecture:

Modular Monolith

↓

Future:

Distributed Services

↓

Eventually:

Microservices (only if justified)

---

# 6. Platform Scope

Current Functional Domains

```
Authentication

Users

Permissions

Fleet

Stations

Reservations

Payments

Settlement

Routes

Tracking

Notifications

Administration
```

Future Domains

```
IoT Devices

BLE Locks

Predictive Maintenance

Analytics

Dynamic Pricing

Insurance

Fraud Detection

Maintenance Scheduling

AI Demand Forecasting

Fleet Optimization
```

---

# 7. High-Level Architecture

```text
                        Users

            ┌────────────┴────────────┐

          Web Portal             Mobile App

                    │

             HTTPS / Socket.IO

                    │

          ┌──────────────────────┐
          │      NestJS API      │
          └──────────────────────┘

      ┌───────────┼─────────────┐

 Business      Tracking      Notifications

      │             │

 PostgreSQL      Redis

      │             │

 Settlement   Presence Server

      │

 Historical Storage

      │

 TimescaleDB (Future)
```

---

# 8. Technology Strategy

## Backend

NestJS

Reasons

- Modular architecture
- Dependency Injection
- TypeScript
- Scalability
- Enterprise ecosystem

---

## Frontend

Next.js

Reasons

- SSR
- React ecosystem
- SEO
- Excellent developer experience

---

## Mobile

React Native

Reasons

- Single codebase
- Android
- iOS
- Native GPS APIs
- Background execution

---

## Database

PostgreSQL (Supabase)

Reasons

- ACID
- Referential integrity
- Strong consistency
- Prisma support
- Financial safety

---

## ORM

Prisma

Reasons

- Type Safety
- Migrations
- Schema-first development

---

## Real-Time Layer

Socket.IO

Reasons

- Bidirectional communication
- Automatic reconnection
- Presence events
- Low latency

---

## Presence Layer (Future)

Redis

Responsibilities

- Online users
- Online bikes
- Last heartbeat
- Presence TTL
- Pub/Sub

Redis will NOT store historical GPS data.

---

## Historical Tracking (Future)

TimescaleDB

Reasons

- Time-series optimization
- Compression
- Retention policies
- High-volume GPS ingestion

---

# 9. Non-Functional Requirements

The platform must prioritize:

- Reliability
- Consistency
- Auditability
- Security
- Scalability
- Observability
- Performance
- Maintainability

Performance must never compromise data integrity.

---

# 10. Architectural Constraints

The following rules are mandatory.

✓ Backend owns business logic

✓ Financial calculations occur only on the server

✓ Tracking data never mutates business state directly

✓ Operational state is backend-controlled

✓ Technical state is independently managed

✓ Controllers remain thin

✓ Services encapsulate business rules

✓ Transactions protect critical operations

✓ UUIDs are validated

✓ Strict TypeScript

✓ No `any`

---

# 11. Future Evolution

The expected architectural evolution is:

```text
V1

Rental Platform

↓

Fleet Management

↓

Real-Time Tracking

↓

Offline Mobile Tracking

↓

Redis Presence

↓

TimescaleDB

↓

IoT Devices

↓

BLE Smart Locks

↓

Predictive Maintenance

↓

Enterprise Multi-Tenant SaaS
```

---

# 12. Success Criteria

Rent_App will be considered architecturally successful when it can:

- manage thousands of bicycles
- support multiple companies
- operate across multiple cities
- tolerate intermittent connectivity
- maintain financial consistency
- recover gracefully from failures
- provide real-time operational visibility
- evolve without major architectural rewrites

---

# 13. Related Documents

This document serves as the foundation for:

- 01_DomainArchitecture.md
- 02_BusinessArchitecture.md
- 03_TrackingArchitecture.md
- 04_MobileArchitecture.md
- 05_DeploymentArchitecture.md
- 06_SecurityArchitecture.md
- 07_ScalabilityRoadmap.md

Every architectural document must remain consistent with the vision established here.