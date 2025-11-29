/**
 * @file test_core.c
 * @brief Unit tests for Kolibri AI Core Engine
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

TEST(init_shutdown) {
    k_error_t err = kolibri_init();
    assert(err == K_OK);
    
    kolibri_shutdown();
    
    /* Can reinitialize */
    err = kolibri_init();
    assert(err == K_OK);
    kolibri_shutdown();
}

TEST(kb_create_destroy) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    assert(strcmp(kb->name, "test") == 0);
    assert(kb->formula_count == 0);
    assert(kb->root != NULL);
    assert(kb->chain != NULL);
    
    kolibri_kb_destroy(kb);
}

TEST(add_formula) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    uint64_t id = kolibri_add_formula(kb, "hello", "Hi there!", 0.9f, "greeting");
    assert(id > 0);
    assert(kb->formula_count == 1);
    
    id = kolibri_add_formula(kb, "what is {X}", "lookup({X})", 0.8f, "question,lookup");
    assert(id > 0);
    assert(kb->formula_count == 2);
    
    kolibri_kb_destroy(kb);
}

TEST(simple_query) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "hello", "Hello! How can I help you?", 0.95f, "greeting");
    
    k_result_t result;
    k_error_t err = kolibri_query(kb, "hello", &result);
    
    assert(err == K_OK);
    assert(result.success == true);
    assert(strcmp(result.answer, "Hello! How can I help you?") == 0);
    assert(result.confidence > 0.9f);
    
    kolibri_kb_destroy(kb);
}

TEST(pattern_matching) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "what is {X}", "The answer about {X} is unknown", 0.8f, "question");
    
    k_result_t result;
    k_error_t err = kolibri_query(kb, "what is AI", &result);
    
    assert(err == K_OK);
    assert(result.success == true);
    assert(strstr(result.answer, "AI") != NULL);
    
    kolibri_kb_destroy(kb);
}

TEST(no_match) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "hello", "Hi!", 0.9f, "");
    
    k_result_t result;
    k_error_t err = kolibri_query(kb, "goodbye", &result);
    
    assert(err == K_ERR_NOT_FOUND);
    assert(result.success == false);
    
    kolibri_kb_destroy(kb);
}

TEST(stats) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "test1", "result1", 0.9f, "");
    kolibri_add_formula(kb, "test2", "result2", 0.9f, "");
    kolibri_add_formula(kb, "test3", "result3", 0.9f, "");
    
    uint32_t formula_count, node_count, block_count;
    kolibri_stats(kb, &formula_count, &node_count, &block_count);
    
    assert(formula_count == 3);
    assert(node_count >= 1);  /* At least root */
    assert(block_count >= 1);  /* At least genesis + 3 adds */
    
    kolibri_kb_destroy(kb);
}

TEST(decimal_encoding) {
    char digits[100];
    char decoded[100];
    
    int len = kolibri_encode_decimal("ABC", digits, sizeof(digits));
    assert(len == 9);  /* 3 chars * 3 digits each */
    
    len = kolibri_decode_decimal(digits, decoded, sizeof(decoded));
    assert(len == 3);
    assert(strcmp(decoded, "ABC") == 0);
}

TEST(version) {
    const char* version = kolibri_version();
    assert(version != NULL);
    assert(strlen(version) > 0);
}

TEST(error_strings) {
    assert(strcmp(kolibri_error_str(K_OK), "Success") == 0);
    assert(strcmp(kolibri_error_str(K_ERR_NULL_PTR), "Null pointer") == 0);
    assert(strcmp(kolibri_error_str(K_ERR_OUT_OF_MEM), "Out of memory") == 0);
}

/* ============================================================================
 * Main
 * ============================================================================ */

int main(void) {
    printf("\n");
    printf("╔════════════════════════════════════╗\n");
    printf("║   Kolibri AI Core Tests            ║\n");
    printf("╚════════════════════════════════════╝\n");
    printf("\n");
    
    kolibri_init();
    
    RUN_TEST(init_shutdown);
    RUN_TEST(kb_create_destroy);
    RUN_TEST(add_formula);
    RUN_TEST(simple_query);
    RUN_TEST(pattern_matching);
    RUN_TEST(no_match);
    RUN_TEST(stats);
    RUN_TEST(decimal_encoding);
    RUN_TEST(version);
    RUN_TEST(error_strings);
    
    kolibri_shutdown();
    
    printf("\n");
    printf("══════════════════════════════════════\n");
    printf("  All core tests passed!\n");
    printf("══════════════════════════════════════\n");
    printf("\n");
    
    return 0;
}
