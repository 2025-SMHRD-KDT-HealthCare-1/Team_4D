# API Reference

Base URL: `/api`

## Error format

All errors:

```json
{
  "message": "...",
  "code": "..."
}
```

## Auth

### POST `/auth/signup`
Request:

```json
{ "email": "guardian1@example.com", "password": "abcd1234", "name": "Guardian", "role": "GUARDIAN" }
```

Response `201`:

```json
{ "user_id": 1, "email": "guardian1@example.com", "name": "Guardian", "role": "GUARDIAN", "created_at": "2026-02-20T00:00:00.000Z" }
```

### POST `/auth/login`
Request:

```json
{ "email": "guardian1@example.com", "password": "abcd1234" }
```

Response `200`:

```json
{ "user": { "user_id": 1, "role": "GUARDIAN", "name": "Guardian", "email": "guardian1@example.com" } }
```

### GET `/auth/me`
Response `200`:

```json
{ "user": { "user_id": 1, "role": "GUARDIAN", "name": "Guardian", "email": "guardian1@example.com" } }
```

### POST `/auth/logout`
Response `200`:

```json
{ "message": "Logged out", "code": "OK" }
```

## Subject

### POST `/subjects`
Request:

```json
{ "name": "Kim", "age": 79, "gender": "F", "role": "MAIN" }
```

Response `201`:

```json
{
  "subject": { "subject_id": 10, "name": "Kim", "age": 79, "gender": "F", "created_at": "..." },
  "user_subject": { "user_subject_id": 22, "user_id": 1, "subject_id": 10, "role": "MAIN" }
}
```

### GET `/subjects`
Response `200`:

```json
{ "items": [{ "subject_id": 10, "name": "Kim", "age": 79, "gender": "F", "created_at": "...", "link_role": "MAIN" }] }
```

### GET `/subjects/:subjectId`
### DELETE `/subjects/:subjectId`

## Device

### POST `/subjects/:subjectId/devices`
Request:

```json
{ "device_type": "CAMERA", "location": "LIVING_ROOM" }
```

### GET `/subjects/:subjectId/devices`
### PATCH `/devices/:deviceId`
Request example:

```json
{ "status": "ONLINE", "health_status": "NORMAL", "location": "BEDROOM" }
```

### DELETE `/devices/:deviceId`

## Alerts / Notification

### GET `/subjects/:subjectId/alerts`
Response item fields:
- `analysis_id`
- `event_type`
- `risk_level`
- `confidence`
- `analyzed_at`
- `notification_id`
- `message`
- `sent_at`
- `is_read`
- `channel`

### PATCH `/notifications/:id/read`

## False Positive

### POST `/analysis/:analysisId/false-positive`
Request:

```json
{ "reason": "pet movement", "note": "camera angle issue" }
```

### GET `/false-positives` (ADMIN)
Optional query: `?status=PENDING`

### PATCH `/false-positives/:fpId` (ADMIN)
Request:

```json
{ "status": "RESOLVED", "note": "validated by operator" }
```

## Environment

### POST `/devices/:deviceId/env`
Request:

```json
{ "temperature": 24.5, "humidity": 54.2, "status": "NORMAL", "duration_sec": 60 }
```

### GET `/subjects/:subjectId/env?limit=50`

## Absence

### POST `/subjects/:subjectId/absence`
Request:

```json
{ "start_time": "2026-02-20T08:00:00Z", "end_time": "2026-02-20T08:30:00Z", "duration_sec": 1800, "reason": "walk" }
```

### GET `/subjects/:subjectId/absence`

## Medication

### POST `/subjects/:subjectId/medications/schedule`
Request:

```json
{ "medicine_name": "Aspirin", "scheduled_time": "2026-02-20T09:00:00Z" }
```

### GET `/subjects/:subjectId/medications/schedule`

### POST `/medications/log`
Request:

```json
{ "schedule_id": 1, "subject_id": 10, "acknowledged": true }
```