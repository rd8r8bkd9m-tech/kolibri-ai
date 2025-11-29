/**
 * @file kolibri_storage.c
 * @brief Kolibri AI Storage Implementation
 * 
 * Implements file persistence for knowledge bases using a simple text format.
 */

#include "kolibri.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================================
 * File Format Constants
 * ============================================================================ */

#define KOLIBRI_FILE_MAGIC "KOLIBRI"
#define KOLIBRI_FILE_VERSION 1

/* ============================================================================
 * Save Operations
 * ============================================================================ */

k_error_t kolibri_save(const k_kb_t* kb, const char* filepath) {
    if (!kb || !filepath) {
        return K_ERR_NULL_PTR;
    }
    
    FILE* f = fopen(filepath, "w");
    if (!f) {
        return K_ERR_IO;
    }
    
    /* Write header */
    fprintf(f, "%s\n", KOLIBRI_FILE_MAGIC);
    fprintf(f, "VERSION:%d\n", KOLIBRI_FILE_VERSION);
    fprintf(f, "NAME:%s\n", kb->name);
    fprintf(f, "CREATED:%lld\n", (long long)kb->created_at);
    fprintf(f, "UPDATED:%lld\n", (long long)kb->updated_at);
    fprintf(f, "FORMULAS:%u\n", kb->formula_count);
    fprintf(f, "\n");
    
    /* Write formulas */
    fprintf(f, "# Formulas (DSL format)\n");
    fprintf(f, "# PATTERN -> ACTION | CONFIDENCE | TAGS\n");
    fprintf(f, "\n");
    
    for (uint32_t i = 0; i < kb->formula_count; i++) {
        const k_formula_t* formula = &kb->formulas[i];
        
        /* Build tags string */
        char tags[512] = "";
        for (uint8_t t = 0; t < formula->tag_count; t++) {
            if (t > 0) strcat(tags, ",");
            strcat(tags, formula->tags[t]);
        }
        
        /* Write formula in DSL format */
        fprintf(f, "FORMULA:%llu\n", (unsigned long long)formula->id);
        fprintf(f, "  PATTERN: %s\n", formula->pattern);
        fprintf(f, "  ACTION: %s\n", formula->action);
        fprintf(f, "  CONFIDENCE: %.2f\n", formula->confidence);
        fprintf(f, "  TAGS: %s\n", tags);
        fprintf(f, "  USES: %u\n", formula->usage_count);
        fprintf(f, "END_FORMULA\n\n");
    }
    
    /* Write blockchain info */
    if (kb->chain) {
        fprintf(f, "# Blockchain\n");
        fprintf(f, "BLOCKCHAIN_BLOCKS:%llu\n", (unsigned long long)kb->chain->count);
        
        for (uint64_t i = 0; i < kb->chain->count; i++) {
            const k_block_t* block = &kb->chain->blocks[i];
            char hash_str[65];
            kolibri_hash_format(&block->hash, hash_str, sizeof(hash_str));
            fprintf(f, "BLOCK:%llu:%lld:%s:%s\n",
                    (unsigned long long)block->index,
                    (long long)block->timestamp,
                    hash_str,
                    block->data);
        }
    }
    
    fprintf(f, "\n# End of file\n");
    fclose(f);
    
    return K_OK;
}

/* ============================================================================
 * Load Operations
 * ============================================================================ */

static char* trim_whitespace(char* str) {
    while (*str == ' ' || *str == '\t') str++;
    size_t len = strlen(str);
    while (len > 0 && (str[len-1] == ' ' || str[len-1] == '\t' || 
                       str[len-1] == '\n' || str[len-1] == '\r')) {
        str[--len] = '\0';
    }
    return str;
}

static int parse_key_value(const char* line, const char* key, char* value, size_t max_len) {
    size_t key_len = strlen(key);
    if (strncmp(line, key, key_len) == 0 && line[key_len] == ':') {
        const char* val = line + key_len + 1;
        while (*val == ' ') val++;
        strncpy(value, val, max_len - 1);
        value[max_len - 1] = '\0';
        /* Remove trailing newline */
        size_t len = strlen(value);
        while (len > 0 && (value[len-1] == '\n' || value[len-1] == '\r')) {
            value[--len] = '\0';
        }
        return 1;
    }
    return 0;
}

