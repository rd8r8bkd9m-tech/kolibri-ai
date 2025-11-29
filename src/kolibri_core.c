/**
 * @file kolibri_core.c
 * @brief Kolibri AI Core Engine Implementation
 * 
 * Implements the formula-based reasoning engine with pattern matching.
 */

#include "kolibri.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* ============================================================================
 * Internal State
 * ============================================================================ */

static bool g_initialized = false;

/* ============================================================================
 * Utility Functions
 * ============================================================================ */

const char* kolibri_error_str(k_error_t error) {
    switch (error) {
        case K_OK:              return "Success";
        case K_ERR_NULL_PTR:    return "Null pointer";
        case K_ERR_OUT_OF_MEM:  return "Out of memory";
        case K_ERR_INVALID_ARG: return "Invalid argument";
        case K_ERR_NOT_FOUND:   return "Not found";
        case K_ERR_FULL:        return "Container full";
        case K_ERR_IO:          return "I/O error";
        case K_ERR_PARSE:       return "Parse error";
        case K_ERR_HASH:        return "Hash error";
        case K_ERR_CHAIN:       return "Chain error";
        default:                return "Unknown error";
    }
}

const char* kolibri_version(void) {
    return KOLIBRI_VERSION;
}

int kolibri_encode_decimal(const char* text, char* digits, size_t max_len) {
    if (!text || !digits || max_len == 0) return 0;
    
    size_t i = 0;
    size_t j = 0;
    
    while (text[i] && j + 2 < max_len) {
        unsigned char c = (unsigned char)text[i];
        /* Encode each character as 3 decimal digits (000-255) */
        digits[j++] = '0' + (c / 100);
        digits[j++] = '0' + ((c / 10) % 10);
        digits[j++] = '0' + (c % 10);
        i++;
    }
    digits[j] = '\0';
    return (int)j;
}

int kolibri_decode_decimal(const char* digits, char* text, size_t max_len) {
    if (!digits || !text || max_len == 0) return 0;
    
    size_t i = 0;
    size_t j = 0;
    size_t len = strlen(digits);
    
    while (i + 2 < len && j + 1 < max_len) {
        if (!isdigit(digits[i]) || !isdigit(digits[i+1]) || !isdigit(digits[i+2])) {
            break;
        }
        int value = (digits[i] - '0') * 100 + 
                    (digits[i+1] - '0') * 10 + 
                    (digits[i+2] - '0');
        if (value > 255) break;
        text[j++] = (char)value;
        i += 3;
    }
    text[j] = '\0';
    return (int)j;
}

/* ============================================================================
 * Engine Initialization
 * ============================================================================ */

k_error_t kolibri_init(void) {
    if (g_initialized) {
        return K_OK;
    }
    g_initialized = true;
    return K_OK;
}

void kolibri_shutdown(void) {
    g_initialized = false;
}

/* ============================================================================
 * Knowledge Base Management
 * ============================================================================ */

k_kb_t* kolibri_kb_create(const char* name) {
    k_kb_t* kb = (k_kb_t*)calloc(1, sizeof(k_kb_t));
    if (!kb) return NULL;
    
    /* Initial formula capacity */
    kb->formula_capacity = 100;
    kb->formulas = (k_formula_t*)calloc(kb->formula_capacity, sizeof(k_formula_t));
    if (!kb->formulas) {
        free(kb);
        return NULL;
    }
    
    /* Create root memory node */
    kb->root = kolibri_node_create(K_TYPE_ROOT, "root", "");
    if (!kb->root) {
        free(kb->formulas);
        free(kb);
        return NULL;
    }
    
    /* Create blockchain */
    kb->chain = kolibri_chain_create();
    if (!kb->chain) {
        kolibri_node_destroy(kb->root);
        free(kb->formulas);
        free(kb);
        return NULL;
    }
    
    /* Set name and timestamps */
    if (name) {
        strncpy(kb->name, name, sizeof(kb->name) - 1);
    } else {
        strcpy(kb->name, "default");
    }
    kb->created_at = time(NULL);
    kb->updated_at = kb->created_at;
    
    return kb;
}

