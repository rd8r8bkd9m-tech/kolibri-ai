# Kolibri AI 🧠

**Cognitive System with Decimal Impulses, Formula Evolution, and Fractal Hierarchy**

> Мы не строим очередную нейросеть. Мы выращиваем цифровой организм.
> Его язык — математика. Его память — фрактальна. Его обучение — эволюция.

---

## 🌟 What is Kolibri?

Kolibri is an innovative AI system that challenges traditional neural network approaches:

- **Decimal Cognition** - All inputs converted to 0-9 decimal pulses (no floating point weights)
- **Formula Evolution** - Knowledge stored as short executable formulas, not weight matrices
- **Fractal Hierarchy** - 10-nested digit structure (0→0.0→0.0.0→...) for hierarchical thinking
- **Distributed Learning** - Multi-agent consensus through voting on each level
- **Interpretability** - Every decision is traceable to a mathematical formula

### Key Innovation

Instead of millions of neural parameters, Kolibri uses **evolved formulas**:

```
Input Data → Decimal Transduction → Formula Evaluation → Output
                                         ↓
                            (Genetic Algorithm)
                          Mutation + Recombination
                                         ↓
                              Best Formulas Win
```

---

## 📦 Core Components

### 1. **Kolibri C Core** (`/backend`, `/wasm`)
- Low-level implementation (ANSI C11)
- Compiles to WebAssembly for browser execution
- Decimal pulse transduction
- Formula evolution engine
- Digital genome blockchain

**Key Files:**
- `backend/src/decimal.c` - UTF-8 → decimal transduction
- `backend/src/formula.c` - Formula evolution
- `backend/src/genome.c` - Digital genome storage
- `wasm/kolibri_core.c` - WASM bridge (1211 lines)

### 2. **Cloud Storage with Compression** (`/cloud-storage`)
- Express.js REST API (port 3001)
- Integrated Kolibri Kompressor
- DECIMAL10X-based file compression
- 70-80% compression ratio for text files
- JWT authentication

**Features:**
- `/api/storage/upload` - Auto-compress on upload
- `/api/storage/download/:id` - Auto-decompress on download
- `/api/storage/list` - List compressed files with stats
- `/api/storage/info` - Compression statistics

### 3. **React Web App** (`/frontend`)
- Vite dev server (ports 5175-5177)
- Storage page with compression UI
- Real-time compression statistics
- File management interface

**Components:**
- `StorageManager.tsx` - Auth & account management
- `FileUpload.tsx` - Drag-drop upload
- `FileList.tsx` - File listing with compression info
- `Storage.tsx` - Main storage page

### 4. **Python Wrapper** (`/core`)
- `kolibri_sim.py` - High-level Python API
- `memory.py` - Knowledge base management

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
Python 3.10+
npm or yarn
```

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/rd8r8bkd9m-tech/kolibri-ai.git
cd kolibri-ai
```

2. **Install Cloud Storage dependencies**
```bash
cd cloud-storage
npm install
```

3. **Install Frontend dependencies**
```bash
cd ../frontend/kolibri-web
npm install
```

### Running the System

#### Start Cloud Storage API
```bash
cd cloud-storage
node server.js
# Listening on http://localhost:3001
```

#### Start Web Application
```bash
cd frontend/kolibri-web
npm run dev
# Dev server on http://localhost:5175 (or 5176, 5177)
```

#### Test Compression
```bash
# In another terminal
curl -X POST http://localhost:3001/api/health
# Expected: {"status":"ok","service":"kolibri-cloud-storage"}
```

---

## 📊 Kolibri Algorithm

### Decimal Cognition Layer
```c
// Any input → 0-9 decimal sequence
int k_encode_text(const char *input, char *out, size_t out_len);
int k_decode_text(const char *digits, char *out, size_t out_len);
```

### Formula Evolution
```
Algorithm: Evolutionary Cycle
1. Initialize population of random formulas
2. Evaluate fitness of each formula on current task
3. Select best-performing formulas
4. Generate new formulas via mutation & recombination
5. Replace worst formulas with new ones
6. Repeat until fitness target reached
```

### Fractal Memory Structure
```
Level 0:     0     1     2  ...  9
             ↓
Level 1:   0.0-0.9  1.0-1.9  ...
             ↓
Level 2:  0.0.0-0.0.9  0.1.0-0.1.9  ...
```

