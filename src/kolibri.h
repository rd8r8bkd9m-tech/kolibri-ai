/**
 * @file kolibri.h
 * @brief Kolibri AI - Compact Decentralized Knowledge Engine
 * 
 * Main header file containing all data structures and API declarations.
 * 
 * Features:
 * - 10-symbol encoding system (digits 0-9)
 * - Fractal memory hierarchy (recursive tree structures)
 * - Micro-blockchain for knowledge versioning
 * - Formula-based reasoning engine
 * 
 * @author Kolibri AI Team
 * @version 1.0.0
 */

#ifndef KOLIBRI_H
#define KOLIBRI_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include <time.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================================
 * Configuration Constants
 * ============================================================================ */

#define KOLIBRI_VERSION         "1.0.0"
#define KOLIBRI_MAX_FORMULA_LEN 512
#define KOLIBRI_MAX_TAG_LEN     64
#define KOLIBRI_MAX_TAGS        10
#define KOLIBRI_MAX_CHILDREN    10
#define KOLIBRI_MAX_DEPTH       10
#define KOLIBRI_HASH_SIZE       32
#define KOLIBRI_MAX_KB_SIZE     10000
#define KOLIBRI_BLOCK_DATA_SIZE 256

/* ============================================================================
 * 10-Digit Encoding System
 * ============================================================================
 * 
 * The encoding uses digits 0-9 for different purposes:
 * 
 * Entity Types (first digit):
 *   0 = Root/System
 *   1 = Entity/Object
 *   2 = Property/Attribute
 *   3 = Relation/Connection
 *   4 = Action/Verb
 *   5 = State/Condition
 *   6 = Time/Temporal
 *   7 = Space/Location
 *   8 = Quantity/Measure
 *   9 = Meta/Abstract
 * 
 * Operations (second digit for actions):
 *   0 = Create
 *   1 = Read
 *   2 = Update
 *   3 = Delete
 *   4 = Transform
 *   5 = Compare
 *   6 = Combine
 *   7 = Split
 *   8 = Link
 *   9 = Query
 */

typedef enum {
    K_TYPE_ROOT      = 0,
    K_TYPE_ENTITY    = 1,
    K_TYPE_PROPERTY  = 2,
    K_TYPE_RELATION  = 3,
    K_TYPE_ACTION    = 4,
    K_TYPE_STATE     = 5,
    K_TYPE_TIME      = 6,
    K_TYPE_SPACE     = 7,
    K_TYPE_QUANTITY  = 8,
    K_TYPE_META      = 9
} k_entity_type_t;

typedef enum {
    K_OP_CREATE    = 0,
    K_OP_READ      = 1,
    K_OP_UPDATE    = 2,
    K_OP_DELETE    = 3,
    K_OP_TRANSFORM = 4,
    K_OP_COMPARE   = 5,
    K_OP_COMBINE   = 6,
    K_OP_SPLIT     = 7,
    K_OP_LINK      = 8,
    K_OP_QUERY     = 9
} k_operation_t;

/* ============================================================================
 * Error Codes
 * ============================================================================ */

typedef enum {
    K_OK              = 0,
    K_ERR_NULL_PTR    = -1,
    K_ERR_OUT_OF_MEM  = -2,
    K_ERR_INVALID_ARG = -3,
    K_ERR_NOT_FOUND   = -4,
    K_ERR_FULL        = -5,
    K_ERR_IO          = -6,
    K_ERR_PARSE       = -7,
    K_ERR_HASH        = -8,
    K_ERR_CHAIN       = -9
} k_error_t;

/* ============================================================================
 * Core Data Structures
 * ============================================================================ */

/**
 * @brief Hash value for blockchain (SHA256 = 32 bytes)
 */
typedef struct {
    uint8_t bytes[KOLIBRI_HASH_SIZE];
} k_hash_t;

/**
 * @brief Digital address in fractal hierarchy
 * 
 * Example: "1.2.3" means level 3, path 1->2->3
 */
