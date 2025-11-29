# Kolibri AI C Core API Reference

## Overview

The Kolibri AI C Core provides a complete API for building knowledge-based systems. This document covers all public functions and data structures.

## Header Include

```c
#include "kolibri.h"
```

## Configuration Constants

```c
#define KOLIBRI_VERSION         "1.0.0"
#define KOLIBRI_MAX_FORMULA_LEN 512
#define KOLIBRI_MAX_TAG_LEN     64
#define KOLIBRI_MAX_TAGS        10
#define KOLIBRI_MAX_CHILDREN    10
#define KOLIBRI_MAX_DEPTH       10
#define KOLIBRI_HASH_SIZE       32
```

## Error Codes

```c
typedef enum {
    K_OK              = 0,    // Success
    K_ERR_NULL_PTR    = -1,   // Null pointer
    K_ERR_OUT_OF_MEM  = -2,   // Out of memory
    K_ERR_INVALID_ARG = -3,   // Invalid argument
    K_ERR_NOT_FOUND   = -4,   // Not found
    K_ERR_FULL        = -5,   // Container full
    K_ERR_IO          = -6,   // I/O error
    K_ERR_PARSE       = -7,   // Parse error
    K_ERR_HASH        = -8,   // Hash error
    K_ERR_CHAIN       = -9    // Chain error
} k_error_t;
```

## Data Structures

### k_formula_t

Represents a knowledge formula.

```c
typedef struct {
    char pattern[KOLIBRI_MAX_FORMULA_LEN];   // Pattern to match
    char action[KOLIBRI_MAX_FORMULA_LEN];    // Action to execute
    float confidence;                         // Confidence level (0.0-1.0)
    char tags[KOLIBRI_MAX_TAGS][KOLIBRI_MAX_TAG_LEN]; // Tags
    uint8_t tag_count;                        // Number of tags
    uint64_t id;                              // Unique formula ID
    time_t created_at;                        // Creation timestamp
    time_t updated_at;                        // Last update timestamp
    uint32_t usage_count;                     // Usage counter
} k_formula_t;
```

### k_kb_t

Knowledge base container.

```c
typedef struct {
    k_formula_t* formulas;     // Array of formulas
    uint32_t formula_count;    // Number of formulas
    k_node_t* root;            // Root of fractal memory tree
    k_blockchain_t* chain;     // Blockchain for versioning
    char name[64];             // Knowledge base name
    char filepath[256];        // File path for persistence
    time_t created_at;         // Creation timestamp
    time_t updated_at;         // Last update timestamp
} k_kb_t;
```

### k_result_t

Query result structure.

```c
typedef struct {
    char answer[KOLIBRI_MAX_FORMULA_LEN];    // Answer text
    k_formula_t* matched_formula;             // Formula that matched
    float confidence;                         // Answer confidence
    bool success;                             // Whether query succeeded
} k_result_t;
```

### k_block_t

Blockchain block.

```c
typedef struct {
    uint64_t index;                           // Block index
    time_t timestamp;                         // Creation time
    k_hash_t prev_hash;                       // Previous block hash
    k_hash_t hash;                            // This block's hash
    char data[KOLIBRI_BLOCK_DATA_SIZE];       // Block data
    uint32_t nonce;                           // Proof of work nonce
} k_block_t;
```

## Core Engine API

### kolibri_init

Initialize the Kolibri engine.

```c
k_error_t kolibri_init(void);
```

**Returns**: `K_OK` on success.

### kolibri_shutdown

Shutdown the Kolibri engine.

```c
void kolibri_shutdown(void);
```

### kolibri_kb_create

Create a new knowledge base.

```c
k_kb_t* kolibri_kb_create(const char* name);
```

**Parameters**:
- `name`: Name of the knowledge base

**Returns**: Pointer to new KB, or NULL on failure.

### kolibri_kb_destroy

Destroy a knowledge base.

```c
void kolibri_kb_destroy(k_kb_t* kb);
```

### kolibri_add_formula

Add a formula to the knowledge base.

```c
uint64_t kolibri_add_formula(k_kb_t* kb, const char* pattern, 
                              const char* action, float confidence,
                              const char* tags);
```

**Parameters**:
- `kb`: Knowledge base
- `pattern`: Pattern string (e.g., "what is {X}")
- `action`: Action string (e.g., "lookup({X})")
- `confidence`: Confidence level (0.0-1.0)
- `tags`: Comma-separated tags

**Returns**: Formula ID on success, 0 on failure.

**Example**:
```c
uint64_t id = kolibri_add_formula(kb, 
    "what is {X}", 
    "The answer about {X}", 
    0.9f, 
    "question,lookup");
```

### kolibri_query

Query the knowledge base.

```c
k_error_t kolibri_query(k_kb_t* kb, const char* query, k_result_t* result);
```

