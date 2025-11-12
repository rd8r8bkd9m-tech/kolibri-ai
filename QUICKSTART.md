# Quick Start

## 30-Second Setup

```bash
# 1. Clone
git clone https://github.com/rd8r8bkd9m-tech/kolibri-ai.git
cd kolibri-ai

# 2. Install & Run Cloud Storage
cd cloud-storage && npm install && npm start

# 3. In another terminal: Install & Run Frontend
cd frontend/kolibri-web && npm install && npm run dev

# 4. Open http://localhost:5175/storage in browser
```

## What You'll See

1. **Login Page** - Create account (demo/demo)
2. **Storage Dashboard** - Upload files with drag-drop
3. **Compression Stats** - Real-time compression ratio display
4. **File Management** - Download/delete with integrity verification

## Key Features

✅ **Kolibri DECIMAL10X Compression** - 70-80% for text  
✅ **JWT Authentication** - Secure file storage  
✅ **Real-time Stats** - Compression metrics displayed live  
✅ **File Integrity** - Download verification built-in  
✅ **100MB Upload Limit** - Per file size constraint  
✅ **10GB Storage Quota** - Per user storage limit  

## API Endpoints

```bash
# Health check
curl http://localhost:3001/api/health

# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"user","password":"pass"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"user","password":"pass"}'

# Upload (requires token)
curl -X POST http://localhost:3001/api/storage/upload \
  -H 'Authorization: Bearer TOKEN' \
  -F 'file=@yourfile.json'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3001 in use | `PORT=3002 npm start` |
| Port 5175 in use | Vite will auto-select 5176/5177 |
| CORS errors | Ensure backend running on 3001 |
| File too large | Max 100MB per upload |
| Upload fails | Check disk space & token validity |

## Next Steps

1. Deploy to production
2. Setup SSL/TLS
3. Configure database (MongoDB/PostgreSQL)
4. Setup backup strategy
5. Monitor performance

## Documentation

- [Getting Started](docs/GETTING_STARTED.md) - Detailed setup guide
- [Architecture](docs/ARCHITECTURE.md) - System design
- [API Reference](#-api-reference) - Complete API docs
- [Kolibri Specification](docs/kolibri_integrated_prototype.md) - Full technical spec
