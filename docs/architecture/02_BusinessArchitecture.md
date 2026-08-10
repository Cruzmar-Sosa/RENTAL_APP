# 02_BusinessArchitecture.md

> Version: 2.0
>
> Project: Rent_App
>
> Document Type:
> Business Architecture
>
> Status:
> Living Architecture Document

---

# 1. Purpose

This document describes how Rent_App operates from a business perspective.

Unlike the Domain Architecture, which defines software ownership, this document defines business processes.

It represents how the company rents bicycles, manages customers, calculates settlements, performs tracking and operates its fleet.

Every software component exists only to support these business processes.

---

# 2. Business Vision

Rent_App is a mobility platform designed to manage electric bicycle rentals.

The platform coordinates four major business activities:

• Fleet Management

• Customer Rental Experience

• Financial Operations

• Real-Time Operations

Each one has independent workflows but all contribute to the same customer journey.

---

# 3. Business Actors

## Customer

The customer rents bicycles.

Responsibilities

• Register

• Reserve bicycles

• Check in

• Ride

• Return bicycles

• Pay balances

---

## Administrator

Responsible for operating the business.

Responsibilities

• Manage fleet

• Manage reservations

• Monitor tracking

• Resolve incidents

• Complete settlements

• Configure routes

---

## Maintenance Technician (Future)

Responsible for bicycle health.

Responsibilities

• Inspect bicycles

• Repair bicycles

• Return bicycles to service

---

## Tracking System

Represents the mobile application or future IoT device.

Responsibilities

• Send GPS

• Report connectivity

• Report battery

• Report telemetry

Never performs business decisions.

---

## Payment Provider

External financial service.

Examples

Stripe

BAC

Lafise

PayPal

Future local gateways

---

# 4. Core Business Capabilities

Rent_App is composed of nine business capabilities.

---

## Identity Management

Purpose

Identify platform users.

Capabilities

• Authentication

• Authorization

• Roles

• Permissions

---

## Fleet Management

Purpose

Manage company assets.

Capabilities

• Bike inventory

• Station inventory

• Operational availability

• Technical availability

---

## Reservation Management

Purpose

Convert customer demand into rides.

Capabilities

• Reservation

• Availability validation

• Check-in

• Ride lifecycle

• Reservation expiration

---

## Ride Operations

Purpose

Manage the physical rental experience.

Capabilities

• Ride start

• Ride completion

• GPS association

• Operational synchronization

---

## Financial Operations

Purpose

Determine how much must be charged.

Capabilities

• Settlement calculation

• Overtime calculation

• Credits

• Incidents

• Refund recommendations

---

## Payment Processing

Purpose

Move money.

Capabilities

• Deposits

• Full payment

• Balance payment

• Refunds

---

## Fleet Monitoring

Purpose

Know where every bicycle is.

Capabilities

• Live GPS

• Presence

• Connection monitoring

• Historical tracking

---

## Maintenance

Purpose

Maintain operational quality.

Capabilities

• Repairs

• Maintenance history

• Inspections

• Technical status

---

## Analytics

Purpose

Provide operational intelligence.

Capabilities

• Revenue

• Fleet utilization

• Heat maps

• Ride statistics

• Incident analysis

---

# 5. Customer Journey

The customer journey represents the complete experience.

```
Customer

↓

Register

↓

Browse Bikes

↓

Select Bike

↓

Create Reservation

↓

Receive Confirmation

↓

Arrive at Station

↓

Check-In

↓

Ride Starts

↓

Ride Ends

↓

Settlement Calculation

↓

Additional Payment (if needed)

↓

Reservation Closed
```

---

# 6. Fleet Lifecycle

Every bicycle follows a business lifecycle.

```
Bike Created

↓

Assigned to Station

↓

Available

↓

Reserved

↓

Checked-In

↓

In Ride

↓

Returned

↓

Available Again
```

Technical lifecycle is completely independent.

```
OK

↓

Maintenance

↓

Out Of Service

↓

OK
```

Operational lifecycle never changes technical lifecycle.

Technical lifecycle never changes reservation lifecycle.

---

# 7. Reservation Lifecycle

