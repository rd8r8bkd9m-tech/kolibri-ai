/**
 * @file test_formulas.c
 * @brief Unit tests for Kolibri AI Formula System
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

TEST(simple_pattern) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "hello world", "Greetings!", 0.95f, "");
    
    k_result_t result;
    k_error_t err = kolibri_query(kb, "hello world", &result);
    
    assert(err == K_OK);
    assert(result.success == true);
    assert(strcmp(result.answer, "Greetings!") == 0);
    
    kolibri_kb_destroy(kb);
}

TEST(single_variable) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "define {X}", "{X} is a concept", 0.9f, "definition");
    
    k_result_t result;
    k_error_t err = kolibri_query(kb, "define knowledge", &result);
    
    assert(err == K_OK);
    assert(result.success == true);
    assert(strstr(result.answer, "knowledge") != NULL);
    
    kolibri_kb_destroy(kb);
}

TEST(multiple_variables) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "{X} is {Y}", "{X} has property {Y}", 0.9f, "property");
    
    k_result_t result;
    k_error_t err = kolibri_query(kb, "sun is bright", &result);
    
    assert(err == K_OK);
    assert(result.success == true);
    assert(strstr(result.answer, "sun") != NULL);
    assert(strstr(result.answer, "bright") != NULL);
    
    kolibri_kb_destroy(kb);
}

TEST(confidence_priority) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    /* Add two formulas with different confidence */
    kolibri_add_formula(kb, "test", "Low confidence answer", 0.3f, "");
    kolibri_add_formula(kb, "test", "High confidence answer", 0.9f, "");
    
    k_result_t result;
    k_error_t err = kolibri_query(kb, "test", &result);
    
    assert(err == K_OK);
    assert(result.success == true);
    assert(strcmp(result.answer, "High confidence answer") == 0);
    assert(result.confidence > 0.8f);
    
    kolibri_kb_destroy(kb);
}

TEST(formula_tags) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    uint64_t id = kolibri_add_formula(kb, "test", "result", 0.9f, 
                                       "tag1,tag2,tag3");
    assert(id > 0);
    
    assert(kb->formulas[0].tag_count == 3);
    assert(strcmp(kb->formulas[0].tags[0], "tag1") == 0);
    assert(strcmp(kb->formulas[0].tags[1], "tag2") == 0);
    assert(strcmp(kb->formulas[0].tags[2], "tag3") == 0);
    
    kolibri_kb_destroy(kb);
}

TEST(usage_tracking) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "count me", "Counted!", 0.9f, "");
    
    assert(kb->formulas[0].usage_count == 0);
    
    k_result_t result;
    kolibri_query(kb, "count me", &result);
    assert(kb->formulas[0].usage_count == 1);
    
    kolibri_query(kb, "count me", &result);
    assert(kb->formulas[0].usage_count == 2);
    
    kolibri_query(kb, "count me", &result);
    assert(kb->formulas[0].usage_count == 3);
    
    kolibri_kb_destroy(kb);
}

TEST(case_insensitive) {
    k_kb_t* kb = kolibri_kb_create("test");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "Hello World", "Matched!", 0.9f, "");
    
    k_result_t result;
    k_error_t err = kolibri_query(kb, "hello world", &result);
    
    assert(err == K_OK);
    assert(result.success == true);
    
    kolibri_kb_destroy(kb);
}

TEST(storage_save_load) {
    const char* test_file = "/tmp/test_kb.kolibri";
    
    /* Create and save */
    k_kb_t* kb = kolibri_kb_create("test_save");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "saved formula", "loaded result", 0.85f, "save,load");
    kolibri_add_formula(kb, "another {X}", "got {X}", 0.75f, "pattern");
    
    k_error_t err = kolibri_save(kb, test_file);
    assert(err == K_OK);
    
    kolibri_kb_destroy(kb);
    
    /* Load and verify */
    kb = kolibri_load(test_file);
    assert(kb != NULL);
    assert(kb->formula_count == 2);
    assert(strcmp(kb->formulas[0].pattern, "saved formula") == 0);
    
    k_result_t result;
    kolibri_query(kb, "saved formula", &result);
    assert(result.success == true);
    
    kolibri_kb_destroy(kb);
    
    /* Cleanup */
    remove(test_file);
}

TEST(dsl_export_import) {
    k_kb_t* kb = kolibri_kb_create("test_dsl");
    assert(kb != NULL);
    
    kolibri_add_formula(kb, "hello", "world", 0.9f, "greeting");
    kolibri_add_formula(kb, "what is {X}", "answer about {X}", 0.8f, "qa");
    
    char buffer[4096];
    int len = kolibri_export_dsl(kb, buffer, sizeof(buffer));
    assert(len > 0);
    assert(strstr(buffer, "hello") != NULL);
    assert(strstr(buffer, "world") != NULL);
    
    /* Import into new KB */
    k_kb_t* kb2 = kolibri_kb_create("test_dsl2");
    int count = kolibri_import_dsl(kb2, buffer);
    assert(count == 2);
    assert(kb2->formula_count == 2);
    
    kolibri_kb_destroy(kb);
    kolibri_kb_destroy(kb2);
}

TEST(memory_node) {
    k_node_t* root = kolibri_node_create(K_TYPE_ROOT, "root", "");
    assert(root != NULL);
    
    k_node_t* child1 = kolibri_node_create(K_TYPE_ENTITY, "entity1", "value1");
    k_node_t* child2 = kolibri_node_create(K_TYPE_ENTITY, "entity2", "value2");
    
    k_error_t err = kolibri_node_add_child(root, child1, 1);
    assert(err == K_OK);
    
    err = kolibri_node_add_child(root, child2, 2);
    assert(err == K_OK);
    
    assert(kolibri_node_count(root) == 3);
    
    kolibri_node_destroy(root);
}

TEST(address_parsing) {
    k_address_t addr;
    k_error_t err;
    
    err = kolibri_address_parse("1.2.3", &addr);
    assert(err == K_OK);
    assert(addr.depth == 3);
    assert(addr.digits[0] == 1);
    assert(addr.digits[1] == 2);
    assert(addr.digits[2] == 3);
    
    char buffer[32];
    int len = kolibri_address_format(&addr, buffer, sizeof(buffer));
    assert(len == 5);  /* "1.2.3" */
    assert(strcmp(buffer, "1.2.3") == 0);
}

/* ============================================================================
 * Main
 * ============================================================================ */

int main(void) {
    printf("\n");
    printf("╔════════════════════════════════════╗\n");
    printf("║   Kolibri AI Formula Tests         ║\n");
    printf("╚════════════════════════════════════╝\n");
    printf("\n");
    
    kolibri_init();
    
    RUN_TEST(simple_pattern);
    RUN_TEST(single_variable);
    RUN_TEST(multiple_variables);
    RUN_TEST(confidence_priority);
    RUN_TEST(formula_tags);
    RUN_TEST(usage_tracking);
    RUN_TEST(case_insensitive);
    RUN_TEST(storage_save_load);
    RUN_TEST(dsl_export_import);
    RUN_TEST(memory_node);
    RUN_TEST(address_parsing);
    
    kolibri_shutdown();
    
    printf("\n");
    printf("══════════════════════════════════════\n");
    printf("  All formula tests passed!\n");
    printf("══════════════════════════════════════\n");
    printf("\n");
    
    return 0;
}
