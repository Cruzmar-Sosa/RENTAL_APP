# 04_MobileArchitecture.md

> Version: 2.0
>
> Project: Rent_App
>
> Document Type:
> Mobile Platform Architecture
>
> Status:
> Living Architecture Document

---

# 1. Purpose

This document defines the architecture of the Rent_App Mobile Platform.

The objective is not simply to build a React Native application.

The objective is to design a long-term mobile platform capable of supporting future business growth while maintaining a stable architecture.

This platform is designed to operate for the next 5–10 years with minimal architectural changes.

---

# 2. Vision

The mobile application represents the operational extension of the backend.

Its responsibilities are limited to:

• User interaction

• Device capabilities

• Telemetry collection

• Offline synchronization

• Secure communication

Business decisions always remain on the backend.

---

# 3. Design Principles

The Mobile Platform follows these principles.

• Feature First

• Clean Architecture

• Offline First

• Backend Authoritative

• Event Driven

• Battery Efficient

• Testable

• Modular

• Replaceable

• Secure by Default

---

# 4. High-Level Architecture

```

              React Native

                     │

        ┌────────────┴────────────┐

        │                         │

   Presentation Layer      Native Layer

        │                         │

        ▼                         ▼

 Application Layer      GPS / Camera / Storage

        │

        ▼

 Domain Layer

        │

        ▼

 Infrastructure Layer

        │

        ▼

Backend APIs

Socket.IO

SQLite

Secure Storage

```

---

# 5. Architectural Layers

---

## Presentation Layer

Purpose

Display information.

Contains

Pages

Components

Modals

Navigation

Animations

Theme

Localization

Presentation contains no business logic.

---

## Application Layer

Coordinates application behavior.

Responsibilities

Use Cases

State Management

Navigation Flow

Permissions

Background Tasks

Synchronization

Never accesses APIs directly.

---

## Domain Layer

Represents business rules inside the mobile application.

Contains

Entities

Value Objects

Interfaces

Use Cases

Repositories

No React.

No HTTP.

No SQLite.

No Socket.IO.

Pure TypeScript.

---

## Infrastructure Layer

Implements technical services.

Examples

REST

Socket.IO

SQLite

Secure Storage

Push Notifications

GPS

Analytics

Crash Reporting

File System

---

# 6. Feature-Based Organization

The application is organized by business capabilities.

```

src/

features/

authentication/

reservation/

tracking/

fleet/

payments/

profile/

notifications/

settings/

shared/

core/

```

Each feature owns

UI

Hooks

Components

Repositories

DTOs

Services

Tests

Features are isolated.

---

# 7. State Management

State is divided into three categories.

UI State

Temporary screen state.

Business State

Reservations.

Tracking.

Authentication.

Cached State

Offline data.

Synchronization queue.

Preferred technologies

TanStack Query

Zustand

React Context (only for lightweight state)

---

# 8. Offline First

Offline support is mandatory.

The application must remain usable without internet.

Examples

Ride continues.

GPS continues.

Data is queued.

Synchronization resumes automatically.

No information is lost.

---

# 9. Local Storage Strategy

Three independent storage layers exist.

---

## SQLite

Stores

Tracking queue

Offline reservations

Cached routes

Temporary history

Never stores credentials.

---

## Secure Storage

Stores

JWT

Refresh Token

Device Identifier

Encryption Keys

Platform

Android Keystore

iOS Keychain

---

## Async Cache

Stores

Preferences

Theme

Language

Non-sensitive configuration

---

# 10. Background Tracking

Tracking continues while the application is not visible.

Android

Foreground Service

Persistent notification

Battery optimization handling

iOS

Background Location Updates

Significant Location Changes

Background Tasks

The ride never depends on the application remaining open.

---

# 11. Background Synchronization

Synchronization works independently from the UI.

Responsibilities

Retry failed uploads.

Flush SQLite queue.

Reconnect sockets.

Recover after reboot.

Maintain delivery order.

Synchronization never blocks the user interface.

---

# 12. Networking Layer