k_kb_t* kolibri_load(const char* filepath) {
    if (!filepath) return NULL;
    
    FILE* f = fopen(filepath, "r");
    if (!f) return NULL;
    
    char line[1024];
    char value[512];
    
    /* Verify magic */
    if (!fgets(line, sizeof(line), f)) {
        fclose(f);
        return NULL;
    }
    trim_whitespace(line);
    if (strcmp(line, KOLIBRI_FILE_MAGIC) != 0) {
        fclose(f);
        return NULL;
    }
    
    /* Create KB */
    k_kb_t* kb = kolibri_kb_create("loading");
    if (!kb) {
        fclose(f);
        return NULL;
    }
    
    /* Parse header and formulas */
    k_formula_t current_formula;
    int in_formula = 0;
    memset(&current_formula, 0, sizeof(current_formula));
    
    while (fgets(line, sizeof(line), f)) {
        char* trimmed = trim_whitespace(line);
        
        /* Skip empty lines and comments */
        if (trimmed[0] == '\0' || trimmed[0] == '#') continue;
        
        /* Header fields */
        if (parse_key_value(trimmed, "NAME", value, sizeof(value))) {
            strncpy(kb->name, value, sizeof(kb->name) - 1);
        }
        else if (parse_key_value(trimmed, "CREATED", value, sizeof(value))) {
            kb->created_at = (time_t)atoll(value);
        }
        else if (parse_key_value(trimmed, "UPDATED", value, sizeof(value))) {
            kb->updated_at = (time_t)atoll(value);
        }
        /* Formula start */
        else if (strncmp(trimmed, "FORMULA:", 8) == 0) {
            in_formula = 1;
            memset(&current_formula, 0, sizeof(current_formula));
            current_formula.id = (uint64_t)atoll(trimmed + 8);
        }
        /* Formula fields */
        else if (in_formula) {
            if (parse_key_value(trimmed, "PATTERN", value, sizeof(value))) {
                strncpy(current_formula.pattern, value, 
                        sizeof(current_formula.pattern) - 1);
            }
            else if (parse_key_value(trimmed, "ACTION", value, sizeof(value))) {
                strncpy(current_formula.action, value, 
                        sizeof(current_formula.action) - 1);
            }
            else if (parse_key_value(trimmed, "CONFIDENCE", value, sizeof(value))) {
                current_formula.confidence = (float)atof(value);
            }
            else if (parse_key_value(trimmed, "TAGS", value, sizeof(value))) {
                /* Parse tags */
                char* token = strtok(value, ",");
                while (token && current_formula.tag_count < KOLIBRI_MAX_TAGS) {
                    while (*token == ' ') token++;
                    strncpy(current_formula.tags[current_formula.tag_count++],
                            token, KOLIBRI_MAX_TAG_LEN - 1);
                    token = strtok(NULL, ",");
                }
            }
            else if (parse_key_value(trimmed, "USES", value, sizeof(value))) {
                current_formula.usage_count = (uint32_t)atoi(value);
            }
            else if (strcmp(trimmed, "END_FORMULA") == 0) {
                /* Add formula to KB */
                if (current_formula.pattern[0] && current_formula.action[0]) {
                    char tags_str[512] = "";
                    for (uint8_t t = 0; t < current_formula.tag_count; t++) {
                        if (t > 0) strcat(tags_str, ",");
                        strcat(tags_str, current_formula.tags[t]);
                    }
                    kolibri_add_formula(kb, current_formula.pattern,
                                        current_formula.action,
                                        current_formula.confidence,
                                        tags_str);
                }
                in_formula = 0;
            }
        }
    }
    
    fclose(f);
    
    /* Store filepath */
    strncpy(kb->filepath, filepath, sizeof(kb->filepath) - 1);
    
    return kb;
}

/* ============================================================================
 * DSL Export/Import
 * ============================================================================ */

