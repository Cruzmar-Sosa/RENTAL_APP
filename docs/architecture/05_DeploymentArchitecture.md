# 05_DeploymentArchitecture.md

> Version: 2.0
>
> Project: Rent_App
>
> Document Type:
> Enterprise Cloud & Deployment Architecture
>
> Status:
> Living Architecture Document

---

# 1. Purpose

This document defines the cloud architecture of the Rent_App platform.

Unlike a traditional deployment guide, this document focuses on the long-term architectural vision of the platform rather than the current hosting providers.

Its purpose is to establish a deployment strategy capable of supporting future growth, high availability, distributed services, mobile applications, IoT integrations and large fleet operations.

---

# 2. Deployment Philosophy

Deployment is treated as an implementation concern.

Business Architecture remains independent from infrastructure providers.

The platform must be deployable on any cloud provider without requiring changes to the business domains.

Examples:

- AWS
- Azure
- Google Cloud
- DigitalOcean
- Render
- Railway
- Kubernetes

Infrastructure should never dictate business design.

---

# 3. Current Deployment

Current production deployment is intentionally simple.

Frontend

- Vercel

Business Platform

- Render

Business Database

- PostgreSQL (Supabase)

Storage

- Supabase Storage

Although this architecture is sufficient for the current project stage, it is not considered the target production architecture.

---

# 4. Target Cloud Architecture

The target architecture separates responsibilities into independent platforms.

```text
                           INTERNET

                                │

                    Cloudflare Edge Network

          CDN • SSL • WAF • Cache • DDoS Protection

                                │

                  Reverse Proxy / API Gateway

                                │

      ┌─────────────────────────┼──────────────────────────┐

      │                         │                          │

   Web Platform          Mobile Platform          Future Admin Apps

      │                         │                          │

      └─────────────────────────┼──────────────────────────┘

                                │

====================== BUSINESS PLATFORM ======================

                        Business API

                         (NestJS)

    Auth

    Users

    Fleet

    Reservations

    Payments

    Settlement

    Routes

    Notifications

===============================================================

====================== TRACKING PLATFORM ======================

                  Tracking Gateway

                  Presence Server

                  Tracking Processor

                  Live Dashboard Publisher

===============================================================

======================== DATA PLATFORM ========================

Redis Cluster

↓

TimescaleDB

↓

PostgreSQL

↓

Supabase Storage

===============================================================

===================== OBSERVABILITY ===========================

Logging

Metrics

Tracing

Health Checks

Alerts

===============================================================

======================== CI/CD ================================

GitHub

↓

GitHub Actions

↓

Docker

↓

Production

===============================================================
```

---

# 5. Cloud Strategy

The architecture follows a Cloud Native approach.

Principles:

- Stateless services
- Horizontal scalability
- Independent deployments
- Immutable infrastructure
- Container-first philosophy
- Infrastructure as Code readiness

---

# 6. Edge Layer

The Edge Layer is the first entry point into the platform.

Responsibilities:

- SSL termination
- CDN
- Static asset caching
- Rate limiting
- Bot protection
- Web Application Firewall (WAF)
- DDoS mitigation
- Global routing

Recommended provider:

Cloudflare

---

# 7. Networking

Communication inside the platform follows secure HTTPS connections.

External communication:

HTTPS

WebSocket Secure (WSS)

Internal communication:

Private Network

Encrypted traffic

No internal service should be publicly exposed unless explicitly required.

---

# 8. Reverse Proxy

The Reverse Proxy centralizes access to every platform.

Responsibilities:

- Route requests
- Hide internal topology
- SSL
- Authentication forwarding
- Header normalization

Examples:

NGINX

Traefik

Cloudflare Tunnel

---

# 9. API Gateway

The API Gateway represents the single public entry point.

Responsibilities:

Authentication

Authorization

Rate limiting

API versioning

Future:

Service discovery

Traffic routing

Request transformation

---

# 10. Business Platform

The Business Platform owns every business operation.

Responsibilities:

Authentication

Fleet Management

Reservations

Payments

Settlement

Stations

Routes

Notifications

Business Rules

The Business Platform never processes GPS telemetry directly.

---

# 11. Tracking Platform

Tracking is treated as an independent platform.

Responsibilities:

Receive GPS updates

Validate tracking sessions

Maintain online presence

Publish live locations

Persist historical telemetry

Future IoT integrations

Tracking never owns reservation logic.

---

# 12. Platform Communication

Business Platform and Tracking Platform communicate through well-defined APIs.

Current:

REST

Socket.IO

Future:

Message Broker

Domain Events

The two platforms remain loosely coupled.

---

# 13. REST Strategy

REST is responsible for transactional business operations.

Examples:

Authentication

CRUD

Reservations

Payments

Fleet administration

REST should never transport continuous telemetry.

---

# 14. Real-Time Communication Strategy

Real-time communication is dedicated to telemetry.

Current:

Socket.IO

Future supported transports:

MQTT

gRPC Streaming

HTTP/3

QUIC

The Tracking Engine remains independent from transport technology.

