/**
 * @file main.c
 * @brief Kolibri AI Main Entry Point
 * 
 * Entry point for the Kolibri AI CLI application.
 */

#include "kolibri.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void print_usage(const char* program) {
    printf("\nUsage: %s [options] [kb_file]\n\n", program);
    printf("Options:\n");
    printf("  -h, --help       Show this help message\n");
    printf("  -v, --version    Show version information\n");
    printf("  -i, --import     Import DSL file and start REPL\n");
    printf("  -q, --query      Run single query and exit\n");
    printf("\n");
    printf("Examples:\n");
    printf("  %s                           Start interactive REPL\n", program);
    printf("  %s knowledge.kolibri         Load KB and start REPL\n", program);
    printf("  %s -q \"what is AI\"           Query and exit\n", program);
    printf("\n");
}

static void print_version(void) {
    printf("\nKolibri AI v%s\n", kolibri_version());
    printf("Compact Decentralized Knowledge Engine\n");
    printf("https://github.com/rd8r8bkd9m-tech/kolibri-ai\n\n");
}

int main(int argc, char* argv[]) {
    k_error_t err;
    k_kb_t* kb = NULL;
    const char* kb_file = NULL;
    const char* query = NULL;
    const char* import_file = NULL;
    int i;
    
    /* Initialize engine */
    err = kolibri_init();
    if (err != K_OK) {
        fprintf(stderr, "Error: Failed to initialize Kolibri engine: %s\n",
                kolibri_error_str(err));
        return 1;
    }
    
    /* Parse arguments */
    for (i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_usage(argv[0]);
            kolibri_shutdown();
            return 0;
        }
        else if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--version") == 0) {
            print_version();
            kolibri_shutdown();
            return 0;
        }
        else if (strcmp(argv[i], "-q") == 0 || strcmp(argv[i], "--query") == 0) {
            if (i + 1 < argc) {
                query = argv[++i];
            } else {
                fprintf(stderr, "Error: -q requires a query argument\n");
                kolibri_shutdown();
                return 1;
            }
        }
        else if (strcmp(argv[i], "-i") == 0 || strcmp(argv[i], "--import") == 0) {
            if (i + 1 < argc) {
                import_file = argv[++i];
            } else {
                fprintf(stderr, "Error: -i requires a file argument\n");
                kolibri_shutdown();
                return 1;
            }
        }
        else if (argv[i][0] != '-') {
            kb_file = argv[i];
        }
        else {
            fprintf(stderr, "Error: Unknown option: %s\n", argv[i]);
            print_usage(argv[0]);
            kolibri_shutdown();
            return 1;
        }
    }
    
    /* Load or create knowledge base */
    if (kb_file) {
        kb = kolibri_load(kb_file);
        if (!kb) {
            fprintf(stderr, "Warning: Could not load '%s', creating new KB\n", kb_file);
            kb = kolibri_kb_create("default");
        } else {
            printf("Loaded: %s (%u formulas)\n", kb_file, kb->formula_count);
        }
    } else {
        kb = kolibri_kb_create("default");
    }
    
    if (!kb) {
        fprintf(stderr, "Error: Failed to create knowledge base\n");
        kolibri_shutdown();
        return 1;
    }
    
    /* Import DSL file if specified */
    if (import_file) {
        FILE* f = fopen(import_file, "r");
        if (f) {
            fseek(f, 0, SEEK_END);
            long size = ftell(f);
            fseek(f, 0, SEEK_SET);
            
            char* dsl = (char*)malloc((size_t)size + 1);
            if (dsl) {
                size_t read_size = fread(dsl, 1, (size_t)size, f);
                dsl[read_size] = '\0';
                
                int count = kolibri_import_dsl(kb, dsl);
                printf("Imported %d formulas from: %s\n", count, import_file);
                
                free(dsl);
            }
            fclose(f);
        } else {
            fprintf(stderr, "Error: Could not open import file: %s\n", import_file);
        }
    }
    
    /* Single query mode */
    if (query) {
        k_result_t result;
        kolibri_query(kb, query, &result);
        
        if (result.success) {
            printf("%s\n", result.answer);
            printf("(Confidence: %.2f)\n", result.confidence);
        } else {
            printf("%s\n", result.answer);
        }
        
        kolibri_kb_destroy(kb);
        kolibri_shutdown();
        return result.success ? 0 : 1;
    }
    
    /* Interactive REPL mode */
    int exit_code = kolibri_cli_run(kb);
    
    /* Cleanup */
    kolibri_kb_destroy(kb);
    kolibri_shutdown();
    
    return exit_code;
}