typedef struct {
    uint8_t digits[KOLIBRI_MAX_DEPTH];
    uint8_t depth;
} k_address_t;

/**
 * @brief Knowledge formula
 * 
 * DSL Format: PATTERN -> ACTION | CONFIDENCE | TAGS
 * 
 * Example: "what is {X}" -> "entity_lookup(X)" | 0.9 | "question,lookup"
 */
typedef struct {
    char pattern[KOLIBRI_MAX_FORMULA_LEN];   /**< Pattern to match (with {vars}) */
    char action[KOLIBRI_MAX_FORMULA_LEN];    /**< Action to execute */
    float confidence;                         /**< Confidence level (0.0 - 1.0) */
    char tags[KOLIBRI_MAX_TAGS][KOLIBRI_MAX_TAG_LEN]; /**< Tags for categorization */
    uint8_t tag_count;                        /**< Number of tags */
    uint64_t id;                              /**< Unique formula ID */
    time_t created_at;                        /**< Creation timestamp */
    time_t updated_at;                        /**< Last update timestamp */
    uint32_t usage_count;                     /**< How many times formula was used */
} k_formula_t;

/**
 * @brief Fractal memory node
 * 
 * Each node can have up to 10 children (digits 0-9),
 * forming a tree structure for hierarchical knowledge.
 */
typedef struct k_node {
    k_address_t address;                      /**< Node address in tree */
    k_entity_type_t type;                     /**< Entity type */
    char name[64];                            /**< Human-readable name */
    char value[KOLIBRI_MAX_FORMULA_LEN];      /**< Node value/content */
    struct k_node* children[KOLIBRI_MAX_CHILDREN]; /**< Child nodes (0-9) */
    struct k_node* parent;                    /**< Parent node */
    k_formula_t* formula;                     /**< Associated formula (if any) */
    uint32_t formula_count;                   /**< Number of formulas at this node */
    time_t created_at;                        /**< Creation timestamp */
} k_node_t;

/**
 * @brief Blockchain block for knowledge versioning
 */
typedef struct {
    uint64_t index;                           /**< Block index in chain */
    time_t timestamp;                         /**< Block creation time */
    k_hash_t prev_hash;                       /**< Previous block hash */
    k_hash_t hash;                            /**< This block's hash */
    char data[KOLIBRI_BLOCK_DATA_SIZE];       /**< Block data (formula/change) */
    uint32_t nonce;                           /**< Proof of work nonce */
} k_block_t;

/**
 * @brief Micro-blockchain for knowledge versioning
 */
typedef struct {
    k_block_t* blocks;                        /**< Array of blocks */
    uint64_t count;                           /**< Number of blocks */
    uint64_t capacity;                        /**< Allocated capacity */
} k_blockchain_t;

/**
 * @brief Knowledge base (main container)
 */
typedef struct {
    k_formula_t* formulas;                    /**< Array of formulas */
    uint32_t formula_count;                   /**< Number of formulas */
    uint32_t formula_capacity;                /**< Allocated capacity */
    k_node_t* root;                           /**< Root of fractal memory tree */
    k_blockchain_t* chain;                    /**< Blockchain for versioning */
    char name[64];                            /**< Knowledge base name */
    char filepath[256];                       /**< File path for persistence */
    time_t created_at;                        /**< Creation timestamp */
    time_t updated_at;                        /**< Last update timestamp */
} k_kb_t;

/**
 * @brief Query result
 */
typedef struct {
    char answer[KOLIBRI_MAX_FORMULA_LEN];     /**< Answer text */
    k_formula_t* matched_formula;             /**< Formula that matched */
    float confidence;                         /**< Answer confidence */
    bool success;                             /**< Whether query succeeded */
} k_result_t;

/* ============================================================================
 * Core Engine API (kolibri_core.c)
 * ============================================================================ */

