g # Secure Document Management API

A secure, production-ready Express API built with TypeScript. It features robust user authentication, document management, tight CORS controls, Helmet security configurations, and rate limiting.

---

##  Getting Started

### 1. Environment Variables
Create a `.env` file in the root directory and configure the following variables:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://example.com
```

### 2. Installation & Run
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## API Architecture

The API exposes the following routing structure:
* **Public**: Initial health check.
* **Authentication (`/auth`)**: Rate-limited login and signup paths.
* **Documents (`/documents`)**: Protected resources accessible only to authenticated users.

---

## 📡 cURL Examples

### 1. General & Authentication

#### API Health Check
```bash
curl -X GET http://localhost:5000/
```

####  User Signup
```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePassword123"}'
```

####  User Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePassword123"}'
```

####  Get Current User Profile (Protected)
*Replace `YOUR_JWT_TOKEN` with the token received from the login endpoint.*
```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Document Management (Protected)

####  Create a Document
```bash
curl -X POST http://localhost:5000/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Project Roadmap", "content": "This is confidential data."}'
```

####  Fetch All Documents
```bash
curl -X GET http://localhost:5000/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

####  Fetch Single Document by ID
```bash
curl -X GET http://localhost:5000/documents/DOCUMENT_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

####  Update a Document (Owner Only)
```bash
curl -X PUT http://localhost:5000/documents/DOCUMENT_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Roadmap Title"}'
```

#### Delete a Document (Owner Only)
```bash
curl -X DELETE http://localhost:5000/documents/DOCUMENT_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

##  Security Features Built-In

* **Strict CORS Matching**: Explicitly validates requested origins against allowed environments using the `CORS_ORIGIN` setup.
* **Helmet Policy**: Protects against common web headers vulnerabilities and blocks `frameAncestors` clickjacking.
* **Targeted Rate Limiting**: Implements standard global limits alongside a strict `authLimiter` to block brute force credential attacks.
* **Structured Error Catching**: Gracefully formats unexpected system execution errors while hiding production code traces.
