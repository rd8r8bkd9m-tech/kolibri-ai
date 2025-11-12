# Getting Started

## Installation

```bash
# Clone the repository
git clone https://github.com/rd8r8bkd9m-tech/kolibri-ai.git
cd kolibri-ai

# Install cloud storage
cd cloud-storage
npm install

# Install frontend
cd ../frontend/kolibri-web
npm install
```

## Running Locally

### 1. Start Cloud Storage API

```bash
cd cloud-storage
node server.js
# Should output: 🚀 Kolibri Kompressor инициализирован: Kolibri DECIMAL10X v1.0
# Listening on http://localhost:3001
```

### 2. Start Frontend Dev Server

```bash
cd frontend/kolibri-web
npm run dev
# Should output: Local: http://localhost:5175
```

### 3. Open Browser

Navigate to `http://localhost:5175/storage`

## Testing

### Manual Test

1. Create account: username `demo` / password `demo`
2. Login
3. Upload a JSON file
4. Observe compression ratio
5. Download file and verify integrity

### API Test

```bash
# Health check
curl http://localhost:3001/api/health

# Expected response
{"status":"ok","service":"kolibri-cloud-storage"}
```

## Configuration

### Environment Variables

Create `.env` in `cloud-storage/` directory:

```env
PORT=3001
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## Troubleshooting

### Port 3001 already in use

```bash
PORT=3002 node server.js
```

### CORS errors

Make sure backend is running on correct port and CORS is enabled in `server.js`.

### File upload fails

- Check file size (max 100MB)
- Verify authentication token
- Check disk space

## Architecture Overview

```
┌─────────────────┐
│  React Web App  │
│  (5175-5177)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────────────┐
│   Express API           │
│   (3001)                │
│                         │
│  ┌─────────────────┐    │
│  │ Kompressor      │    │
│  │ DECIMAL10X v1.0 │◄───┤─ Compression Pipeline
│  └─────────────────┘    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  File Storage           │
│  - uploads/             │
│  - compressed/          │
│  - data.json            │
└─────────────────────────┘
```

## Performance

- Compression ratio: 70-80% for text
- Average upload time: <2s for 1MB file
- Memory usage: ~50MB per process

## Next Steps

1. Deploy to production
2. Setup SSL/TLS certificates
3. Configure backup strategy
4. Monitor performance
5. Scale with multiple instances

## Support

For issues and questions, open a GitHub issue or contact the author.