/**
 * @brief Initialize the Kolibri engine
 * @return K_OK on success, error code on failure
 */
k_error_t kolibri_init(void);

/**
 * @brief Shutdown the Kolibri engine
 */
void kolibri_shutdown(void);

/**
 * @brief Create a new knowledge base
 * @param name Name of the knowledge base
 * @return Pointer to new KB, or NULL on failure
 */
k_kb_t* kolibri_kb_create(const char* name);

/**
 * @brief Destroy a knowledge base
 * @param kb Knowledge base to destroy
 */
void kolibri_kb_destroy(k_kb_t* kb);

/**
 * @brief Add a formula to the knowledge base
 * @param kb Knowledge base
 * @param pattern Pattern string (e.g., "what is {X}")
 * @param action Action string (e.g., "lookup(X)")
 * @param confidence Confidence level (0.0-1.0)
 * @param tags Comma-separated tags
 * @return Formula ID on success, 0 on failure
 */
uint64_t kolibri_add_formula(k_kb_t* kb, const char* pattern, 
                              const char* action, float confidence,
                              const char* tags);

/**
 * @brief Query the knowledge base
 * @param kb Knowledge base
 * @param query Query string
 * @param result Output result structure
 * @return K_OK on success, error code on failure
 */
k_error_t kolibri_query(k_kb_t* kb, const char* query, k_result_t* result);

/**
 * @brief Get knowledge base statistics
 * @param kb Knowledge base
 * @param formula_count Output: number of formulas
 * @param node_count Output: number of memory nodes
 * @param block_count Output: number of blockchain blocks
 */
void kolibri_stats(const k_kb_t* kb, uint32_t* formula_count, 
                   uint32_t* node_count, uint32_t* block_count);

/**
 * @brief List all formulas in the knowledge base
 * @param kb Knowledge base
 * @param callback Function to call for each formula
 * @param user_data User data passed to callback
 */
void kolibri_list_formulas(const k_kb_t* kb, 
                           void (*callback)(const k_formula_t*, void*),
                           void* user_data);

/* ============================================================================
 * Memory API (kolibri_memory.c)
 * ============================================================================ */

/**
 * @brief Create a new memory node
 * @param type Entity type
 * @param name Node name
 * @param value Node value
 * @return Pointer to new node, or NULL on failure
 */
k_node_t* kolibri_node_create(k_entity_type_t type, const char* name, 
                               const char* value);

/**
 * @brief Destroy a memory node and its children
 * @param node Node to destroy
 */
void kolibri_node_destroy(k_node_t* node);

/**
 * @brief Add a child node
 * @param parent Parent node
 * @param child Child node
 * @param digit Digit (0-9) for child position
 * @return K_OK on success, error code on failure
 */
k_error_t kolibri_node_add_child(k_node_t* parent, k_node_t* child, 
                                  uint8_t digit);

/**
 * @brief Find a node by address
 * @param root Root node
 * @param address Address to find
 * @return Pointer to node, or NULL if not found
 */
k_node_t* kolibri_node_find(k_node_t* root, const k_address_t* address);

/**
 * @brief Parse an address string (e.g., "1.2.3")
 * @param str Address string
 * @param address Output address structure
 * @return K_OK on success, error code on failure
 */
k_error_t kolibri_address_parse(const char* str, k_address_t* address);

/**
 * @brief Format an address to string
 * @param address Address structure
 * @param buffer Output buffer
 * @param size Buffer size
 * @return Number of characters written
 */
int kolibri_address_format(const k_address_t* address, char* buffer, size_t size);

/**
 * @brief Count total nodes in tree
 * @param root Root node
 * @return Number of nodes
 */
uint32_t kolibri_node_count(const k_node_t* root);

/* ============================================================================
 * Blockchain API (kolibri_blockchain.c)
 * ============================================================================ */

/**
 * @brief Create a new blockchain
 * @return Pointer to new blockchain, or NULL on failure
 */
