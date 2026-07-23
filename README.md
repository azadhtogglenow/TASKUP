# Express TypeScript API

Minimal REST API with JWT authentication and document CRUD.

## Setup

```bash
npm install
npm run build
npm start
```

## API Endpoints

### Auth (`/auth`)

* **Signup (`POST /auth/signup`)**
  ```bash
  curl -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123"}'
  ```
* **Login (`POST /auth/login`)**
  ```bash
  curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123"}'
  ```
* **Get Profile (`GET /auth/me`)**
  ```bash
  curl -X GET http://localhost:3000/auth/me -H "Authorization: Bearer TOKEN"
  ```

### Documents (`/documents`)

* **Create (`POST /documents`)**
  ```bash
  curl -X POST http://localhost:3000/documents -H "Content-Type: application/json" -d '{"title":"Doc1"}'
  ```
* **Get All (`GET /documents`)**
  ```bash
  curl http://localhost:3000/documents
  ```
* **Get One (`GET /documents/:id`)**
  ```bash
  curl http://localhost:3000/documents/id
  ```
* **Update (`PUT /documents/:id`)**
  ```bash
  curl -X PUT http://localhost:3000/documents/id -H "Content-Type: application/json" -d '{"title":"Updated"}'
  ```
* **Delete (`DELETE /documents/:id`)**
  ```bash
  curl -X DELETE http://localhost:3000/documents/id
  ```