int kolibri_export_dsl(const k_kb_t* kb, char* buffer, size_t size) {
    if (!kb || !buffer || size == 0) return 0;
    
    int total = 0;
    char line[1024];
    
    /* Header comment */
    int len = snprintf(line, sizeof(line), 
                       "# Kolibri Knowledge Base: %s\n"
                       "# Format: PATTERN -> ACTION | CONFIDENCE | TAGS\n\n",
                       kb->name);
    if ((size_t)(total + len) >= size) return total;
    strcpy(buffer + total, line);
    total += len;
    
    /* Export each formula */
    for (uint32_t i = 0; i < kb->formula_count; i++) {
        const k_formula_t* f = &kb->formulas[i];
        
        /* Build tags string */
        char tags[256] = "";
        for (uint8_t t = 0; t < f->tag_count; t++) {
            if (t > 0) strcat(tags, ",");
            strcat(tags, f->tags[t]);
        }
        
        len = snprintf(line, sizeof(line), 
                       "\"%s\" -> \"%s\" | %.2f | \"%s\"\n",
                       f->pattern, f->action, f->confidence, tags);
        
        if ((size_t)(total + len) >= size) return total;
        strcpy(buffer + total, line);
        total += len;
    }
    
    return total;
}

int kolibri_import_dsl(k_kb_t* kb, const char* dsl) {
    if (!kb || !dsl) return -1;
    
    int count = 0;
    const char* line_start = dsl;
    
    while (*line_start) {
        /* Skip whitespace and comments */
        while (*line_start == ' ' || *line_start == '\t' || 
               *line_start == '\n' || *line_start == '\r') {
            line_start++;
        }
        if (*line_start == '\0') break;
        if (*line_start == '#') {
            while (*line_start && *line_start != '\n') line_start++;
            continue;
        }
        
        /* Find line end */
        const char* line_end = line_start;
        while (*line_end && *line_end != '\n') line_end++;
        
        /* Copy line for parsing */
        char line[1024];
        size_t line_len = (size_t)(line_end - line_start);
        if (line_len >= sizeof(line)) line_len = sizeof(line) - 1;
        strncpy(line, line_start, line_len);
        line[line_len] = '\0';
        
        /* Parse DSL format: "pattern" -> "action" | confidence | "tags" */
        char pattern[512] = "";
        char action[512] = "";
        char tags[256] = "";
        float confidence = 0.9f;
        
        char* p = line;
        
        /* Parse pattern (quoted) */
        if (*p == '"') {
            p++;
            char* pattern_end = strchr(p, '"');
            if (pattern_end) {
                size_t len = (size_t)(pattern_end - p);
                if (len < sizeof(pattern)) {
                    strncpy(pattern, p, len);
                    pattern[len] = '\0';
                }
                p = pattern_end + 1;
            }
        }
        
        /* Skip to -> */
        char* arrow = strstr(p, "->");
        if (arrow) {
            p = arrow + 2;
            while (*p == ' ') p++;
        }
        
        /* Parse action (quoted) */
        if (*p == '"') {
            p++;
            char* action_end = strchr(p, '"');
            if (action_end) {
                size_t len = (size_t)(action_end - p);
                if (len < sizeof(action)) {
                    strncpy(action, p, len);
                    action[len] = '\0';
                }
                p = action_end + 1;
            }
        }
        
        /* Parse confidence and tags */
        char* pipe1 = strchr(p, '|');
        if (pipe1) {
            confidence = (float)atof(pipe1 + 1);
            char* pipe2 = strchr(pipe1 + 1, '|');
            if (pipe2) {
                char* tags_start = pipe2 + 1;
                while (*tags_start == ' ' || *tags_start == '"') tags_start++;
                char* tags_end = strrchr(tags_start, '"');
                if (tags_end) {
                    size_t len = (size_t)(tags_end - tags_start);
                    if (len < sizeof(tags)) {
                        strncpy(tags, tags_start, len);
                        tags[len] = '\0';
                    }
                } else {
                    strncpy(tags, tags_start, sizeof(tags) - 1);
                }
            }
        }
        
        /* Add formula if valid */
        if (pattern[0] && action[0]) {
            kolibri_add_formula(kb, pattern, action, confidence, tags);
            count++;
        }
        
        line_start = line_end;
    }
    
    return count;
}
