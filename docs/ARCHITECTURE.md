# Architecture

## System Design

Kolibri AI is built as a layered system:

### Layer 1: Core Engine (C/WASM)
- Decimal cognition: 0-9 impulse transduction
- Formula evolution: Genetic algorithm for formula discovery
- Fractal hierarchy: 10-nested digit structure
- Memory management: Optimized for embedded/browser execution

### Layer 2: Compression (JavaScript)
- Pattern detection: Analyzes data for repeating sequences
- Formula encoding: RLE (Run-Length Encoding) for patterns
- Zlib deflation: Final entropy compression stage
- Metadata management: Tracks compression statistics

### Layer 3: Storage (Express.js)
- File management: Upload/download/delete operations
- Authentication: JWT-based token system
- Database: Simple JSON-based data store
- API endpoints: RESTful interface with CORS support

### Layer 4: User Interface (React/TypeScript)
- Storage management: File listing and metadata display
- Upload interface: Drag-drop with progress tracking
- Authentication: Login/registration forms
- Analytics: Compression statistics visualization

## Data Flow

### Upload Flow

```
User selects file
        ↓
File sent to /api/storage/upload
        ↓
[KOMPRESSOR] Pattern detection
        ↓
[KOMPRESSOR] Formula encoding + RLE
        ↓
[KOMPRESSOR] Zlib deflate
        ↓
Metadata added (4 bytes header + JSON)
        ↓
Compressed file saved to disk
        ↓
Database updated with file metadata
        ↓
Client receives compression stats
```

### Download Flow

```
User requests file download
        ↓
File retrieved from disk
        ↓
[KOMPRESSOR] Zlib inflate
        ↓
[KOMPRESSOR] RLE decode
        ↓
Original data restored
        ↓
File sent to client
        ↓
Browser downloads
```

## Compression Algorithm

Kolibri DECIMAL10X uses a three-stage pipeline:

1. **Pattern Detection**
   - Analyzes data for repeating 4-32 byte patterns
   - Limits to 64 most valuable patterns
   - Calculates savings for each pattern

2. **Formula Encoding**
   - Encodes patterns using RLE (Run-Length Encoding)
   - Magic header: `0x4B 0x4F 0x4C 0x49` ('KOLI')
   - Escaping for literal 0xFF bytes

3. **Entropy Compression**
   - Uses zlib deflate (level 9)
   - Achieves additional 30-50% compression
   - Total compression: 70-80% for text data

## Performance Metrics

| Operation | Time | Memory |
|-----------|------|--------|
| Compress 1MB JSON | ~100ms | ~5MB |
| Decompress 1MB | ~50ms | ~3MB |
| Pattern detection | ~20ms | ~2MB |
| Full pipeline | ~150ms | ~8MB |

## Scalability

- Single server: 100+ concurrent users
- Storage quota: 10GB per user (configurable)
- Max file size: 100MB per upload (configurable)
- Database: JSON file (can be replaced with MongoDB/PostgreSQL)

## Security Measures

- JWT authentication with configurable expiry
- Password hashing (bcrypt compatible)
- CORS protection
- File size validation
- Disk quota enforcement
- Audit logging (optional)

## Future Enhancements

1. **Multi-node clustering** - Distribute across servers
2. **Database migration** - Replace JSON with SQL/NoSQL
3. **Blockchain integration** - Immutable file audit trail
4. **GPU acceleration** - Parallel compression
5. **Adaptive algorithms** - ML-based pattern optimization
