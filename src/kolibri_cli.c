/**
 * @file kolibri_cli.c
 * @brief Kolibri AI Command Line Interface (REPL)
 * 
 * Implements the interactive text interface with commands.
 */

#include "kolibri.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================================
 * CLI Help Text
 * ============================================================================ */

static const char* HELP_TEXT = 
    "\n"
    "╔══════════════════════════════════════════════════════════════╗\n"
    "║              Kolibri AI - Knowledge Engine                   ║\n"
    "╚══════════════════════════════════════════════════════════════╝\n"
    "\n"
    "Commands:\n"
    "  /add PATTERN -> ACTION [| CONF | TAGS]   Add a formula\n"
    "  /list                                     List all formulas\n"
    "  /stats                                    Show statistics\n"
    "  /save [filename]                          Save knowledge base\n"
    "  /load <filename>                          Load knowledge base\n"
    "  /validate                                 Validate blockchain\n"
    "  /export [filename]                        Export DSL format\n"
    "  /help                                     Show this help\n"
    "  /quit or /exit                            Exit the program\n"
    "\n"
    "Examples:\n"
    "  /add \"what is {X}\" -> \"lookup({X})\" | 0.9 | \"question\"\n"
    "  /add \"hello\" -> \"Hello! How can I help you?\"\n"
    "\n"
    "Any other input is treated as a query.\n"
    "\n";

/* ============================================================================
 * Command Processing
 * ============================================================================ */

static void cmd_help(char* output, size_t size) {
    strncpy(output, HELP_TEXT, size - 1);
    output[size - 1] = '\0';
}

static void cmd_add(k_kb_t* kb, const char* args, char* output, size_t size) {
    if (!args || !*args) {
        snprintf(output, size, "Error: Usage: /add PATTERN -> ACTION [| CONF | TAGS]");
        return;
    }
    
    /* Parse: "pattern" -> "action" | conf | "tags" */
    char pattern[512] = "";
    char action[512] = "";
    char tags[256] = "";
    float confidence = 0.9f;
    
    const char* p = args;
    
    /* Skip whitespace */
    while (*p == ' ') p++;
    
    /* Parse pattern */
    if (*p == '"') {
        p++;
        const char* end = strchr(p, '"');
        if (!end) {
            snprintf(output, size, "Error: Missing closing quote for pattern");
            return;
        }
        size_t len = (size_t)(end - p);
        if (len >= sizeof(pattern)) len = sizeof(pattern) - 1;
        strncpy(pattern, p, len);
        pattern[len] = '\0';
        p = end + 1;
    } else {
        /* Unquoted pattern - read until -> */
        const char* arrow = strstr(p, "->");
        if (!arrow) {
            snprintf(output, size, "Error: Missing '->' separator");
            return;
        }
        size_t len = (size_t)(arrow - p);
        while (len > 0 && p[len-1] == ' ') len--;
        if (len >= sizeof(pattern)) len = sizeof(pattern) - 1;
        strncpy(pattern, p, len);
        pattern[len] = '\0';
        p = arrow;
    }
    
    /* Find and skip -> */
    const char* arrow = strstr(p, "->");
    if (!arrow) {
        snprintf(output, size, "Error: Missing '->' separator");
        return;
    }
    p = arrow + 2;
    while (*p == ' ') p++;
    
    /* Parse action */
    if (*p == '"') {
        p++;
        const char* end = strchr(p, '"');
        if (!end) {
            snprintf(output, size, "Error: Missing closing quote for action");
            return;
        }
        size_t len = (size_t)(end - p);
        if (len >= sizeof(action)) len = sizeof(action) - 1;
        strncpy(action, p, len);
        action[len] = '\0';
        p = end + 1;
    } else {
        /* Unquoted action - read until | or end */
        const char* pipe = strchr(p, '|');
        const char* end = pipe ? pipe : p + strlen(p);
        size_t len = (size_t)(end - p);
        while (len > 0 && p[len-1] == ' ') len--;
        if (len >= sizeof(action)) len = sizeof(action) - 1;
        strncpy(action, p, len);
        action[len] = '\0';
        p = end;
    }
    
    /* Parse optional confidence */
    const char* pipe1 = strchr(p, '|');
    if (pipe1) {
        const char* conf_start = pipe1 + 1;
        while (*conf_start == ' ') conf_start++;
        confidence = (float)atof(conf_start);
        if (confidence <= 0.0f || confidence > 1.0f) {
            confidence = 0.9f;
        }
        
        /* Parse optional tags */
        const char* pipe2 = strchr(conf_start, '|');
        if (pipe2) {
            const char* tags_start = pipe2 + 1;
            while (*tags_start == ' ' || *tags_start == '"') tags_start++;
            strncpy(tags, tags_start, sizeof(tags) - 1);
            /* Remove trailing quote if present */
            size_t len = strlen(tags);
            if (len > 0 && tags[len-1] == '"') tags[len-1] = '\0';
        }
    }
    
    if (!pattern[0] || !action[0]) {
        snprintf(output, size, "Error: Pattern and action are required");
        return;
    }
    
    uint64_t id = kolibri_add_formula(kb, pattern, action, confidence, tags);
    if (id) {
        snprintf(output, size, 
                 "Added formula #%llu\n"
                 "  Pattern: %s\n"
                 "  Action: %s\n"
                 "  Confidence: %.2f\n"
                 "  Tags: %s",
                 (unsigned long long)id, pattern, action, confidence, 
                 tags[0] ? tags : "(none)");
    } else {
        snprintf(output, size, "Error: Failed to add formula");
    }
}

