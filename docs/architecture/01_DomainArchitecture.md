# 01_DomainArchitecture.md

> Version: 2.0
>
> Project: Rent_App
>
> Document Type:
> Enterprise Domain Architecture
>
> Status:
> Living Architecture Document

---

# 1. Purpose

This document defines the business domains that compose Rent_App.

Unlike the current source code organization (NestJS modules), this document defines the logical ownership of the business.

The objective is to clearly separate responsibilities so the system can evolve toward a scalable architecture without generating coupling between modules.

This document serves as the foundation for:

- Business Architecture
- Mobile Architecture
- Tracking Architecture
- Event Architecture
- Future Microservices
- CQRS/Event Driven evolution

---

# 2. Architectural Philosophy

Rent_App follows a Domain-Oriented Architecture.

The system is divided into bounded contexts.

Each domain owns:

- its business rules
- its entities
- its events
- its validations
- its workflows

A domain never owns another domain's data.

Communication always occurs through well-defined interfaces or domain events.

---

# 3. High-Level Domain Map

```

Identity Domain

↓

Fleet Domain

↓

Reservation Domain

↓

Settlement Domain

↓

Payment Domain

↓

Tracking Domain

↓

Maintenance Domain

↓

Notification Domain

↓

Route Domain

↓

Administration Domain

```

Each domain is autonomous.

Each domain has its own lifecycle.

---

# 4. Domain Definitions

---

# 4.1 Identity Domain

## Purpose

Manage identities inside the platform.

## Owns

User

Role

Permission

Authentication

Authorization

JWT

Sessions

Refresh Tokens

## Responsibilities

Authenticate users.

Authorize access.

Manage permissions.

Manage roles.

Generate security tokens.

Validate credentials.

## Produces Events

UserRegistered

UserLoggedIn

UserLoggedOut

RoleChanged

PermissionUpdated

## Consumes

None

---

# 4.2 Fleet Domain

## Purpose

Manage physical assets.

A bicycle is considered an enterprise asset.

## Owns

Bike

Station

Bike Assignment

Operational Status

Fleet Capacity

BikeEvent

## Responsibilities

Create bikes.

Move bikes between stations.

Track operational availability.

Assign bikes.

Expose fleet information.

Never manages reservations.

Never manages payments.

Never performs settlement.

## Produces

BikeCreated

BikeOperationalStatusChanged

BikeAssignedToStation

BikeRemovedFromStation

## Consumes

ReservationConfirmed

RideStarted

RideFinished

MaintenanceCompleted

---

# 4.3 Reservation Domain

## Purpose

Manage customer reservations.

Reservation is the heart of the rental lifecycle.

## Owns

Reservation

ReservationEvent

Check-In PIN

Ride Lifecycle

Reservation Expiration

Guest Information

Rental Timing

## Responsibilities

Create reservations.

Validate availability.

Generate Check-In PIN.

Start rides.

Complete rides.

Cancel reservations.

Never calculates money.

Never processes payments.

Never modifies bikes directly.

Requests Fleet actions.

## Produces

ReservationCreated

ReservationConfirmed

RideCheckedIn

RideStarted

RideCompleted

ReservationCancelled

ReservationExpired

## Consumes

BikeOperationalStatusChanged

PaymentSucceeded

SettlementCompleted

---

# 4.4 Settlement Domain

## Purpose

Calculate financial closure.

Settlement never receives payments.

Settlement only calculates.

## Owns

Settlement Engine

Settlement Calculator

Settlement Policy

Pricing Rules

Overtime Policy

Incident Rules

Financial Summary

Balance Calculation

## Responsibilities

Calculate total cost.

Calculate overtime.

Calculate incident costs.

Calculate credits.

Recommend financial status.

Recommend actions.

Generate settlement report.

Never charges money.

Never creates reservations.

## Produces

SettlementCalculated

BalanceGenerated

RefundRecommended

CollectionRequired

## Consumes

RideCompleted

IncidentReported

PaymentSucceeded

---

# 4.5 Payment Domain

## Purpose

Handle monetary transactions.

## Owns

Payment

PaymentEvent

Refund

Deposit

Balance Payment

Payment Gateway Integration

## Responsibilities

Create payments.

Capture payments.

Refund payments.

Track payment status.

Synchronize payment providers.

Never calculates settlement.

Never modifies reservations.

## Produces

PaymentCreated

PaymentSucceeded

PaymentFailed

RefundIssued

DepositReceived

## Consumes

ReservationConfirmed

SettlementCalculated

---

# 4.6 Tracking Domain

## Purpose

Manage real-time telematics.

Tracking never decides business state.

Tracking only reports telemetry.