void kolibri_kb_destroy(k_kb_t* kb) {
    if (!kb) return;
    
    if (kb->formulas) {
        free(kb->formulas);
    }
    if (kb->root) {
        kolibri_node_destroy(kb->root);
    }
    if (kb->chain) {
        kolibri_chain_destroy(kb->chain);
    }
    free(kb);
}

/* ============================================================================
 * Formula Management
 * ============================================================================ */

static void parse_tags(const char* tags_str, k_formula_t* formula) {
    if (!tags_str || !formula) return;
    
    formula->tag_count = 0;
    char temp[KOLIBRI_MAX_FORMULA_LEN];
    strncpy(temp, tags_str, sizeof(temp) - 1);
    temp[sizeof(temp) - 1] = '\0';
    
    char* token = strtok(temp, ",");
    while (token && formula->tag_count < KOLIBRI_MAX_TAGS) {
        /* Trim whitespace */
        while (*token == ' ') token++;
        char* end = token + strlen(token) - 1;
        while (end > token && *end == ' ') *end-- = '\0';
        
        if (*token) {
            strncpy(formula->tags[formula->tag_count], token, 
                    KOLIBRI_MAX_TAG_LEN - 1);
            formula->tag_count++;
        }
        token = strtok(NULL, ",");
    }
}

static uint64_t generate_formula_id(void) {
    static uint64_t counter = 0;
    return (uint64_t)time(NULL) * 1000 + (++counter);
}

uint64_t kolibri_add_formula(k_kb_t* kb, const char* pattern, 
                              const char* action, float confidence,
                              const char* tags) {
    if (!kb || !pattern || !action) return 0;
    
    /* Expand array if needed */
    if (kb->formula_count >= kb->formula_capacity) {
        uint32_t new_capacity = kb->formula_capacity * 2;
        k_formula_t* new_formulas = (k_formula_t*)realloc(
            kb->formulas, new_capacity * sizeof(k_formula_t));
        if (!new_formulas) return 0;
        kb->formulas = new_formulas;
        kb->formula_capacity = new_capacity;
    }
    
    k_formula_t* f = &kb->formulas[kb->formula_count];
    memset(f, 0, sizeof(k_formula_t));
    
    strncpy(f->pattern, pattern, KOLIBRI_MAX_FORMULA_LEN - 1);
    strncpy(f->action, action, KOLIBRI_MAX_FORMULA_LEN - 1);
    f->confidence = (confidence >= 0.0f && confidence <= 1.0f) ? confidence : 0.9f;
    f->id = generate_formula_id();
    f->created_at = time(NULL);
    f->updated_at = f->created_at;
    f->usage_count = 0;
    
    if (tags) {
        parse_tags(tags, f);
    }
    
    kb->formula_count++;
    kb->updated_at = time(NULL);
    
    /* Record in blockchain */
    char block_data[KOLIBRI_BLOCK_DATA_SIZE];
    snprintf(block_data, sizeof(block_data), "ADD:%s->%s", pattern, action);
    kolibri_chain_add_block(kb->chain, block_data);
    
    return f->id;
}

/* ============================================================================
 * Pattern Matching
 * ============================================================================ */

/**
 * @brief Extract variables from a pattern and match against input
 * 
 * Pattern format: "what is {X}" where {X} is a variable
 * This function tries to match the input against the pattern and extract
 * variable values.
 */
static bool match_pattern(const char* pattern, const char* input, 
                          char vars[][64], char vals[][256], int* var_count) {
    *var_count = 0;
    
    const char* p = pattern;
    const char* i = input;
    
    while (*p && *i) {
        if (*p == '{') {
            /* Found variable start */
            const char* var_start = p + 1;
            const char* var_end = strchr(var_start, '}');
            if (!var_end) return false;
            
            /* Extract variable name */
            size_t var_len = var_end - var_start;
            if (var_len >= 64 || *var_count >= 10) return false;
            strncpy(vars[*var_count], var_start, var_len);
            vars[*var_count][var_len] = '\0';
            
            /* Find the next literal in pattern */
            p = var_end + 1;
            
            /* Capture value until next literal or end */
            const char* val_start = i;
            if (*p) {
                /* Find where the next literal starts in input */
                const char* next_lit = i;
                while (*next_lit && *next_lit != *p) {
                    next_lit++;
                }
                size_t val_len = next_lit - val_start;
                if (val_len >= 256) return false;
                strncpy(vals[*var_count], val_start, val_len);
                vals[*var_count][val_len] = '\0';
                i = next_lit;
            } else {
                /* Capture rest of input - leave room for null terminator */
                size_t copy_len = strlen(val_start);
                if (copy_len > 254) copy_len = 254;
                strncpy(vals[*var_count], val_start, copy_len);
                vals[*var_count][copy_len] = '\0';
                i += strlen(vals[*var_count]);
            }
            (*var_count)++;
        } else {
            /* Literal comparison (case insensitive) */
            if (tolower(*p) != tolower(*i)) {
                return false;
            }
            p++;
            i++;
        }
    }
    
    /* Check if we consumed both pattern and input */
    return (*p == '\0' && *i == '\0');
}