Communication priority

Socket.IO

↓

REST API

↓

Offline Queue

Socket.IO

Real-time telemetry.

REST

CRUD operations.

Queue

Offline delivery.

---

# 13. Permissions Layer

Permissions are centralized.

Examples

Location

Camera

Notifications

Bluetooth

Storage

Permissions are requested only when necessary.

---

# 14. Native Modules

The architecture allows integration of native capabilities.

Examples

GPS

Camera

BLE

Biometrics

NFC

Background Services

Battery Information

Future

IoT communication

Hardware GPS

Smart Locks

---

# 15. Push Notifications

Push Notifications are handled independently.

Supported notifications

Reservation reminders

Ride expiration

Low battery alerts

Payment reminders

Maintenance alerts

Future

Marketing campaigns

Emergency notifications

---

# 16. Deep Linking

Supported examples

Reservation Details

Bike Details

Payment

Ride Tracking

Password Recovery

Promotions

Future QR Codes

Bike Unlock

---

# 17. OTA Updates

Preferred strategy

Expo Updates

Alternative

CodePush

OTA updates are limited to JavaScript.

Native changes continue through App Store and Google Play releases.

---

# 18. Crash Reporting

Integrated crash monitoring.

Preferred providers

Firebase Crashlytics

Sentry

Every unexpected exception is reported automatically.

---

# 19. Analytics

Application analytics remain independent from business analytics.

Collected information

Screen usage

Session duration

Errors

Connectivity

Performance

No sensitive information is collected.

---

# 20. Battery Optimization

Battery consumption is treated as a first-class architectural concern.

Strategies

Adaptive GPS intervals.

Adaptive heartbeat.

Suspend inactive services.

Reduce updates while stationary.

Use significant location changes.

Never poll unnecessarily.

---

# 21. Security

Every request includes

JWT

Device Identifier

Timestamp

Nonce

Secure Storage never exposes credentials.

Sensitive information is never written to SQLite.

---

# 22. Synchronization Flow

```
GPS

↓

SQLite Queue

↓

Transmission Engine

↓

Socket.IO

↓

REST Fallback

↓

Tracking Gateway

↓

Redis Presence

↓

TimescaleDB

```

The mobile application only guarantees delivery.

The backend guarantees processing.

---

# 23. Ride Lifecycle

```
Reservation Confirmed

↓

Check-In

↓

Ride Started

↓

Tracking Session

↓

GPS Collection

↓

Offline Queue

↓

Synchronization

↓

Ride Finished

↓

Settlement

↓

Tracking Closed

```

The application never closes rides automatically.

The backend remains authoritative.

---

# 24. Scalability

The architecture supports future mobile applications.

Examples

Customer App

Technician App

Administrator App

Fleet Operator App

IoT Companion App

All applications reuse the same domain layer and backend contracts.

---

# 25. Future Evolution

The architecture is intentionally prepared for future capabilities.

Examples

WearOS

Apple Watch

Android Auto

CarPlay

Bluetooth bicycle sensors

BLE locks

Smart helmets

GPS hardware

Offline maps

AI route recommendations

Predictive maintenance

Fleet diagnostics

IoT gateways

No architectural redesign should be required.

---

# 26. Guiding Principles

The mobile platform follows these permanent rules.

1.

Business decisions belong to the backend.

2.

Offline operation is mandatory.

3.

Tracking never depends on the UI.

4.

Every feature owns its own components.

5.

Infrastructure remains replaceable.

6.

State is isolated.

7.

Networking is resilient.

8.

Battery efficiency is a core requirement.

9.

Synchronization is transparent.

10.

The platform is prepared for future hardware integrations.

---

# 27. Long-Term Vision

The Mobile Platform is not designed as a single application.

It is designed as the mobile foundation of the entire Rent_App ecosystem.

Future applications—including customer apps, technician tools, administrative consoles and IoT integrations—should reuse the same architectural principles while remaining independently deployable.

This document establishes the long-term blueprint for every mobile product developed within the Rent_App platform.