---
trigger: always_on
---

# DATABASE & PRISMA SAFETY RULES (Supabase + Prisma)

## Source of Truth

The canonical source of the database schema is always:

- `prisma/schema.prisma`

The database is **never** the source of truth.

---

# Prisma Migration Workflow

Whenever `schema.prisma` is modified, ALWAYS execute the following workflow:

1.

```bash
npx prisma validate
```

2.

```bash
npx prisma migrate dev --name <descriptive_migration_name>
```

Examples:

```bash
npx prisma migrate dev --name add_settlement_fields
```

```bash
npx prisma migrate dev --name split_bike_status
```

3.

```bash
npx prisma generate
```

4.

Only if seed data changed:

```bash
npx prisma db seed
```

5.

Verify migration status:

```bash
npx prisma migrate status
```

Database must report:

> Database schema is up to date.

---

# Mandatory Validation

Before generating any migration, ALWAYS:

- Validate `schema.prisma`
- Review current migration history
- Check for pending migrations
- Ensure no migration conflicts exist
- Ensure Prisma Client can be generated

---

# Forbidden Operations

Never execute automatically:

```bash
prisma db push
```

```bash
prisma db pull
```

```bash
prisma migrate reset
```

Deleting:

```
prisma/migrations/
```

Editing already applied migration.sql files.

Creating new baseline migrations without explicit approval.

Using database introspection as a way to "fix" migration problems.

---

# Migration Conflict Policy

If a migration conflict is detected:

DO NOT attempt automatic fixes.

Instead:

1. Explain the root cause.
2. Analyze migration history.
3. Propose the minimum safe solution.
4. Wait for user approval before executing destructive operations.

Never solve migration issues by resetting the database.

---

# Schema Modification Rules

Every schema modification must:

- Preserve existing data whenever possible.
- Prefer additive changes over destructive ones.
- Use explicit Prisma migrations.
- Keep backward compatibility during refactors.
- Avoid unnecessary column renames.
- Avoid dropping columns unless explicitly approved.

---

# Seed Rules

Seed files must always be:

- Idempotent
- Safe to execute multiple times
- Based on `upsert` whenever possible
- Compatible with the current Prisma schema
- Updated whenever required fields are introduced

Never assume existing seed data.

---

# Supabase Rules

Treat Supabase as the production-like database.

Never manually modify tables using the Supabase dashboard if the same change should exist in Prisma migrations.

All structural database changes must originate from Prisma.

Use Supabase dashboard only for:

- inspecting data
- debugging
- monitoring
- manual data verification

Never use it as the migration tool.

---

# Development Rules

After every migration:

Run:

```bash
npx prisma generate
```

Verify:

```bash
npm run build
```

Ensure:

- Backend builds successfully.
- Frontend builds successfully.
- Prisma Client has no type errors.

---

# Before Finishing Any Database Task

Verify:

- Prisma Validate ✔
- Prisma Generate ✔
- Prisma Migration Status ✔
- Backend Build ✔
- Frontend Build ✔
- Seed Compatibility ✔

---

# Recovery Policy

If any Prisma or migration error appears:

STOP.

Do not attempt automatic repair.

Report:

- root cause
- affected migration
- affected models
- safest recovery strategy

Wait for user confirmation before any destructive operation.

---

# Goal

Maintain:

- clean migration history
- zero migration drift
- zero schema corruption
- deterministic deployments
- reproducible development environments
- production-safe database evolution