/**
 * @brief Apply an action template with variable substitution
 */
static void apply_action(const char* action, char vars[][64], char vals[][256],
                         int var_count, char* result, size_t result_size) {
    size_t j = 0;
    const char* a = action;
    
    while (*a && j + 1 < result_size) {
        if (*a == '{') {
            const char* var_start = a + 1;
            const char* var_end = strchr(var_start, '}');
            if (var_end) {
                /* Find matching variable */
                size_t var_len = var_end - var_start;
                for (int i = 0; i < var_count; i++) {
                    if (strlen(vars[i]) == var_len && 
                        strncmp(vars[i], var_start, var_len) == 0) {
                        size_t val_len = strlen(vals[i]);
                        if (j + val_len < result_size) {
                            strcpy(result + j, vals[i]);
                            j += val_len;
                        }
                        break;
                    }
                }
                a = var_end + 1;
                continue;
            }
        }
        result[j++] = *a++;
    }
    result[j] = '\0';
}

/* ============================================================================
 * Query Processing
 * ============================================================================ */

k_error_t kolibri_query(k_kb_t* kb, const char* query, k_result_t* result) {
    if (!kb || !query || !result) {
        return K_ERR_NULL_PTR;
    }
    
    memset(result, 0, sizeof(k_result_t));
    
    char vars[10][64];
    char vals[10][256];
    int var_count;
    
    k_formula_t* best_match = NULL;
    float best_confidence = 0.0f;
    char best_vars[10][64];
    char best_vals[10][256];
    int best_var_count = 0;
    
    /* Find best matching formula */
    for (uint32_t i = 0; i < kb->formula_count; i++) {
        k_formula_t* f = &kb->formulas[i];
        
        if (match_pattern(f->pattern, query, vars, vals, &var_count)) {
            if (f->confidence > best_confidence) {
                best_match = f;
                best_confidence = f->confidence;
                best_var_count = var_count;
                memcpy(best_vars, vars, sizeof(vars));
                memcpy(best_vals, vals, sizeof(vals));
            }
        }
    }
    
    if (best_match) {
        apply_action(best_match->action, best_vars, best_vals, best_var_count,
                     result->answer, sizeof(result->answer));
        result->matched_formula = best_match;
        result->confidence = best_match->confidence;
        result->success = true;
        best_match->usage_count++;
        return K_OK;
    }
    
    /* No match found */
    strncpy(result->answer, "I don't know the answer to that.", 
            sizeof(result->answer) - 1);
    result->success = false;
    result->confidence = 0.0f;
    return K_ERR_NOT_FOUND;
}

/* ============================================================================
 * Statistics and Listing
 * ============================================================================ */

void kolibri_stats(const k_kb_t* kb, uint32_t* formula_count, 
                   uint32_t* node_count, uint32_t* block_count) {
    if (formula_count) {
        *formula_count = kb ? kb->formula_count : 0;
    }
    if (node_count) {
        *node_count = kb && kb->root ? kolibri_node_count(kb->root) : 0;
    }
    if (block_count) {
        *block_count = kb && kb->chain ? (uint32_t)kb->chain->count : 0;
    }
}

void kolibri_list_formulas(const k_kb_t* kb, 
                           void (*callback)(const k_formula_t*, void*),
                           void* user_data) {
    if (!kb || !callback) return;
    
    for (uint32_t i = 0; i < kb->formula_count; i++) {
        callback(&kb->formulas[i], user_data);
    }
}
