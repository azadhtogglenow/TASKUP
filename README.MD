# API Documentation

## Setup
```bash
npm install
npm run dev
```

Base URL: `http://localhost:3000`

---

## Auth Routes

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### Get Profile
```bash
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer <TOKEN>"
```

### List Users
```bash
curl http://localhost:3000/api/auth/users -H "Authorization: Bearer <TOKEN>"
```

---

## Document Routes

### Get All Documents
```bash
curl http://localhost:3000/api/documents -H "Authorization: Bearer <TOKEN>"
```

### Get My Documents
```bash
curl http://localhost:3000/api/documents/mine -H "Authorization: Bearer <TOKEN>"
```

### Get Document by ID
```bash
curl http://localhost:3000/api/documents/:id -H "Authorization: Bearer <TOKEN>"
```

### Create Document
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title": "New Doc"}'
```

### Update Document
```bash
curl -X PUT http://localhost:3000/api/documents/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title": "Updated Doc"}'
```

### Delete Document
```bash
curl -X DELETE http://localhost:3000/api/documents/:id -H "Authorization: Bearer <TOKEN>"
```

---

## Chunk Routes

### Get Chunks by Document ID
```bash
curl http://localhost:3000/api/chunks/document/:documentId -H "Authorization: Bearer <TOKEN>"
```

### Create Chunk
```bash
curl -X POST http://localhost:3000/api/chunks/document/:documentId \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"text": "chunk data"}'
```

### Delete Chunk
```bash
curl -X DELETE http://localhost:3000/api/chunks/:id -H "Authorization: Bearer <TOKEN>"
```

---

## Job Routes

### Get All Jobs
```bash
curl http://localhost:3000/api/jobs -H "Authorization: Bearer <TOKEN>"
```

### Get My Jobs
```bash
curl http://localhost:3000/api/jobs/mine -H "Authorization: Bearer <TOKEN>"
```

### Get Jobs by Document ID
```bash
curl http://localhost:3000/api/jobs/document/:documentId -H "Authorization: Bearer <TOKEN>"
```

### Get Job by ID
```bash
curl http://localhost:3000/api/jobs/:id -H "Authorization: Bearer <TOKEN>"
```

### Create Job
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"documentId": "123"}'
```

### Update Job
```bash
curl -X PUT http://localhost:3000/api/jobs/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"status": "done"}'
```

---

## Health Check
```bash
curl http://localhost:3000/health
```
