# Kolibri AI - Simple Makefile
#
# Usage:
#   make          - Build the kolibri executable
#   make test     - Build and run tests
#   make clean    - Remove build artifacts
#   make install  - Install to /usr/local/bin

CC ?= gcc
CFLAGS = -std=c11 -Wall -Wextra -Wpedantic -O2
DEBUG_CFLAGS = -std=c11 -Wall -Wextra -Wpedantic -g -O0

# Source files
SRC_DIR = src
TEST_DIR = tests
BUILD_DIR = build

SOURCES = $(SRC_DIR)/kolibri_core.c \
          $(SRC_DIR)/kolibri_memory.c \
          $(SRC_DIR)/kolibri_blockchain.c \
          $(SRC_DIR)/kolibri_storage.c \
          $(SRC_DIR)/kolibri_cli.c

MAIN_SRC = $(SRC_DIR)/main.c
HEADERS = $(SRC_DIR)/kolibri.h

# Object files
OBJECTS = $(patsubst $(SRC_DIR)/%.c,$(BUILD_DIR)/%.o,$(SOURCES))
MAIN_OBJ = $(BUILD_DIR)/main.o

# Targets
TARGET = $(BUILD_DIR)/kolibri

# Default target
all: $(BUILD_DIR) $(TARGET)

# Create build directory
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# Compile object files
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

# Link main executable
$(TARGET): $(OBJECTS) $(MAIN_OBJ)
	$(CC) $(CFLAGS) $^ -o $@

# Debug build
debug: CFLAGS = $(DEBUG_CFLAGS)
debug: clean all

# Tests
TEST_CORE = $(BUILD_DIR)/test_core
TEST_BLOCKCHAIN = $(BUILD_DIR)/test_blockchain
TEST_FORMULAS = $(BUILD_DIR)/test_formulas

$(BUILD_DIR)/test_core.o: $(TEST_DIR)/test_core.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD_DIR)/test_blockchain.o: $(TEST_DIR)/test_blockchain.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD_DIR)/test_formulas.o: $(TEST_DIR)/test_formulas.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(TEST_CORE): $(BUILD_DIR) $(OBJECTS) $(BUILD_DIR)/test_core.o
	$(CC) $(CFLAGS) $(OBJECTS) $(BUILD_DIR)/test_core.o -o $@

$(TEST_BLOCKCHAIN): $(BUILD_DIR) $(OBJECTS) $(BUILD_DIR)/test_blockchain.o
	$(CC) $(CFLAGS) $(OBJECTS) $(BUILD_DIR)/test_blockchain.o -o $@

$(TEST_FORMULAS): $(BUILD_DIR) $(OBJECTS) $(BUILD_DIR)/test_formulas.o
	$(CC) $(CFLAGS) $(OBJECTS) $(BUILD_DIR)/test_formulas.o -o $@

test: $(TEST_CORE) $(TEST_BLOCKCHAIN) $(TEST_FORMULAS)
	@echo ""
	@echo "Running tests..."
	@echo "================"
	$(TEST_CORE)
	$(TEST_BLOCKCHAIN)
	$(TEST_FORMULAS)
	@echo ""
	@echo "All tests passed!"

# Clean
clean:
	rm -rf $(BUILD_DIR)

# Install
PREFIX ?= /usr/local
install: $(TARGET)
	install -d $(PREFIX)/bin
	install -m 755 $(TARGET) $(PREFIX)/bin/kolibri

# Uninstall
uninstall:
	rm -f $(PREFIX)/bin/kolibri

# Help
help:
	@echo "Kolibri AI - Build System"
	@echo ""
	@echo "Targets:"
	@echo "  make          - Build the kolibri executable"
	@echo "  make debug    - Build with debug symbols"
	@echo "  make test     - Build and run all tests"
	@echo "  make clean    - Remove build artifacts"
	@echo "  make install  - Install to $(PREFIX)/bin"
	@echo "  make help     - Show this help"

.PHONY: all debug test clean install uninstall help
