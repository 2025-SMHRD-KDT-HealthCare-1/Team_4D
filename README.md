# Team5D

## BackEnd Session Auth Setup

`BackEnd/.env` 예시:

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

세션 테이블 생성:

```bash
psql -U <user> -d <db> -f BackEnd/docs/db/session.sql
```

백엔드 실행:

```bash
cd BackEnd
npm install
npm run dev
```

간단한 테스트:

```bash
curl -i -c cookie.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"guardian1@example.com","password":"abcd1234"}'
```

```bash
curl -i -b cookie.txt http://localhost:3000/api/auth/me
```