**Parameters**:
- `kb`: Knowledge base
- `query`: Query string
- `result`: Output result structure

**Returns**: `K_OK` on success, `K_ERR_NOT_FOUND` if no match.

**Example**:
```c
k_result_t result;
k_error_t err = kolibri_query(kb, "what is AI", &result);
if (result.success) {
    printf("Answer: %s (confidence: %.2f)\n", 
           result.answer, result.confidence);
}
```

### kolibri_stats

Get knowledge base statistics.

```c
void kolibri_stats(const k_kb_t* kb, uint32_t* formula_count, 
                   uint32_t* node_count, uint32_t* block_count);
```

### kolibri_list_formulas

Iterate over all formulas.

```c
void kolibri_list_formulas(const k_kb_t* kb, 
                           void (*callback)(const k_formula_t*, void*),
                           void* user_data);
```

## Storage API

### kolibri_save

Save knowledge base to file.

```c
k_error_t kolibri_save(const k_kb_t* kb, const char* filepath);
```

### kolibri_load

Load knowledge base from file.

```c
k_kb_t* kolibri_load(const char* filepath);
```

### kolibri_export_dsl

Export to DSL text format.

```c
int kolibri_export_dsl(const k_kb_t* kb, char* buffer, size_t size);
```

### kolibri_import_dsl

Import formulas from DSL text.

```c
int kolibri_import_dsl(k_kb_t* kb, const char* dsl);
```

## Blockchain API

### kolibri_chain_create

Create a new blockchain.

```c
k_blockchain_t* kolibri_chain_create(void);
```

### kolibri_chain_add_block

Add a block to the chain.

```c
k_error_t kolibri_chain_add_block(k_blockchain_t* chain, const char* data);
```

### kolibri_chain_validate

Validate the entire blockchain.

```c
bool kolibri_chain_validate(const k_blockchain_t* chain);
```

### kolibri_sha256

Calculate SHA256 hash.

```c
void kolibri_sha256(const uint8_t* data, size_t len, k_hash_t* hash);
```

### kolibri_hash_format

Format hash as hex string.

```c
int kolibri_hash_format(const k_hash_t* hash, char* buffer, size_t size);
```

## Memory API

### kolibri_node_create

Create a new memory node.

```c
k_node_t* kolibri_node_create(k_entity_type_t type, const char* name, 
                               const char* value);
```

### kolibri_node_add_child

Add a child node.

```c
k_error_t kolibri_node_add_child(k_node_t* parent, k_node_t* child, 
                                  uint8_t digit);
```

### kolibri_address_parse

Parse address string (e.g., "1.2.3").

```c
k_error_t kolibri_address_parse(const char* str, k_address_t* address);
```

## CLI API

### kolibri_cli_run

Run the interactive REPL.

```c
int kolibri_cli_run(k_kb_t* kb);
```

### kolibri_cli_command

Process a single command.

```c
k_error_t kolibri_cli_command(k_kb_t* kb, const char* command,
                               char* output, size_t output_size);
```

## Utility Functions

### kolibri_error_str

Get error message string.

```c
const char* kolibri_error_str(k_error_t error);
```

### kolibri_version

Get version string.

```c
const char* kolibri_version(void);
```

### kolibri_encode_decimal

Encode text to decimal sequence.

```c
int kolibri_encode_decimal(const char* text, char* digits, size_t max_len);
```

### kolibri_decode_decimal

Decode decimal sequence to text.

```c
int kolibri_decode_decimal(const char* digits, char* text, size_t max_len);
```

## Complete Example

```c
#include "kolibri.h"
#include <stdio.h>

int main(void) {
    // Initialize
    kolibri_init();
    
    // Create knowledge base
    k_kb_t* kb = kolibri_kb_create("demo");
    
    // Add formulas
    kolibri_add_formula(kb, "hello", "Hello! How can I help?", 0.95f, "greeting");
    kolibri_add_formula(kb, "what is {X}", "{X} is interesting", 0.8f, "qa");
    
    // Query
    k_result_t result;
    kolibri_query(kb, "what is Kolibri", &result);
    
    if (result.success) {
        printf("Answer: %s\n", result.answer);
        printf("Confidence: %.2f\n", result.confidence);
    }
    
    // Save
    kolibri_save(kb, "demo.kolibri");
    
    // Cleanup
    kolibri_kb_destroy(kb);
    kolibri_shutdown();
    
    return 0;
}
```

## Thread Safety

The current implementation is **not thread-safe**. If using in multi-threaded applications, external synchronization is required.

## Memory Management

- All `*_create` functions allocate memory
- Corresponding `*_destroy` functions must be called
- Knowledge bases own their formulas, nodes, and blockchain
- Destroying a KB frees all associated memory
