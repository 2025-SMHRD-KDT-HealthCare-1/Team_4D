# Auth API Contract (Front ↔ Back)

## Base

- API Base URL: `http://localhost:3000`
- Session strategy: cookie-based session
- Front client option: `withCredentials: true`

## Endpoints

| API | Method | Request Body | Success Response | Notes |
|---|---|---|---|---|
| `/api/auth/signup` | `POST` | `{ userId, name, email, password, role }` | `201 { user_id, email, name, role, created_at }` | `password` length 8~12 |
| `/api/auth/login` | `POST` | `{ userId, password }` or `{ email, password }` | `200 { user: { user_id, role, name, email } }` | session cookie issued |
| `/api/auth/me` | `GET` | none | `200 { authenticated, user }` | `Cache-Control: no-store` |
| `/api/auth/logout` | `POST` | none | `200 { message, code }` | clears session cookie |

## Error Shape

```json
{
  "message": "human readable message",
  "code": "ERROR_CODE"
}
```

## Frontend Rules

- Guardian/Admin login must send one of:
  - `{ userId, password }`
  - `{ email, password }`
- Always keep `withCredentials: true`
- For `/api/auth/me`, send no-store headers:
  - `Cache-Control: no-store`
  - `Pragma: no-cache`

## Backend Rules

- `/api/auth/login` should accept both `email` and `userId`.
- `/api/auth/me` must return non-cached response (`no-store`).
- Log auth request payload summary for debugging (mask password).