---

# 15. Business Database

Business information is stored separately.

Technology:

PostgreSQL

Current provider:

Supabase

Stores:

Users

Reservations

Payments

Stations

Fleet

Permissions

Business Events

Business integrity always has priority over performance.

---

# 16. Tracking Database

Tracking information has different characteristics.

Recommended technology:

TimescaleDB

Stores:

GPS history

Routes

Telemetry

Ride history

Heatmaps

Historical analytics

Time-series optimization

Tracking data is optimized for write throughput.

---

# 17. Redis Cluster

Redis acts as the Presence Platform.

Responsibilities:

Current bike location

Online sessions

Last heartbeat

Socket sessions

Presence status

Temporary caches

Redis is not considered permanent storage.

---

# 18. Object Storage

Object Storage stores binary assets.

Technology:

Supabase Storage

Stores:

Bike images

Documents

Future media

Database only stores object references.

---

# 19. Mobile Clients

Mobile applications interact with both platforms.

Responsibilities:

Authentication

Ride operations

GPS collection

Offline synchronization

Push notifications

The mobile application never decides business state.

---

# 20. Web Clients

Web applications are primarily administrative.

Responsibilities:

Fleet visualization

Reservation management

Settlement

Reporting

Dashboard

---

# 21. Future Administrative Applications

Architecture allows additional clients.

Examples:

Technician App

Fleet Operator App

Maintenance Console

IoT Console

Analytics Portal

---

# 22. Authentication Flow

Authentication is centralized.

JWT

Refresh Tokens

Secure Storage

Role-based permissions

Every platform validates tokens independently.

---

# 23. Tracking Flow

Tracking lifecycle:

GPS

↓

Tracking Engine

↓

Transport Layer

↓

Tracking Gateway

↓

Redis

↓

TimescaleDB

↓

Dashboard

---

# 24. Business Flow

Business lifecycle:

Client

↓

Business Platform

↓

PostgreSQL

↓

Domain Events

↓

Notifications

---

# 25. Infrastructure Layer

Infrastructure remains replaceable.

Preferred deployment:

Docker Containers

Future:

Kubernetes

Container orchestration remains independent from application logic.

---

# 26. CI/CD

Source Control:

GitHub

Continuous Integration:

GitHub Actions

Deployment:

Docker

Automated Testing

Production Release

Infrastructure validation

---

# 27. Environment Strategy

Every environment is isolated.

Development

Testing

Staging

Production

Environment variables remain external to source code.

---

# 28. Secrets Management

Sensitive information includes:

JWT Secrets

Database credentials

API Keys

Storage Keys

Secrets are never committed to the repository.

---

# 29. Observability

Observability is considered mandatory.

Components:

Logs

Metrics

Tracing

Alerts

Health monitoring

---

# 30. Logging

Application logs should be centralized.

Future providers:

Grafana Loki

Elastic Stack

Cloud Logging

Logs must be structured.

---

# 31. Metrics

Operational metrics include:

CPU

Memory

API latency

Tracking latency

Database performance

Redis usage

Socket connections

---

# 32. Distributed Tracing

Future distributed tracing:

OpenTelemetry

Jaeger

Zipkin

Tracing becomes essential as services are separated.

---

# 33. Backups

Business data:

Daily backups

Tracking data:

Retention policy

Storage:

Versioned backups

Backup validation should be automated.

---

# 34. Disaster Recovery

Recovery objectives:

Minimal downtime

Minimal data loss

Automated restoration

Documented recovery procedures

---

# 35. Horizontal Scalability

Every platform must scale independently.

Business Platform

Tracking Platform

Redis

TimescaleDB

PostgreSQL

Object Storage

Scaling one platform must never require scaling all others.

---

# 36. High Availability

Future production deployments should support:

Multiple instances

Automatic failover

Load balancing

Redundant databases

Health checks

---

# 37. Multi-Region Vision

Long-term architecture supports:

Regional deployments

Edge routing

Regional Redis

Regional tracking ingestion

Global business platform

---

# 38. Event-Driven Evolution

Future architecture introduces asynchronous communication.

Examples:

Reservation Events

Bike Events

Payment Events

Tracking Events

Future technologies:

Kafka

RabbitMQ

NATS

The Business Platform and Tracking Platform remain event-ready.

---

# 39. Architectural Principles

The deployment architecture follows these permanent principles.

1. Platforms own responsibilities.

2. Infrastructure is replaceable.

3. Tracking is independent.

4. Business logic remains centralized.

5. Services are stateless.

6. Data ownership is explicit.

7. Cloud providers are implementation details.

8. Edge protects the platform.

9. Observability is mandatory.

10. Scalability is designed, not added later.

---

# 40. Long-Term Vision

Rent_App is evolving toward a distributed mobility platform.

Rather than a traditional web application, the platform is composed of independent business and operational capabilities that can evolve separately while maintaining a unified domain model.

This architecture establishes the technological foundation for future mobile applications, IoT devices, GPS hardware, fleet expansion, distributed deployments and large-scale operations without requiring architectural redesign.