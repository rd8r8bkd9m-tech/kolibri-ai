/**
 * @file kolibri_blockchain.c
 * @brief Kolibri AI Micro-Blockchain Implementation
 * 
 * Implements a simple blockchain for knowledge versioning with SHA256 hashing.
 * Uses a portable SHA256 implementation (no external dependencies).
 */

#include "kolibri.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================================
 * SHA256 Implementation (Portable, No Dependencies)
 * ============================================================================
 * Based on RFC 6234 / FIPS 180-4
 */

#define SHA256_BLOCK_SIZE 64

typedef struct {
    uint32_t state[8];
    uint64_t count;
    uint8_t buffer[SHA256_BLOCK_SIZE];
} sha256_ctx_t;

static const uint32_t sha256_k[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

#define ROTR(x, n) (((x) >> (n)) | ((x) << (32 - (n))))
#define CH(x, y, z) (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x, y, z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x) (ROTR(x, 2) ^ ROTR(x, 13) ^ ROTR(x, 22))
#define EP1(x) (ROTR(x, 6) ^ ROTR(x, 11) ^ ROTR(x, 25))
#define SIG0(x) (ROTR(x, 7) ^ ROTR(x, 18) ^ ((x) >> 3))
#define SIG1(x) (ROTR(x, 17) ^ ROTR(x, 19) ^ ((x) >> 10))

static void sha256_init(sha256_ctx_t* ctx) {
    ctx->state[0] = 0x6a09e667;
    ctx->state[1] = 0xbb67ae85;
    ctx->state[2] = 0x3c6ef372;
    ctx->state[3] = 0xa54ff53a;
    ctx->state[4] = 0x510e527f;
    ctx->state[5] = 0x9b05688c;
    ctx->state[6] = 0x1f83d9ab;
    ctx->state[7] = 0x5be0cd19;
    ctx->count = 0;
}

static void sha256_transform(sha256_ctx_t* ctx, const uint8_t* data) {
    uint32_t w[64];
    uint32_t a, b, c, d, e, f, g, h;
    uint32_t t1, t2;
    int i;
    
    /* Prepare message schedule */
    for (i = 0; i < 16; i++) {
        w[i] = ((uint32_t)data[i * 4] << 24) |
               ((uint32_t)data[i * 4 + 1] << 16) |
               ((uint32_t)data[i * 4 + 2] << 8) |
               ((uint32_t)data[i * 4 + 3]);
    }
    for (i = 16; i < 64; i++) {
        w[i] = SIG1(w[i - 2]) + w[i - 7] + SIG0(w[i - 15]) + w[i - 16];
    }
    
    /* Initialize working variables */
    a = ctx->state[0];
    b = ctx->state[1];
    c = ctx->state[2];
    d = ctx->state[3];
    e = ctx->state[4];
    f = ctx->state[5];
    g = ctx->state[6];
    h = ctx->state[7];
    
    /* Main loop */
    for (i = 0; i < 64; i++) {
        t1 = h + EP1(e) + CH(e, f, g) + sha256_k[i] + w[i];
        t2 = EP0(a) + MAJ(a, b, c);
        h = g;
        g = f;
        f = e;
        e = d + t1;
        d = c;
        c = b;
        b = a;
        a = t1 + t2;
    }
    
    /* Add to state */
    ctx->state[0] += a;
    ctx->state[1] += b;
    ctx->state[2] += c;
    ctx->state[3] += d;
    ctx->state[4] += e;
    ctx->state[5] += f;
    ctx->state[6] += g;
    ctx->state[7] += h;
}

static void sha256_update(sha256_ctx_t* ctx, const uint8_t* data, size_t len) {
    size_t buf_len = (size_t)(ctx->count % SHA256_BLOCK_SIZE);
    
    ctx->count += len;
    
    /* Fill buffer first */
    if (buf_len > 0) {
        size_t space = SHA256_BLOCK_SIZE - buf_len;
        if (len < space) {
            memcpy(ctx->buffer + buf_len, data, len);
            return;
        }
        memcpy(ctx->buffer + buf_len, data, space);
        sha256_transform(ctx, ctx->buffer);
        data += space;
        len -= space;
    }
    
    /* Process full blocks */
    while (len >= SHA256_BLOCK_SIZE) {
        sha256_transform(ctx, data);
        data += SHA256_BLOCK_SIZE;
        len -= SHA256_BLOCK_SIZE;
    }
    
    /* Store remaining */
    if (len > 0) {
        memcpy(ctx->buffer, data, len);
    }
}

static void sha256_final(sha256_ctx_t* ctx, uint8_t* hash) {
    size_t buf_len = (size_t)(ctx->count % SHA256_BLOCK_SIZE);
    uint64_t bit_count = ctx->count * 8;
    
    /* Padding */
    ctx->buffer[buf_len++] = 0x80;
    
    if (buf_len > 56) {
        memset(ctx->buffer + buf_len, 0, SHA256_BLOCK_SIZE - buf_len);
        sha256_transform(ctx, ctx->buffer);
        buf_len = 0;
    }
    
    memset(ctx->buffer + buf_len, 0, 56 - buf_len);
    
    /* Append length */
    for (int i = 0; i < 8; i++) {
        ctx->buffer[63 - i] = (uint8_t)(bit_count >> (i * 8));
    }
    sha256_transform(ctx, ctx->buffer);
    
    /* Output hash */
    for (int i = 0; i < 8; i++) {
        hash[i * 4] = (uint8_t)(ctx->state[i] >> 24);
        hash[i * 4 + 1] = (uint8_t)(ctx->state[i] >> 16);
        hash[i * 4 + 2] = (uint8_t)(ctx->state[i] >> 8);
        hash[i * 4 + 3] = (uint8_t)(ctx->state[i]);
    }
}

/* ============================================================================
 * SHA256 Public API
 * ============================================================================ */

void kolibri_sha256(const uint8_t* data, size_t len, k_hash_t* hash) {
    if (!data || !hash) return;
    
    sha256_ctx_t ctx;
    sha256_init(&ctx);
    sha256_update(&ctx, data, len);
    sha256_final(&ctx, hash->bytes);
}

int kolibri_hash_format(const k_hash_t* hash, char* buffer, size_t size) {
    if (!hash || !buffer || size < 65) return 0;
    
    static const char hex[] = "0123456789abcdef";
    for (int i = 0; i < 32; i++) {
        buffer[i * 2] = hex[(hash->bytes[i] >> 4) & 0xf];
        buffer[i * 2 + 1] = hex[hash->bytes[i] & 0xf];
    }
    buffer[64] = '\0';
    return 64;
}

/* ============================================================================
 * Blockchain Management
 * ============================================================================ */

#define INITIAL_CHAIN_CAPACITY 100

k_blockchain_t* kolibri_chain_create(void) {
    k_blockchain_t* chain = (k_blockchain_t*)calloc(1, sizeof(k_blockchain_t));
    if (!chain) return NULL;
    
    chain->capacity = INITIAL_CHAIN_CAPACITY;
    chain->blocks = (k_block_t*)calloc(chain->capacity, sizeof(k_block_t));
    if (!chain->blocks) {
        free(chain);
        return NULL;
    }
    
    chain->count = 0;
    
    /* Create genesis block */
    k_block_t* genesis = &chain->blocks[0];
    genesis->index = 0;
    genesis->timestamp = time(NULL);
    memset(&genesis->prev_hash, 0, sizeof(k_hash_t));
    strncpy(genesis->data, "GENESIS", sizeof(genesis->data) - 1);
    genesis->nonce = 0;
    
    /* Calculate genesis hash */
    uint8_t block_data[512];
    int len = snprintf((char*)block_data, sizeof(block_data),
                       "%llu:%lld:%s:%u",
                       (unsigned long long)genesis->index,
                       (long long)genesis->timestamp,
                       genesis->data,
                       genesis->nonce);
    kolibri_sha256(block_data, (size_t)len, &genesis->hash);
    
    chain->count = 1;
    return chain;
}

void kolibri_chain_destroy(k_blockchain_t* chain) {
    if (!chain) return;
    if (chain->blocks) {
        free(chain->blocks);
    }
    free(chain);
}

static void calculate_block_hash(k_block_t* block, const k_hash_t* prev_hash) {
    uint8_t block_data[1024];
    char prev_hash_str[65] = {0};
    
    if (prev_hash) {
        kolibri_hash_format(prev_hash, prev_hash_str, sizeof(prev_hash_str));
    }
    
    int len = snprintf((char*)block_data, sizeof(block_data),
                       "%llu:%lld:%s:%s:%u",
                       (unsigned long long)block->index,
                       (long long)block->timestamp,
                       prev_hash_str,
                       block->data,
                       block->nonce);
    
    kolibri_sha256(block_data, (size_t)len, &block->hash);
}

k_error_t kolibri_chain_add_block(k_blockchain_t* chain, const char* data) {
    if (!chain || !data) {
        return K_ERR_NULL_PTR;
    }
    
    /* Expand if needed */
    if (chain->count >= chain->capacity) {
        uint64_t new_capacity = chain->capacity * 2;
        k_block_t* new_blocks = (k_block_t*)realloc(
            chain->blocks, new_capacity * sizeof(k_block_t));
        if (!new_blocks) {
            return K_ERR_OUT_OF_MEM;
        }
        chain->blocks = new_blocks;
        chain->capacity = new_capacity;
    }
    
    /* Get previous block */
    k_block_t* prev = &chain->blocks[chain->count - 1];
    k_block_t* block = &chain->blocks[chain->count];
    
    memset(block, 0, sizeof(k_block_t));
    block->index = chain->count;
    block->timestamp = time(NULL);
    memcpy(&block->prev_hash, &prev->hash, sizeof(k_hash_t));
    strncpy(block->data, data, sizeof(block->data) - 1);
    block->nonce = 0;
    
    /* Calculate hash */
    calculate_block_hash(block, &prev->hash);
    
    chain->count++;
    return K_OK;
}

bool kolibri_chain_validate(const k_blockchain_t* chain) {
    if (!chain || chain->count == 0) {
        return false;
    }
    
    /* Verify each block */
    for (uint64_t i = 1; i < chain->count; i++) {
        const k_block_t* current = &chain->blocks[i];
        const k_block_t* prev = &chain->blocks[i - 1];
        
        /* Verify previous hash link */
        if (memcmp(&current->prev_hash, &prev->hash, sizeof(k_hash_t)) != 0) {
            return false;
        }
        
        /* Verify current block hash */
        k_hash_t computed_hash;
        uint8_t block_data[1024];
        char prev_hash_str[65];
        kolibri_hash_format(&prev->hash, prev_hash_str, sizeof(prev_hash_str));
        
        int len = snprintf((char*)block_data, sizeof(block_data),
                           "%llu:%lld:%s:%s:%u",
                           (unsigned long long)current->index,
                           (long long)current->timestamp,
                           prev_hash_str,
                           current->data,
                           current->nonce);
        
        kolibri_sha256(block_data, (size_t)len, &computed_hash);
        
        if (memcmp(&computed_hash, &current->hash, sizeof(k_hash_t)) != 0) {
            return false;
        }
    }
    
    return true;
}

const k_block_t* kolibri_chain_get_latest(const k_blockchain_t* chain) {
    if (!chain || chain->count == 0) {
        return NULL;
    }
    return &chain->blocks[chain->count - 1];
}
