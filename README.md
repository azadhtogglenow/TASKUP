# Document API

## Setup
```bash
npm install
npm run dev
```

## API Examples

### Create Document
```bash
curl -X POST http://localhost:3000/documents -H "Content-Type: application/json" -d '{"title": "Title", "content": "Content"}'
```

### Get All Documents
```bash
curl http://localhost:3000/documents
```

### Get Document by ID
```bash
curl http://localhost:3000/documents/id
```

### Update Document
```bash
curl -X PUT http://localhost:3000/documents/id -H "Content-Type: application/json" -d '{"title": "Updated Title", "content": "Updated Content"}'
```

### Delete Document
```bash
curl -X DELETE http://localhost:3000/documents/id
```
