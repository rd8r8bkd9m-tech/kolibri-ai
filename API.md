# API Reference

## Base URL

```
http://localhost:3001/api
```

## Authentication

### Register

**POST** `/auth/register`

```json
{
  "username": "user@example.com",
  "password": "secure_password"
}
```

**Response (201):**
```json
{
  "userId": "uuid",
  "username": "user@example.com",
  "token": "eyJhbGc..."
}
```

### Login

**POST** `/auth/login`

```json
{
  "username": "user@example.com",
  "password": "password"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "userId": "uuid",
  "expiresIn": 86400
}
```

## Storage Operations

### Upload File

**POST** `/storage/upload`

```
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body:
  file: <binary data>
```

**Response (200):**
```json
{
  "fileId": "uuid",
  "filename": "document.pdf",
  "original": 1024000,
  "compressed": 204800,
  "ratio": 0.80,
  "algorithm": "DECIMAL10X v1.0",
  "uploadedAt": "2025-11-12T10:30:00Z"
}
```

### List Files

**GET** `/storage/list`

```
Headers:
  Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "fileId": "uuid",
    "filename": "data.json",
    "original": 1024000,
    "compressed": 204800,
    "ratio": 0.80,
    "uploadedAt": "2025-11-12T10:30:00Z"
  }
]
```

### Download File

**GET** `/storage/download/:fileId`

```
Headers:
  Authorization: Bearer <token>
```

**Response (200):** Binary file data with headers:
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename=original.pdf
X-Original-Size: 1024000
X-Compressed-Size: 204800
X-Compression-Ratio: 0.80
```

### Delete File

**DELETE** `/storage/delete/:fileId`

```
Headers:
  Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "File deleted",
  "fileId": "uuid"
}
```

### Storage Info

**GET** `/storage/info`

```
Headers:
  Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "totalStorage": 10737418240,
  "usedStorage": 2147483648,
  "fileCount": 42,
  "compression": {
    "totalOriginal": 10737418240,
    "totalCompressed": 2147483648,
    "ratio": 0.80,
    "algorithm": "DECIMAL10X v1.0"
  }
}
```

## Health Check

**POST** `/health`

**Response (200):**
```json
{
  "status": "ok",
  "service": "kolibri-cloud-storage",
  "version": "1.0.0",
  "timestamp": "2025-11-12T10:30:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Username and password required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

### 409 Conflict
```json
{
  "error": "User already exists"
}
```

### 413 Payload Too Large
```json
{
  "error": "File too large (max 100MB)"
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error message"
}
```

## Rate Limiting

- 100 requests per minute per IP
- 10 concurrent file uploads per user
- File size limit: 100MB
- Storage quota: 10GB per user

## Compression Algorithm

Kolibri DECIMAL10X implements a three-stage compression:

1. **Pattern Detection** - Finds repeating 4-32 byte sequences (max 64 patterns)
2. **Formula Encoding** - Run-Length Encoding with escape sequences
3. **Entropy Compression** - zlib deflate with level 9

**Typical Compression Ratios:**
- JSON: 75-85%
- CSV: 70-80%
- Text: 65-75%
- Binary: 20-40%
