# Team5D BackEnd

## Environment

`.env`

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
SESSION_SECRET=change-this-secret
SESSION_COOKIE_NAME=team5d.sid
SESSION_MAX_AGE_MS=604800000
```

## Install

```bash
npm install
```

## Create session table

```bash
psql -U <user> -d <db> -f docs/db/session.sql
```

## Run

```bash
npm run dev
```

## Quick curl tests

```bash
curl -i -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"guardian1@example.com","password":"abcd1234","name":"Guardian One","role":"GUARDIAN"}'
```

```bash
curl -i -c cookie.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"guardian1@example.com","password":"abcd1234"}'
```

```bash
curl -i -b cookie.txt http://localhost:3000/api/auth/me
```

```bash
curl -i -b cookie.txt -X POST http://localhost:3000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{"name":"Kim","age":79,"gender":"F"}'
```

```bash
curl -i -b cookie.txt -X POST http://localhost:3000/api/auth/logout
```

## Notes

- Authentication is session-based (`express-session` + `connect-pg-simple`).
- Error response format is unified as `{ "message": string, "code": string }`.
- `users.last_login_at` update is skipped automatically if the column does not exist.