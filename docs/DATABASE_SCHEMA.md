# HealthPassport Pro — Database Schema

Status: Phase 0 · Owner: Principal Architect · Engine: PostgreSQL via Prisma

This specifies the V1 data model. It is implemented as `prisma/schema.prisma` in
Phase 2. All clinical tables follow shared conventions (§1) and use **soft
delete**. Sensitive create/update/delete/export actions are recorded in
`AuditLog`.

---

## 1. Conventions for every clinical table

Every clinical record table includes:

| Column | Type | Notes |
|--------|------|-------|
| `id` | `String @id @default(cuid())` | Stable primary key |
| `userId` | `String` | Owner; FK → `User.id`; **every query scopes by this** |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | |
| `deletedAt` | `DateTime?` | **Soft delete**; non-null = hidden |
| `source` | `Source` enum | How the record entered (see §3) |
| `notes` | `String?` | Optional free-text (PHI) |

Rules:
- **Soft delete**: clinical rows are never hard-deleted in normal use; queries
  filter `deletedAt: null`. Hard erasure happens only via the privacy "erase my
  data" flow (see [`PRIVACY_MODEL.md`](PRIVACY_MODEL.md)).
- **Ownership**: `userId` is indexed on every clinical table; the data layer
  refuses queries not scoped to the session user.
- **Indexes**: at minimum `@@index([userId, createdAt])`; time-series tables add
  `@@index([userId, type, recordedAt])`.

## 2. Entity overview (18 models)

`User`, `PatientProfile`, `Condition`, `Medication`, `Allergy`,
`VitalObservation`, `LabResult`, `SymptomEntry`, `DailyCheckIn`, `Document`,
`Encounter`, `CarePlan`, `Reminder`, `DoctorReport`, `AuditLog`, `Consent`,
`UserSettings`, `EmergencyContact`.

```
User 1───1 PatientProfile
User 1───1 UserSettings
User 1───* Condition, Medication, Allergy, VitalObservation, LabResult,
           SymptomEntry, DailyCheckIn, Document, Encounter, CarePlan,
           Reminder, DoctorReport, Consent, EmergencyContact, AuditLog
Encounter 1───* (optional links from Document, Condition via encounterId)
```

## 3. Enums

- `Role`: `PATIENT` (V1). Reserved: `CAREGIVER`, `PHYSICIAN`, `CLINIC_ADMIN`, `CARE_COORDINATOR`.
- `Source`: `PATIENT_ENTERED`, `DEVICE`, `IMPORTED`, `CLINICIAN` (reserved).
- `ClinicalStatus`: `ACTIVE`, `RESOLVED`, `REMISSION`, `INACTIVE`.
- `MedicationStatus`: `ACTIVE`, `STOPPED`, `COMPLETED`.
- `Criticality`: `LOW`, `HIGH`, `UNABLE_TO_ASSESS`.
- `VitalType`: `BLOOD_PRESSURE`, `GLUCOSE`, `WEIGHT`, `HEART_RATE`, `TEMPERATURE`, `SPO2`, `WAIST`.
- `LabType`: `HBA1C`, `LDL`, `HDL`, `TRIGLYCERIDES`, `TOTAL_CHOLESTEROL`, `CREATININE`, `EGFR`, `UACR`, `POTASSIUM`.
- `ConsentType`: `TERMS`, `PRIVACY`, `MEDICAL_DISCLAIMER`, `OFFLINE_SUMMARY`, `DATA_PROCESSING`.
- `AuditAction`: `CREATE`, `UPDATE`, `DELETE`, `EXPORT`, `LOGIN`, `LOGOUT`, `CONSENT_CHANGE`.
- `ReminderType`: `MEDICATION`, `MEASUREMENT`, `APPOINTMENT`, `PREVENTIVE`.

## 4. Models

### User (auth identity)
`id`, `email @unique`, `emailVerified?`, `passwordHash?` (if credentials auth),
`role: Role @default(PATIENT)`, `createdAt`, `updatedAt`, `deletedAt?`.
Relations to all clinical tables + NextAuth `Account`/`Session` tables.
> Auth-managed tables (`Account`, `Session`, `VerificationToken`) follow the
> NextAuth Prisma adapter schema.

### PatientProfile (1:1 with User)
`userId @unique`, `givenName?`, `familyName?`, `birthDate?`, `sex?`,
`preferredLanguage?`, `heightCm?`, `unitsSystem` (metric/imperial),
plus shared columns. No `source` needed (profile is patient-owned).