---

## 🔧 API Reference

### Cloud Storage Endpoints

**POST /api/auth/register**
```json
{
  "username": "user@example.com",
  "password": "secure_password"
}
```

**POST /api/auth/login**
```json
{
  "username": "user@example.com",
  "password": "password"
}
Response: { "token": "jwt_token" }
```

**POST /api/storage/upload** (multipart/form-data)
```
Headers: Authorization: Bearer <token>
Body: file (binary)
Response: {
  "fileId": "uuid",
  "original": 1024000,
  "compressed": 204800,
  "ratio": 0.80,
  "algorithm": "DECIMAL10X v1.0"
}
```

**GET /api/storage/list**
```
Headers: Authorization: Bearer <token>
Response: [
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

**GET /api/storage/info**
```
Headers: Authorization: Bearer <token>
Response: {
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

---

## 📈 Performance Metrics

### Compression Ratios (Text Data)
- JSON files: 75-85% compression
- CSV data: 70-80% compression
- Structured text: 65-75% compression
- Binary data: 20-40% compression

### Memory Usage
- Core engine: ~2MB (C executable)
- WASM module: ~500KB (browser)
- Pattern analysis: Optimized to <64 patterns

---

## 🏗️ Project Structure

```
kolibri-ai/
├── backend/                 # C core implementation
│   ├── src/
│   │   ├── decimal.c       # Decimal transduction
│   │   ├── formula.c       # Formula evolution
│   │   ├── genome.c        # Digital genome
│   │   └── digits.c        # Digit streams
│   └── include/
├── frontend/               # React web app
│   └── kolibri-web/
│       ├── src/
│       │   ├── components/
│       │   │   ├── StorageManager.tsx
│       │   │   ├── FileUpload.tsx
│       │   │   └── FileList.tsx
│       │   ├── pages/Storage.tsx
│       │   └── services/api.ts
│       └── package.json
├── cloud-storage/          # Express API
│   ├── server.js           # Main server
│   ├── kompressor.js       # DECIMAL10X compressor
│   └── package.json
├── core/                   # Python wrapper
│   ├── kolibri_sim.py      # High-level API
│   └── memory.py           # Knowledge base
├── wasm/                   # WebAssembly core
│   └── kolibri_core.c      # WASM bridge
├── docs/                   # Documentation
│   └── kolibri_integrated_prototype.md
├── CMakeLists.txt          # Build configuration
└── README.md               # This file
```

---

## 🧪 Testing

### Cloud Storage Tests
```bash
cd cloud-storage
python test_client.py
```

### Python API Tests
```bash
cd core
python -m pytest test_kolibri.py -v
```

### C Core Tests
```bash
cmake -S . -B build
cmake --build build
ctest --test-dir build
```

---

## 📚 Documentation

- **[Integrated Prototype](docs/kolibri_integrated_prototype.md)** - Full technical specification (in Russian)
- **[Architecture](docs/architecture.md)** - System architecture details
- **[API Reference](#-api-reference)** - REST API endpoints
- **[Development Roadmap](docs/roadmap.md)** - Future plans

---

## 🔒 Security

- JWT token authentication
- 100MB file size limit per upload
- 10GB storage quota per user
- Encrypted password storage (bcrypt)
- CORS protection

---

## 📝 License

This project is licensed under multiple licenses:

- **Source Code**: AGPL-3.0
- **Commercial Use**: Custom commercial license
- **Community Use**: Community license

See [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Vladislav Kochurov**
- Location: Amsterdam, Netherlands
- Date: November 12, 2025

---

## 🌐 Links

- **GitHub**: https://github.com/rd8r8bkd9m-tech/kolibri-ai
- **Documentation**: Read docs/ folder
- **Paper**: See docs/kolibri_integrated_prototype.md

---

## 🎯 Mission

> Create a new paradigm for artificial intelligence
> that is interpretable, efficient, and inspired by natural evolution.

Kolibri challenges the assumption that bigger networks and more parameters are always better.
We believe in **elegant simplicity** through mathematical evolution.

---

**Made with ❤️ in the spirit of scientific inquiry and innovation.**