static void formula_printer(const k_formula_t* f, void* ctx) {
    int* num = (int*)ctx;
    (*num)++;
    printf("  [%d] Pattern: \"%s\"\n", *num, f->pattern);
    printf("       Action:  \"%s\"\n", f->action);
    printf("       Conf: %.2f  Uses: %u\n", f->confidence, f->usage_count);
}

static void cmd_list(k_kb_t* kb, char* output, size_t size) {
    uint32_t count = kb->formula_count;
    
    if (count == 0) {
        snprintf(output, size, "Knowledge base is empty. Use /add to add formulas.");
        return;
    }
    
    printf("\nFormulas in knowledge base:\n");
    printf("─────────────────────────────\n");
    
    int num = 0;
    kolibri_list_formulas(kb, formula_printer, &num);
    
    printf("─────────────────────────────\n");
    snprintf(output, size, "Total: %u formula(s)", count);
}

static void cmd_stats(k_kb_t* kb, char* output, size_t size) {
    uint32_t formula_count, node_count, block_count;
    kolibri_stats(kb, &formula_count, &node_count, &block_count);
    
    snprintf(output, size,
             "\n╔══════════════════════════════════════╗\n"
             "║         Knowledge Base Stats         ║\n"
             "╠══════════════════════════════════════╣\n"
             "║  Name:     %-25s ║\n"
             "║  Formulas: %-25u ║\n"
             "║  Nodes:    %-25u ║\n"
             "║  Blocks:   %-25u ║\n"
             "╚══════════════════════════════════════╝",
             kb->name, formula_count, node_count, block_count);
}

static void cmd_save(k_kb_t* kb, const char* args, char* output, size_t size) {
    const char* filepath = args;
    if (!filepath || !*filepath) {
        filepath = kb->filepath[0] ? kb->filepath : "knowledge.kolibri";
    }
    
    /* Skip leading whitespace */
    while (*filepath == ' ') filepath++;
    
    k_error_t err = kolibri_save(kb, filepath);
    if (err == K_OK) {
        snprintf(output, size, "Saved to: %s", filepath);
        strncpy(kb->filepath, filepath, sizeof(kb->filepath) - 1);
    } else {
        snprintf(output, size, "Error saving: %s", kolibri_error_str(err));
    }
}

static k_kb_t* cmd_load(k_kb_t* kb, const char* args, char* output, size_t size) {
    const char* filepath = args;
    if (!filepath || !*filepath) {
        snprintf(output, size, "Error: Usage: /load <filename>");
        return kb;
    }
    
    /* Skip leading whitespace */
    while (*filepath == ' ') filepath++;
    
    k_kb_t* new_kb = kolibri_load(filepath);
    if (new_kb) {
        kolibri_kb_destroy(kb);
        snprintf(output, size, "Loaded: %s (%u formulas)", filepath, new_kb->formula_count);
        return new_kb;
    } else {
        snprintf(output, size, "Error: Failed to load file: %s", filepath);
        return kb;
    }
}

static void cmd_validate(k_kb_t* kb, char* output, size_t size) {
    if (!kb->chain) {
        snprintf(output, size, "Error: No blockchain present");
        return;
    }
    
    bool valid = kolibri_chain_validate(kb->chain);
    if (valid) {
        snprintf(output, size, 
                 "✓ Blockchain is VALID\n"
                 "  Blocks: %llu\n"
                 "  All hashes verified",
                 (unsigned long long)kb->chain->count);
    } else {
        snprintf(output, size, 
                 "✗ Blockchain is INVALID\n"
                 "  Chain has been tampered with!");
    }
}

static void cmd_export(k_kb_t* kb, const char* args, char* output, size_t size) {
    const char* filepath = args;
    
    /* Skip leading whitespace */
    while (filepath && *filepath == ' ') filepath++;
    
    if (filepath && *filepath) {
        /* Export to file */
        char* buffer = (char*)malloc(65536);
        if (!buffer) {
            snprintf(output, size, "Error: Out of memory");
            return;
        }
        
        int len = kolibri_export_dsl(kb, buffer, 65536);
        
        FILE* f = fopen(filepath, "w");
        if (f) {
            fwrite(buffer, 1, (size_t)len, f);
            fclose(f);
            snprintf(output, size, "Exported %d bytes to: %s", len, filepath);
        } else {
            snprintf(output, size, "Error: Could not open file: %s", filepath);
        }
        
        free(buffer);
    } else {
        /* Export to stdout */
        char* buffer = (char*)malloc(65536);
        if (!buffer) {
            snprintf(output, size, "Error: Out of memory");
            return;
        }
        
        kolibri_export_dsl(kb, buffer, 65536);
        printf("\n%s\n", buffer);
        snprintf(output, size, "Exported to console");
        
        free(buffer);
    }
}