### Condition (problem list)
`code` (SNOMED), `icd10?`, `display`, `clinicalStatus: ClinicalStatus`,
`onsetDate?`, `encounterId?`, + shared columns.
`@@index([userId, clinicalStatus])`.

### Medication
`name`, `rxnorm?`, `atc?`, `dosageText?`, `status: MedicationStatus`,
`startDate?`, `endDate?`, `adherenceNote?`, + shared columns.
`@@index([userId, status])`.

### Allergy
`substance`, `code?` (SNOMED/RxNorm), `criticality: Criticality?`,
`reaction?`, + shared columns.

### VitalObservation (time-series)
`type: VitalType`, `valueNumeric?`, `valueSecondary?` (e.g. diastolic),
`unit`, `recordedAt`, + shared columns.
`@@index([userId, type, recordedAt])`. **Partition candidate at scale.**

### LabResult (time-series)
`type: LabType`, `value`, `unit`, `recordedAt`, `referenceLow?`,
`referenceHigh?`, + shared columns.
`@@index([userId, type, recordedAt])`.

### SymptomEntry
`description`, `severity?` (1–10), `redFlagCodes: String[]` (matched red flags),
`recordedAt`, + shared columns.
`@@index([userId, recordedAt])`.

### DailyCheckIn
`date` (one per day), `mood?`, `medicationTaken?: Boolean`,
`vitalsLoggedRef?`, `note?`, + shared columns.
`@@unique([userId, date])`.

### Document (metadata only; bytes in object storage)
`title`, `mimeType`, `sizeBytes`, `storageKey` (S3 object key),
`checksumSha256`, `encounterId?`, `category?`, + shared columns.
`@@index([userId, createdAt])`. **No file bytes in the database.**

### Encounter (visit)
`type` (e.g. office/lab/telehealth), `occurredAt`, `provider?`, `reason?`,
`summary?`, + shared columns.
`@@index([userId, occurredAt])`.

### CarePlan
`title`, `conditionRef?`, `goals: Json`, `activities: Json`, `status`,
+ shared columns.

### Reminder
`type: ReminderType`, `label`, `schedule` (cron/RRULE-ish string), `active`,
`nextRunAt?`, + shared columns.
`@@index([userId, active, nextRunAt])`.

### DoctorReport (generated summary record)
`generatedAt`, `format` (`PDF`/`JSON`/`FHIR`), `storageKey?`, `summaryJson: Json`,
+ shared columns. Generating/exporting one writes an `AuditLog EXPORT` row.

### AuditLog (append-only)
`userId`, `action: AuditAction`, `entityType?`, `entityId?`, `ip?`,
`userAgent?`, `metadata: Json?`, `createdAt`.
`@@index([userId, createdAt])`, `@@index([action, createdAt])`.
> Append-only by policy; no `updatedAt`/`deletedAt`. Consider a periodic
> integrity hash chain (as in the prototype) for tamper evidence.

### Consent
`type: ConsentType`, `granted: Boolean`, `version` (policy version),
`grantedAt?`, `revokedAt?`, + shared columns.
`@@index([userId, type])`. Backs granular, versioned, revocable consent.

### UserSettings (1:1)
`userId @unique`, `locale`, `theme`, `unitsSystem`, `notificationsEnabled`,
`offlineSummaryConsent: Boolean`, + timestamps.

### EmergencyContact
`name`, `relationship?`, `phone`, `isPrimary: Boolean`, + shared columns.

## 5. Referential integrity & cascade

- Clinical rows FK to `User` with `onDelete: Cascade` **only** for the hard
  erasure flow; normal deletes are soft.
- `encounterId`, `conditionRef` are nullable soft links.

## 6. Migrations & seed

- Migrations via `prisma migrate` (dev) / `prisma migrate deploy` (prod).
- `prisma/seed.ts` seeds reference data (value sets, guide content pointers) and,
  in development only, a demo patient. **No real PHI in seeds.**

## 7. Indexing summary (scale)

| Table | Key indexes |
|-------|-------------|
| VitalObservation, LabResult | `(userId, type, recordedAt)` |
| SymptomEntry, Encounter, Document | `(userId, recordedAt/createdAt)` |
| Condition, Medication | `(userId, status)` |
| AuditLog | `(userId, createdAt)`, `(action, createdAt)` |
| Consent | `(userId, type)` |

See [`SCALABILITY_PLAN.md`](SCALABILITY_PLAN.md) for partitioning and read-replica
strategy.
