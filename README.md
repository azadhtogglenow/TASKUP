# Document Management API

A secure RESTful API built with Node.js, Express, and TypeScript for user authentication and document management.

## Features

- **User Authentication**: Secure registration, login, and profile management.
- **Document Management**: Full CRUD operations for documents with built-in validation.
- **Global Error Handling**: Standardized responses for 404 errors and unexpected server crashes.
- **Security**: CORS enabled with configurable origins and route-level authorization.

---

## Getting Started

### Installation
   Install dependencies:
   ```bash
   npm install
   ```
   ```

---

## API Endpoints & cURL Examples

### Base URL
```text
http://localhost:5000
```

### Health Check

#### Check API Status
```bash
curl -X GET http://localhost:5000/health
```

---

### Authentication Routes (`/api/auth`)

#### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

#### User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "azadh@example.com",
    "password": "SecurePassword123"
  }'
```

#### Get Current User Profile
*Requires `Authorization: Bearer <token>`*
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get All Users
*Requires `Authorization: Bearer <token>`*
```bash
curl -X GET http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Document Routes (`/api/documents`)
*Note: All document routes require a valid `Authorization: Bearer <token>` header.*

#### Create a Document
```bash
curl -X POST http://localhost:5000/api/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project Proposal",
    "content": "This is the content of the document."
  }'
```

#### List Documents
*Supports optional query parameters for filtering/pagination based on your schema config.*
```bash
curl -X GET "http://localhost:5000/api/documents?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Document by ID
```bash
curl -X GET http://localhost:5000/api/documents/DOCUMENT_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update a Document
```bash
curl -X PUT http://localhost:5000/api/documents/DOCUMENT_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Project Proposal",
    "content": "This is the updated content."
  }'
```

#### Delete a Document
```bash
curl -X DELETE http://localhost:5000/api/documents/DOCUMENT_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