k_blockchain_t* kolibri_chain_create(void);

/**
 * @brief Destroy a blockchain
 * @param chain Blockchain to destroy
 */
void kolibri_chain_destroy(k_blockchain_t* chain);

/**
 * @brief Add a block to the chain
 * @param chain Blockchain
 * @param data Block data
 * @return K_OK on success, error code on failure
 */
k_error_t kolibri_chain_add_block(k_blockchain_t* chain, const char* data);

/**
 * @brief Validate the entire blockchain
 * @param chain Blockchain to validate
 * @return true if valid, false if corrupted
 */
bool kolibri_chain_validate(const k_blockchain_t* chain);

/**
 * @brief Get the latest block
 * @param chain Blockchain
 * @return Pointer to latest block, or NULL if empty
 */
const k_block_t* kolibri_chain_get_latest(const k_blockchain_t* chain);

/**
 * @brief Calculate SHA256 hash
 * @param data Input data
 * @param len Data length
 * @param hash Output hash
 */
void kolibri_sha256(const uint8_t* data, size_t len, k_hash_t* hash);

/**
 * @brief Format hash as hex string
 * @param hash Hash structure
 * @param buffer Output buffer (must be at least 65 bytes)
 * @param size Buffer size
 * @return Number of characters written
 */
int kolibri_hash_format(const k_hash_t* hash, char* buffer, size_t size);

/* ============================================================================
 * Storage API (kolibri_storage.c)
 * ============================================================================ */

/**
 * @brief Save knowledge base to file
 * @param kb Knowledge base
 * @param filepath File path
 * @return K_OK on success, error code on failure
 */
k_error_t kolibri_save(const k_kb_t* kb, const char* filepath);

/**
 * @brief Load knowledge base from file
 * @param filepath File path
 * @return Pointer to loaded KB, or NULL on failure
 */
k_kb_t* kolibri_load(const char* filepath);

/**
 * @brief Export knowledge base to DSL text format
 * @param kb Knowledge base
 * @param buffer Output buffer
 * @param size Buffer size
 * @return Number of characters written
 */
int kolibri_export_dsl(const k_kb_t* kb, char* buffer, size_t size);

/**
 * @brief Import formulas from DSL text
 * @param kb Knowledge base
 * @param dsl DSL text
 * @return Number of formulas imported, or negative on error
 */
int kolibri_import_dsl(k_kb_t* kb, const char* dsl);

/* ============================================================================
 * CLI API (kolibri_cli.c)
 * ============================================================================ */

/**
 * @brief Run the interactive CLI/REPL
 * @param kb Initial knowledge base (or NULL for new)
 * @return Exit code
 */
int kolibri_cli_run(k_kb_t* kb);

/**
 * @brief Process a single CLI command
 * @param kb Knowledge base
 * @param command Command string
 * @param output Output buffer for response
 * @param output_size Output buffer size
 * @return K_OK on success, error code on failure
 */
k_error_t kolibri_cli_command(k_kb_t* kb, const char* command,
                               char* output, size_t output_size);

/* ============================================================================
 * Utility Functions
 * ============================================================================ */

/**
 * @brief Get error message string
 * @param error Error code
 * @return Human-readable error message
 */
const char* kolibri_error_str(k_error_t error);

/**
 * @brief Get version string
 * @return Version string
 */
const char* kolibri_version(void);

/**
 * @brief Encode text to decimal sequence
 * @param text Input text
 * @param digits Output digit buffer
 * @param max_len Maximum output length
 * @return Number of digits written
 */
int kolibri_encode_decimal(const char* text, char* digits, size_t max_len);

/**
 * @brief Decode decimal sequence to text
 * @param digits Input digits
 * @param text Output text buffer
 * @param max_len Maximum output length
 * @return Number of characters written
 */
int kolibri_decode_decimal(const char* digits, char* text, size_t max_len);

#ifdef __cplusplus
}
#endif

#endif /* KOLIBRI_H */
