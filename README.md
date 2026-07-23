# Express TypeScript API

Minimal REST API with JWT authentication and document CRUD.

## Setup

```bash
npm install
npm run build
npm start
```

## API Endpoints

### Base Route (`/`)

* **Health Check & Documentation (`GET /`)**
```bash
curl http://localhost:3000/
```

### Auth (`/auth`)

* **Signup (`POST /auth/signup`)**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}'
```

* **Login (`POST /auth/login`)**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}'
```

* **Get Profile (`GET /auth/me`)**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Documents (`/documents`)

*Note: All document routes require a valid JWT token passed in the Authorization header.*

* **Create (`POST /documents`)**
```bash
curl -X POST http://localhost:3000/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Document","content":"Hello World"}'
```

* **Get All (`GET /documents`)**
```bash
curl -X GET http://localhost:3000/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

* **Get One (`GET /documents/:id`)**
```bash
curl -X GET http://localhost:3000/documents/YOUR_DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

* **Update (`PUT /documents/:id`)** *(Owner only)*
```bash
curl -X PUT http://localhost:3000/documents/YOUR_DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Document Title"}'
```

* **Delete (`DELETE /documents/:id`)** *(Owner only)*
```bash
curl -X DELETE http://localhost:3000/documents/YOUR_DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
