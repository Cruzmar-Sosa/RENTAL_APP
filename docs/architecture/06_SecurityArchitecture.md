# Security Architecture

**Project:** Rent_App  
**Document:** Security Architecture  
**Version:** 2.0  
**Status:** Draft (Living Document)

---

# 1. Purpose

This document defines the security architecture of Rent_App.

Its purpose is to establish a consistent security model across every platform that composes the ecosystem.

Security is not considered a separate layer.

Security is part of every business domain.

Every service, component, API, mobile application and infrastructure element follows the principles described in this document.

---

# 2. Security Vision

Rent_App follows a Zero Trust Architecture.

Nothing is trusted by default.

Every request must be validated.

Every state transition must be authorized.

Every business event must be auditable.

Every sensitive operation must be traceable.

The backend always remains the single source of truth.

---

# 3. Security Principles

The entire platform follows these principles.

## Zero Trust

Every request is authenticated.

Every request is authorized.

No client is inherently trusted.

---

## Server Authoritative

Clients never decide business state.

Clients only send information.

Business Platform validates everything.

Examples:

Reservation status

Bike operational state

Financial settlement

Payment validation

Tracking session ownership

---

## Defense in Depth

Security exists in multiple layers.

Client Validation

↓

API Validation

↓

Authentication

↓

Authorization

↓

Business Validation

↓

Database Constraints

↓

Audit Events

---

## Least Privilege

Every user receives the minimum permissions required.

Permissions are additive.

Administrative operations require explicit authorization.

---

## Immutable Auditing

Business history cannot be modified.

Reservation events

Bike events

Payment events

Tracking events (future)

remain immutable.

---

# 4. Security Domains

Security responsibilities are separated into domains.

## Identity Domain

Authentication

Sessions

JWT

Password policies

Future MFA

---

## Authorization Domain

Roles

Permissions

Permission Overrides

Future Attribute-Based Access Control

---

## Business Platform Security

Reservations

Payments

Fleet Management

Stations

Routes

Administration

---

## Tracking Platform Security

GPS Validation

Presence

Redis

Telemetry

Tracking Sessions

---

## Infrastructure Security

Databases

Storage

Networking

Secrets

Deployment

Monitoring

---

# 5. Authentication Architecture

Current implementation

JWT Access Token

Password Hashing (bcrypt)

Stateless Authentication

Future roadmap

Refresh Tokens

Device Sessions

MFA

Passwordless Authentication

OAuth Providers

Google

Apple

Microsoft

---

# 6. Authorization Architecture

Current model

Role Based Access Control (RBAC)

Roles

USER

ADMIN

INVITED

Permissions

Module

Action

Type

Permission Overrides

UserPermission

RolePermission

Future

Attribute Based Access Control (ABAC)

Context-aware permissions

Location-aware permissions

Time-based permissions

---

# 7. API Security

Every endpoint follows the same security pipeline.

Incoming Request

↓

Validation Pipe

↓

DTO Validation

↓

UUID Validation

↓

Authentication Guard

↓

Authorization Guard

↓

Business Validation

↓

Service Layer

↓

Database Transaction

↓

Audit Event

↓

Response

---

Validation Rules

UUID validation

DTO validation

Whitelisting

Transformation

Rate limiting (future)

Idempotency

Optimistic validation

Transactional validation

---

# 8. Business Platform Security

The Business Platform owns every business decision.

It validates

Reservation lifecycle

Payment lifecycle

Settlement lifecycle

Bike operational state

Permission checks

Financial consistency

No client can bypass these validations.

---

# 9. Tracking Platform Security

Tracking data is considered telemetry.

Telemetry never changes business state directly.

Tracking Platform validates

GPS precision

Timestamp consistency

Session ownership

Bike existence

Reservation ownership

Device connectivity

Impossible routes (future)

GPS spoofing detection (future)

Speed anomalies (future)

---

# 10. Mobile Security

The mobile application follows a secure architecture.

Authentication Tokens

Stored securely

Never hardcoded

Never exposed

Future

Encrypted Secure Storage

Biometric Authentication

Certificate Pinning

Offline Encryption

Jailbreak Detection

Root Detection

---

# 11. Database Security

Rent_App separates operational responsibilities across multiple storage technologies.

Business Database

PostgreSQL (Supabase)

Responsible for

Users

Reservations

Payments

Fleet

Permissions

Stations

Ride Summary Metadata (ride_id, start_time, end_time)

Historical Tracking Storage

TimescaleDB

Responsible for

Historical GPS

Telemetry

Route reconstruction

Analytics

Live Presence Cache

Redis

Responsible for

Online sessions

Current location

Presence state

Realtime synchronization

---

# 12. Storage Security

Bike images are stored outside PostgreSQL.

Current

Supabase Storage

Database only stores

imageKey

Storage Layer builds public URLs dynamically.

Future

Private buckets

Signed URLs

Image validation

Malware scanning

---

# 13. Secrets Management

Sensitive information never exists inside source code.

Current

.env

Render Environment Variables

Git Ignore

Future

Vault

Cloud Secret Manager

Key Rotation

---

# 14. Audit Architecture

Every important action generates immutable events.

ReservationEvent

Reservation lifecycle

PaymentEvent

Payment lifecycle

BikeEvent

Operational changes

Technical changes

Future

TrackingEvent

PermissionEvent

AuthenticationEvent

SecurityEvent

---

# 15. Logging Strategy

Every service produces structured logs.

Log Categories

Business

Tracking

Payments

Authentication

Infrastructure

Every log should include

Timestamp

Correlation ID

User ID

Bike ID

Reservation ID

Service

Operation

---

# 16. Monitoring

Future monitoring stack

OpenTelemetry

Prometheus

Grafana

Loki

Jaeger

Metrics

API latency

Tracking latency

Socket connections

Settlement duration

GPS throughput

Redis health

Timescale performance

---

# 17. Threat Model

| Threat | Risk | Mitigation |
|----------|------|------------|
| GPS Spoofing | High | Telemetry validation |
| Token Theft | High | Secure Storage |
| Replay Attack | Medium | Timestamp validation |
| SQL Injection | Low | Prisma ORM |
| Privilege Escalation | High | RBAC |
| Session Hijacking | High | JWT validation |
| Fake Tracking Device | High | Device registration (future) |
| Payment Manipulation | Critical | Server-authoritative settlement |

---

# 18. Incident Response

Security incidents follow a standardized process.

Detection

↓

Classification

↓

Containment

↓

Recovery

↓

Root Cause Analysis

↓

Documentation

↓

Corrective Actions

---

# 19. Disaster Recovery

Critical services

Business Platform

Tracking Platform

Redis

TimescaleDB

Supabase

Storage

Future

Automated backups

Point-in-time recovery

Cross-region replication

Disaster recovery drills

---

# 20. Compliance

Architecture prepared for

GDPR

PII protection

Auditability

Data retention

Future ISO 27001 alignment

---

# 21. Security Roadmap

Current

JWT

RBAC

DTO Validation

Audit Events

Supabase Security

Next Iteration

Refresh Tokens

Redis Session Store

API Rate Limiting

Structured Logging

Tracking Validation

Future

OAuth

MFA

Certificate Pinning

Device Registration

IoT Authentication

mTLS

API Gateway Policies

Zero Trust Networking

---

# Conclusion

Security is considered a foundational capability of Rent_App.

Rather than relying on isolated security controls, the platform incorporates security into every layer of the architecture—from client applications and APIs to business logic, infrastructure, tracking services and future IoT integrations.

This document defines the principles that ensure the platform remains secure, auditable, scalable and maintainable as it evolves into a distributed mobility ecosystem.