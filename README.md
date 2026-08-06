# Authentication & Document Management API

A Node.js REST API featuring secure user authentication backed by Redis token caching and a complete document embeddings management system.

## Prerequisites

Ensure you have the following installed.
* Postgres 
* Redis Server

---

## Authentication Endpoints (`/api/auth`)

### 1. User Registration
Creates a new user account.
* **URL:** `/api/auth/register`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### 2. User Login
Authenticates user and returns a token saved in Redis.
* **URL:** `/api/auth/login`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "azadh@gmail.com",
    "password": "securepassword123"
  }'
```

### 3. Clear Auth Cache
Manually clears the active user's authentication cache from Redis.
* **URL:** `/api/auth/cache`
* **Method:** `DELETE`
* **Headers:** `Authorization: Bearer <TOKEN>`

```bash
curl -X DELETE http://localhost:3000/api/auth/cache \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get User Profile
Retrieves profile data of the logged-in user.
* **URL:** `/api/auth/profile`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <TOKEN>`

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. User Logout
Invalidates the current session and removes the token from Redis.
* **URL:** `/api/auth/logout`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <TOKEN>`

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Document Endpoints (`/api/documents`)

### 1. Create Document
* **URL:** `/api/documents`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project Proposal",
    "content": "This is the document body text."
  }'
```

### 2. Get All Documents
* **URL:** `/api/documents`
* **Method:** `GET`

```bash
curl -X GET http://localhost:3000/api/documents
```

### 3. Get Document by ID
* **URL:** `/api/documents/:id`
* **Method:** `GET`

```bash
curl -X GET http://localhost:3000/api/documents/650c1f2e9b1d2c001f8b4567
```

### 4. Search Documents
* **URL:** `/api/documents/search`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

```bash
curl -X POST http://localhost:3000/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Proposal"
  }'
```

### 5. Delete Document
* **URL:** `/api/documents/:id`
* **Method:** `DELETE`

```bash
curl -X DELETE http://localhost:3000/api/documents/650c1f2e9b1d2c001f8b4567
```
