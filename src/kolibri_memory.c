/**
 * @file kolibri_memory.c
 * @brief Kolibri AI Fractal Memory Tree Implementation
 * 
 * Implements the hierarchical memory structure using a tree with 10 children
 * per node (digits 0-9).
 */

#include "kolibri.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================================
 * Node Creation and Destruction
 * ============================================================================ */

k_node_t* kolibri_node_create(k_entity_type_t type, const char* name, 
                               const char* value) {
    k_node_t* node = (k_node_t*)calloc(1, sizeof(k_node_t));
    if (!node) return NULL;
    
    node->type = type;
    if (name) {
        strncpy(node->name, name, sizeof(node->name) - 1);
    }
    if (value) {
        strncpy(node->value, value, sizeof(node->value) - 1);
    }
    node->created_at = time(NULL);
    
    /* Initialize children to NULL */
    for (int i = 0; i < KOLIBRI_MAX_CHILDREN; i++) {
        node->children[i] = NULL;
    }
    node->parent = NULL;
    node->formula = NULL;
    
    return node;
}

void kolibri_node_destroy(k_node_t* node) {
    if (!node) return;
    
    /* Recursively destroy children */
    for (int i = 0; i < KOLIBRI_MAX_CHILDREN; i++) {
        if (node->children[i]) {
            kolibri_node_destroy(node->children[i]);
        }
    }
    
    free(node);
}

/* ============================================================================
 * Tree Operations
 * ============================================================================ */

k_error_t kolibri_node_add_child(k_node_t* parent, k_node_t* child, 
                                  uint8_t digit) {
    if (!parent || !child) {
        return K_ERR_NULL_PTR;
    }
    
    if (digit >= KOLIBRI_MAX_CHILDREN) {
        return K_ERR_INVALID_ARG;
    }
    
    if (parent->children[digit]) {
        /* Child already exists at this position */
        return K_ERR_FULL;
    }
    
    /* Set up parent-child relationship */
    parent->children[digit] = child;
    child->parent = parent;
    
    /* Update child address */
    if (parent->address.depth < KOLIBRI_MAX_DEPTH) {
        memcpy(&child->address, &parent->address, sizeof(k_address_t));
        child->address.digits[child->address.depth] = digit;
        child->address.depth++;
    }
    
    return K_OK;
}

k_node_t* kolibri_node_find(k_node_t* root, const k_address_t* address) {
    if (!root || !address) return NULL;
    
    k_node_t* current = root;
    
    for (uint8_t i = 0; i < address->depth; i++) {
        uint8_t digit = address->digits[i];
        if (digit >= KOLIBRI_MAX_CHILDREN) {
            return NULL;
        }
        
        current = current->children[digit];
        if (!current) {
            return NULL;
        }
    }
    
    return current;
}

/* ============================================================================
 * Address Parsing and Formatting
 * ============================================================================ */

k_error_t kolibri_address_parse(const char* str, k_address_t* address) {
    if (!str || !address) {
        return K_ERR_NULL_PTR;
    }
    
    memset(address, 0, sizeof(k_address_t));
    
    const char* p = str;
    while (*p && address->depth < KOLIBRI_MAX_DEPTH) {
        if (*p >= '0' && *p <= '9') {
            address->digits[address->depth++] = (uint8_t)(*p - '0');
        } else if (*p != '.') {
            return K_ERR_PARSE;
        }
        p++;
    }
    
    return K_OK;
}

int kolibri_address_format(const k_address_t* address, char* buffer, size_t size) {
    if (!address || !buffer || size == 0) return 0;
    
    if (address->depth == 0) {
        buffer[0] = '\0';
        return 0;
    }
    
    int written = 0;
    for (uint8_t i = 0; i < address->depth && (size_t)written + 2 < size; i++) {
        if (i > 0) {
            buffer[written++] = '.';
        }
        buffer[written++] = '0' + address->digits[i];
    }
    buffer[written] = '\0';
    
    return written;
}

/* ============================================================================
 * Tree Utilities
 * ============================================================================ */

uint32_t kolibri_node_count(const k_node_t* root) {
    if (!root) return 0;
    
    uint32_t count = 1;  /* Count this node */
    
    for (int i = 0; i < KOLIBRI_MAX_CHILDREN; i++) {
        if (root->children[i]) {
            count += kolibri_node_count(root->children[i]);
        }
    }
    
    return count;
}

/* ============================================================================
 * Node Search and Navigation
 * ============================================================================ */

/**
 * @brief Find a node by name (depth-first search)
 */
k_node_t* kolibri_node_find_by_name(k_node_t* root, const char* name) {
    if (!root || !name) return NULL;
    
    if (strcmp(root->name, name) == 0) {
        return root;
    }
    
    for (int i = 0; i < KOLIBRI_MAX_CHILDREN; i++) {
        if (root->children[i]) {
            k_node_t* found = kolibri_node_find_by_name(root->children[i], name);
            if (found) return found;
        }
    }
    
    return NULL;
}

/**
 * @brief Get the path from root to a node
 */
int kolibri_node_get_path(const k_node_t* node, k_node_t** path, int max_path) {
    if (!node || !path || max_path <= 0) return 0;
    
    /* Count depth first */
    int depth = 0;
    const k_node_t* current = node;
    while (current && depth < max_path) {
        depth++;
        current = current->parent;
    }
    
    /* Fill path array from root */
    current = node;
    for (int i = depth - 1; i >= 0 && current; i--) {
        path[i] = (k_node_t*)current;
        current = current->parent;
    }
    
    return depth;
}

/**
 * @brief Print tree structure (for debugging)
 */
void kolibri_node_print(const k_node_t* node, int indent) {
    if (!node) return;
    
    char addr_buf[64];
    kolibri_address_format(&node->address, addr_buf, sizeof(addr_buf));
    
    for (int i = 0; i < indent; i++) printf("  ");
    printf("[%s] %s: %s\n", 
           addr_buf[0] ? addr_buf : "root",
           node->name, 
           node->value);
    
    for (int i = 0; i < KOLIBRI_MAX_CHILDREN; i++) {
        if (node->children[i]) {
            kolibri_node_print(node->children[i], indent + 1);
        }
    }
}

/**
 * @brief Create a node and insert at given path
 */
k_node_t* kolibri_node_insert_at_path(k_node_t* root, const char* path_str,
                                       k_entity_type_t type, const char* name,
                                       const char* value) {
    if (!root || !path_str) return NULL;
    
    k_address_t address;
    if (kolibri_address_parse(path_str, &address) != K_OK) {
        return NULL;
    }
    
    /* Navigate to parent, creating nodes as needed */
    k_node_t* current = root;
    for (uint8_t i = 0; i < address.depth - 1; i++) {
        uint8_t digit = address.digits[i];
        if (!current->children[digit]) {
            /* Create intermediate node */
            char node_name[32];
            snprintf(node_name, sizeof(node_name), "node_%d", (int)digit);
            current->children[digit] = kolibri_node_create(K_TYPE_ROOT, node_name, "");
            if (!current->children[digit]) return NULL;
            current->children[digit]->parent = current;
        }
        current = current->children[digit];
    }
    
    /* Create the target node */
    uint8_t final_digit = address.digits[address.depth - 1];
    if (current->children[final_digit]) {
        /* Node already exists */
        return current->children[final_digit];
    }
    
    k_node_t* new_node = kolibri_node_create(type, name, value);
    if (!new_node) return NULL;
    
    kolibri_node_add_child(current, new_node, final_digit);
    return new_node;
}