> ℹ️ **Architectural Note on Domain vs. Platform**: While the Tracking Domain represents a logical bounded context in the business domain map, its physical implementation evolves into an independent infrastructure platform (**Tracking Platform**) in Phase 3+ per [`03_TrackingArchitecture.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/03_TrackingArchitecture.md) and [`07_ScalabilityRoadmap.md`](file:///c:/Users/cruzm/Documents/DEV'S-WEB/RENTAL_APP/docs/architecture/07_ScalabilityRoadmap.md).

## Owns

BikeLocation

Presence

Heartbeat

Connection State

GPS Stream

Location Buffer

Future Offline Queue

## Responsibilities

Receive GPS.

Validate coordinates.

Store telemetry.

Broadcast live location.

Maintain connection status.

Detect stale devices.

Never changes bike status.

Never closes rides.

Never validates reservations.

## Produces

BikeConnected

BikeDisconnected

HeartbeatReceived

LocationUpdated

GPSLost

## Consumes

RideStarted

RideFinished

---

# 4.7 Maintenance Domain

## Purpose

Manage the technical health of bicycles.

Maintenance is completely independent from reservations.

## Owns

Technical Status

Maintenance Orders

Repair History

Inspection History

Technician Notes

Future Battery Management

Future Component Lifecycle

## Responsibilities

Mark bicycles under maintenance.

Release bicycles.

Track repairs.

Track inspections.

Track failures.

Never decides reservation lifecycle.

Never processes payments.

## Produces

MaintenanceStarted

MaintenanceCompleted

BikeOutOfService

BikeAvailableAfterRepair

## Consumes

IncidentReported

---

# 4.8 Notification Domain

## Purpose

Centralize all outbound communications.

## Owns

Notifications

Templates

Email

Push

SMS

Future WhatsApp

## Responsibilities

Send notifications.

Queue messages.

Retry failures.

Track deliveries.

## Produces

NotificationSent

NotificationFailed

## Consumes

ReservationCreated

PaymentSucceeded

RideCompleted

MaintenanceCompleted

---

# 4.9 Route Domain

## Purpose

Manage tourism content.

## Owns

Routes

POIs

Navigation Data

Media

Audio Guides

## Responsibilities

Expose tourist routes.

Provide navigation metadata.

Manage points of interest.

Never knows reservations.

Never knows payments.

## Produces

RouteCreated

RouteUpdated

POIUpdated

---

# 4.10 Administration Domain

## Purpose

Provide operational management tools.

## Owns

Dashboards

Reports

Analytics

System Configuration

## Responsibilities

Visualize system state.

Manage reports.

Configure policies.

Never owns business data.

Only orchestrates.

---

# 5. Domain Dependencies

```

Identity

↓

Reservation

↓

Fleet

↓

Tracking

↓

Settlement

↓

Payments

↓

Notifications

```

Dependencies must always point downward.

Circular dependencies are forbidden.

---

# 6. Ownership Matrix

| Domain | Owns |
|---------|------|
| Identity | User, Roles, Permissions |
| Fleet | Bike, Station, BikeEvent |
| Reservation | Reservation, ReservationEvent |
| Settlement | Settlement Calculator, Pricing Policies |
| Payment | Payment, PaymentEvent |
| Tracking | BikeLocation, Presence |
| Maintenance | Technical Status, Repairs |
| Route | Routes, POIs |
| Notification | Notification Queue |
| Administration | Reports, Dashboards |

---

# 7. Cross-Domain Communication

Domains communicate through:

- Application Services
- Domain Events
- Message Bus (future)
- REST APIs
- WebSockets (Tracking)

Direct entity manipulation between domains is prohibited.

Example:

Reservation cannot modify Bike directly.

Reservation requests Fleet.

Fleet updates Bike.

Fleet emits BikeOperationalStatusChanged.

---

# 8. Domain Events Strategy

Events represent business facts.

Events are immutable.

Events never change.

Future versions will introduce:

ReservationEvent

PaymentEvent

BikeEvent

TrackingEvent

MaintenanceEvent

NotificationEvent

These events will become the foundation for:

- Audit Trail
- Event Replay
- Analytics
- BI
- Event Sourcing Lite

---

# 9. Future Evolution

The domain boundaries defined in this document intentionally allow the system to evolve without major refactoring.

Possible future extractions:

Fleet Service

Tracking Service

Payment Service

Notification Service

Maintenance Service

Analytics Service

These services can become independent microservices while preserving the same business contracts.

---

# 10. Architectural Principles

The following principles govern every future implementation.

1. A domain owns its data.

2. A domain never modifies another domain's entities directly.

3. Communication happens through events or application services.

4. Telemetry never changes business state.

5. Business rules always execute on the backend.

6. Mobile clients never make business decisions.

7. Operational state and technical state remain independent.

8. Financial calculations belong exclusively to Settlement.

9. Payments never calculate balances.

10. The architecture must remain event-ready.

---

# 11. Vision

Rent_App is evolving from a traditional CRUD application into a domain-driven mobility platform.

This document defines the permanent business boundaries that will guide the future implementation of:

- React Native applications
- Tracking infrastructure
- Redis Presence Server
- TimescaleDB telemetry
- IoT bicycle integration
- Event-driven architecture
- Distributed services
- High-availability deployments

Future architectural decisions must preserve these domain boundaries.