```
Reservation Created

↓

Confirmed

↓

Check-In

↓

Ride Started

↓

Ride Completed

↓

Settlement Pending

↓

Settled

↓

Closed
```

Possible alternative paths

```
Cancelled

Expired

No Show
```

---

# 8. Financial Lifecycle

Financial processing is independent.

```
Estimated Cost

↓

Payments Received

↓

Ride Finished

↓

Settlement Calculation

↓

Balance Generated

↓

Additional Payment

↓

Financial Settlement

↓

Completed
```

Financial operations never modify reservations directly.

---

# 9. Tracking Lifecycle

Tracking begins only after the ride starts.

```
Ride Started

↓

Tracking Session Created

↓

Heartbeat

↓

GPS Updates

↓

Temporary Disconnect

↓

Reconnect

↓

Ride Finished

↓

Tracking Closed

↓

Historical Route Stored
```

Tracking never determines business state.

Tracking only reports telemetry.

---

# 10. Maintenance Lifecycle

```
Bike Inspection

↓

Maintenance Required

↓

Repair

↓

Validation

↓

Operational Release

↓

Available Again
```

Reservations cannot bypass maintenance.

---

# 11. Business Rules

## Reservation Rules

A bicycle cannot be reserved if

• Reserved

• Checked-In

• In Use

• Maintenance

• Out Of Service

---

## Tracking Rules

Tracking only exists while a ride is active.

Tracking sessions expire automatically.

Offline periods are tolerated.

Business decisions never originate from telemetry.

---

## Financial Rules

Settlement is calculated only after the ride finishes.

Payments never calculate balances.

Settlement never captures payments.

---

## Fleet Rules

Operational status belongs to Fleet.

Technical status belongs to Maintenance.

Reservation status belongs to Reservation.

Financial status belongs to Settlement.

Ownership cannot overlap.

---

# 12. Business Events

Major business events.

ReservationCreated

ReservationConfirmed

RideCheckedIn

RideStarted

RideFinished

SettlementCalculated

BalanceGenerated

PaymentCompleted

BikeOperationalChanged

MaintenanceStarted

MaintenanceCompleted

BikeConnected

BikeDisconnected

NotificationSent

Every event represents a completed business fact.

---

# 13. Cross Business Processes

Several capabilities collaborate.

Ride Process

```
Reservation

↓

Fleet

↓

Tracking

↓

Settlement

↓

Payment

↓

Notification
```

Maintenance Process

```
Maintenance

↓

Fleet

↓

Notification
```

Tracking Process

```
Tracking

↓

Fleet Dashboard

↓

Analytics
```

---

# 14. Operational Dashboard

The administrator operates the company through one unified dashboard.

Business areas

Fleet

Reservations

Tracking

Payments

Settlement

Maintenance

Routes

Analytics

Notifications

Each dashboard visualizes information.

None of them own business logic.

---

# 15. Future Business Evolution

The architecture is prepared for future capabilities.

Examples

• Subscription plans

• Corporate customers

• Memberships

• Loyalty programs

• Dynamic pricing

• Surge pricing

• IoT bicycles

• GPS hardware

• Battery swap management

• Predictive maintenance

• AI route recommendations

• Automatic fraud detection

• Fleet balancing

These capabilities extend existing business processes without changing their foundations.

---

# 16. Business Principles

The following principles guide every future implementation.

1.

The customer experiences one continuous rental journey.

2.

Every business capability owns a single responsibility.

3.

Money is calculated before it is charged.

4.

Telemetry never replaces business rules.

5.

Business decisions always execute on the server.

6.

Operational state is independent from technical state.

7.

Payments do not calculate financial balances.

8.

Tracking does not control reservations.

9.

Maintenance does not control customers.

10.

Every workflow must remain auditable.

---

# 17. Long-Term Vision

Rent_App is designed to evolve beyond a bicycle rental platform.

Its business architecture supports future expansion into:

• Scooter rentals

• Motorcycle rentals

• Vehicle sharing

• Tourism experiences

• Corporate mobility

• University campuses

• Smart cities

• IoT-connected fleets

The objective is to preserve stable business processes while allowing technology to evolve independently.