static void cmd_query(k_kb_t* kb, const char* query, char* output, size_t size) {
    k_result_t result;
    kolibri_query(kb, query, &result);
    
    if (result.success) {
        snprintf(output, size, 
                 "\n>>> %s\n"
                 "(Confidence: %.2f, Formula: \"%s\")",
                 result.answer, result.confidence,
                 result.matched_formula ? result.matched_formula->pattern : "?");
    } else {
        snprintf(output, size, 
                 "\n>>> %s\n"
                 "(No matching formula found)",
                 result.answer);
    }
}

/* ============================================================================
 * Main Command Router
 * ============================================================================ */

k_error_t kolibri_cli_command(k_kb_t* kb, const char* command,
                               char* output, size_t output_size) {
    if (!kb || !command || !output) {
        return K_ERR_NULL_PTR;
    }
    
    output[0] = '\0';
    
    /* Skip leading whitespace */
    while (*command == ' ' || *command == '\t') command++;
    
    /* Empty command */
    if (*command == '\0') {
        return K_OK;
    }
    
    /* Check for commands */
    if (command[0] == '/') {
        command++;  /* Skip the slash */
        
        if (strncmp(command, "help", 4) == 0) {
            cmd_help(output, output_size);
        }
        else if (strncmp(command, "add ", 4) == 0) {
            cmd_add(kb, command + 4, output, output_size);
        }
        else if (strncmp(command, "list", 4) == 0) {
            cmd_list(kb, output, output_size);
        }
        else if (strncmp(command, "stats", 5) == 0) {
            cmd_stats(kb, output, output_size);
        }
        else if (strncmp(command, "save", 4) == 0) {
            cmd_save(kb, command + 4, output, output_size);
        }
        else if (strncmp(command, "load ", 5) == 0) {
            /* Note: load returns new KB, but we handle it in run loop */
            snprintf(output, output_size, "Use /load in interactive mode");
        }
        else if (strncmp(command, "validate", 8) == 0) {
            cmd_validate(kb, output, output_size);
        }
        else if (strncmp(command, "export", 6) == 0) {
            cmd_export(kb, command + 6, output, output_size);
        }
        else if (strncmp(command, "quit", 4) == 0 || 
                 strncmp(command, "exit", 4) == 0) {
            strncpy(output, "Goodbye!", output_size - 1);
            return K_ERR_NOT_FOUND;  /* Signal to exit */
        }
        else {
            snprintf(output, output_size, "Unknown command: /%s\nType /help for available commands.", command);
        }
    }
    else {
        /* Treat as query */
        cmd_query(kb, command, output, output_size);
    }
    
    return K_OK;
}

/* ============================================================================
 * Main REPL Loop
 * ============================================================================ */

int kolibri_cli_run(k_kb_t* initial_kb) {
    printf("\n");
    printf("╔══════════════════════════════════════════════════════════════╗\n");
    printf("║         Kolibri AI v%s - Knowledge Engine                ║\n", KOLIBRI_VERSION);
    printf("║         Type /help for commands, /quit to exit              ║\n");
    printf("╚══════════════════════════════════════════════════════════════╝\n");
    printf("\n");
    
    k_kb_t* kb = initial_kb;
    if (!kb) {
        kb = kolibri_kb_create("default");
        if (!kb) {
            fprintf(stderr, "Error: Failed to create knowledge base\n");
            return 1;
        }
    }
    
    char input[1024];
    char output[4096];
    
    while (1) {
        printf("\nkolibri> ");
        fflush(stdout);
        
        if (!fgets(input, sizeof(input), stdin)) {
            break;  /* EOF */
        }
        
        /* Remove trailing newline */
        size_t len = strlen(input);
        if (len > 0 && input[len-1] == '\n') {
            input[len-1] = '\0';
        }
        
        /* Skip empty input */
        if (input[0] == '\0') {
            continue;
        }
        
        /* Handle /load specially since it changes kb */
        if (strncmp(input, "/load ", 6) == 0) {
            kb = cmd_load(kb, input + 6, output, sizeof(output));
            printf("%s\n", output);
            continue;
        }
        
        /* Process command */
        k_error_t err = kolibri_cli_command(kb, input, output, sizeof(output));
        
        if (output[0]) {
            printf("%s\n", output);
        }
        
        if (err == K_ERR_NOT_FOUND && 
            (strncmp(input, "/quit", 5) == 0 || strncmp(input, "/exit", 5) == 0)) {
            break;
        }
    }
    
    /* Cleanup */
    if (!initial_kb) {
        kolibri_kb_destroy(kb);
    }
    
    return 0;
}
