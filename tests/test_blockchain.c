/**
 * @file test_blockchain.c
 * @brief Unit tests for Kolibri AI Blockchain
 */

#include "../src/kolibri.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

#define TEST(name) static void test_##name(void)
#define RUN_TEST(name) do { \
    printf("  Testing %s... ", #name); \
    test_##name(); \
    printf("OK\n"); \
} while(0)

/* ============================================================================
 * Tests
 * ============================================================================ */

TEST(chain_create_destroy) {
    k_blockchain_t* chain = kolibri_chain_create();
    assert(chain != NULL);
    assert(chain->count == 1);  /* Genesis block */
    
    kolibri_chain_destroy(chain);
}

TEST(genesis_block) {
    k_blockchain_t* chain = kolibri_chain_create();
    assert(chain != NULL);
    
    const k_block_t* genesis = &chain->blocks[0];
    assert(genesis->index == 0);
    assert(strcmp(genesis->data, "GENESIS") == 0);
    
    kolibri_chain_destroy(chain);
}

TEST(add_blocks) {
    k_blockchain_t* chain = kolibri_chain_create();
    assert(chain != NULL);
    
    k_error_t err;
    
    err = kolibri_chain_add_block(chain, "Block 1");
    assert(err == K_OK);
    assert(chain->count == 2);
    
    err = kolibri_chain_add_block(chain, "Block 2");
    assert(err == K_OK);
    assert(chain->count == 3);
    
    err = kolibri_chain_add_block(chain, "Block 3");
    assert(err == K_OK);
    assert(chain->count == 4);
    
    kolibri_chain_destroy(chain);
}

TEST(validate_valid_chain) {
    k_blockchain_t* chain = kolibri_chain_create();
    assert(chain != NULL);
    
    kolibri_chain_add_block(chain, "Block 1");
    kolibri_chain_add_block(chain, "Block 2");
    kolibri_chain_add_block(chain, "Block 3");
    
    bool valid = kolibri_chain_validate(chain);
    assert(valid == true);
    
    kolibri_chain_destroy(chain);
}

TEST(validate_tampered_chain) {
    k_blockchain_t* chain = kolibri_chain_create();
    assert(chain != NULL);
    
    kolibri_chain_add_block(chain, "Block 1");
    kolibri_chain_add_block(chain, "Block 2");
    
    /* Tamper with block data */
    strcpy(chain->blocks[1].data, "TAMPERED");
    
    bool valid = kolibri_chain_validate(chain);
    assert(valid == false);
    
    kolibri_chain_destroy(chain);
}

TEST(get_latest) {
    k_blockchain_t* chain = kolibri_chain_create();
    assert(chain != NULL);
    
    kolibri_chain_add_block(chain, "Latest Block");
    
    const k_block_t* latest = kolibri_chain_get_latest(chain);
    assert(latest != NULL);
    assert(strcmp(latest->data, "Latest Block") == 0);
    
    kolibri_chain_destroy(chain);
}

TEST(sha256_hash) {
    k_hash_t hash;
    const uint8_t data[] = "Hello, Kolibri!";
    
    kolibri_sha256(data, strlen((const char*)data), &hash);
    
    /* Hash should be non-zero */
    int all_zero = 1;
    for (int i = 0; i < KOLIBRI_HASH_SIZE; i++) {
        if (hash.bytes[i] != 0) {
            all_zero = 0;
            break;
        }
    }
    assert(all_zero == 0);
    
    /* Hash should be consistent */
    k_hash_t hash2;
    kolibri_sha256(data, strlen((const char*)data), &hash2);
    assert(memcmp(&hash, &hash2, sizeof(k_hash_t)) == 0);
}

TEST(hash_format) {
    k_hash_t hash;
    const uint8_t data[] = "Test";
    
    kolibri_sha256(data, strlen((const char*)data), &hash);
    
    char buffer[65];
    int len = kolibri_hash_format(&hash, buffer, sizeof(buffer));
    
    assert(len == 64);
    assert(strlen(buffer) == 64);
    
    /* Check it's all hex chars */
    for (int i = 0; i < 64; i++) {
        char c = buffer[i];
        assert((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'));
    }
}

TEST(chain_link_integrity) {
    k_blockchain_t* chain = kolibri_chain_create();
    assert(chain != NULL);
    
    kolibri_chain_add_block(chain, "A");
    kolibri_chain_add_block(chain, "B");
    kolibri_chain_add_block(chain, "C");
    
    /* Verify each block links to previous */
    for (uint64_t i = 1; i < chain->count; i++) {
        assert(memcmp(&chain->blocks[i].prev_hash, 
                      &chain->blocks[i-1].hash, 
                      sizeof(k_hash_t)) == 0);
    }
    
    kolibri_chain_destroy(chain);
}

TEST(large_chain) {
    k_blockchain_t* chain = kolibri_chain_create();
    assert(chain != NULL);
    
    /* Add many blocks */
    for (int i = 0; i < 200; i++) {
        char data[32];
        snprintf(data, sizeof(data), "Block %d", i);
        k_error_t err = kolibri_chain_add_block(chain, data);
        assert(err == K_OK);
    }
    
    assert(chain->count == 201);  /* Genesis + 200 */
    
    bool valid = kolibri_chain_validate(chain);
    assert(valid == true);
    
    kolibri_chain_destroy(chain);
}

/* ============================================================================
 * Main
 * ============================================================================ */

int main(void) {
    printf("\n");
    printf("╔════════════════════════════════════╗\n");
    printf("║   Kolibri AI Blockchain Tests      ║\n");
    printf("╚════════════════════════════════════╝\n");
    printf("\n");
    
    RUN_TEST(chain_create_destroy);
    RUN_TEST(genesis_block);
    RUN_TEST(add_blocks);
    RUN_TEST(validate_valid_chain);
    RUN_TEST(validate_tampered_chain);
    RUN_TEST(get_latest);
    RUN_TEST(sha256_hash);
    RUN_TEST(hash_format);
    RUN_TEST(chain_link_integrity);
    RUN_TEST(large_chain);
    
    printf("\n");
    printf("══════════════════════════════════════\n");
    printf("  All blockchain tests passed!\n");
    printf("══════════════════════════════════════\n");
    printf("\n");
    
    return 0;
}
