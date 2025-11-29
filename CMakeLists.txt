# CMakeLists.txt - Kolibri AI Build Configuration
#
# Build Instructions:
#   mkdir build && cd build
#   cmake ..
#   cmake --build .
#
# Options:
#   -DBUILD_TESTS=ON      Build test suite
#   -DBUILD_WASM=ON       Build WebAssembly target (requires Emscripten)

cmake_minimum_required(VERSION 3.10)

project(kolibri-ai
    VERSION 1.0.0
    DESCRIPTION "Kolibri AI - Compact Decentralized Knowledge Engine"
    LANGUAGES C
)

# C11 standard required
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS OFF)

# Options
option(BUILD_TESTS "Build test suite" ON)
option(BUILD_WASM "Build WebAssembly target" OFF)

# Compiler warnings
if(CMAKE_C_COMPILER_ID MATCHES "GNU|Clang")
    add_compile_options(-Wall -Wextra -Wpedantic)
    if(CMAKE_BUILD_TYPE STREQUAL "Debug")
        add_compile_options(-g -O0)
    else()
        add_compile_options(-O2)
    endif()
elseif(MSVC)
    add_compile_options(/W4)
endif()

# Source files
set(KOLIBRI_SOURCES
    src/kolibri_core.c
    src/kolibri_memory.c
    src/kolibri_blockchain.c
    src/kolibri_storage.c
    src/kolibri_cli.c
)

set(KOLIBRI_HEADERS
    src/kolibri.h
)

# Static library
add_library(kolibri_lib STATIC ${KOLIBRI_SOURCES} ${KOLIBRI_HEADERS})
target_include_directories(kolibri_lib PUBLIC src)

# Main executable
add_executable(kolibri src/main.c)
target_link_libraries(kolibri PRIVATE kolibri_lib)

# Install targets
install(TARGETS kolibri kolibri_lib
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)
install(FILES ${KOLIBRI_HEADERS} DESTINATION include)

# Tests
if(BUILD_TESTS)
    enable_testing()
    
    # Test core
    add_executable(test_core tests/test_core.c)
    target_link_libraries(test_core PRIVATE kolibri_lib)
    add_test(NAME test_core COMMAND test_core)
    
    # Test blockchain
    add_executable(test_blockchain tests/test_blockchain.c)
    target_link_libraries(test_blockchain PRIVATE kolibri_lib)
    add_test(NAME test_blockchain COMMAND test_blockchain)
    
    # Test formulas
    add_executable(test_formulas tests/test_formulas.c)
    target_link_libraries(test_formulas PRIVATE kolibri_lib)
    add_test(NAME test_formulas COMMAND test_formulas)
endif()

# WebAssembly build (if Emscripten is available)
if(BUILD_WASM AND EMSCRIPTEN)
    set(CMAKE_EXECUTABLE_SUFFIX ".js")
    add_executable(kolibri_wasm ${KOLIBRI_SOURCES})
    target_include_directories(kolibri_wasm PUBLIC src)
    set_target_properties(kolibri_wasm PROPERTIES
        LINK_FLAGS "-s WASM=1 -s EXPORTED_FUNCTIONS=['_kolibri_init','_kolibri_shutdown','_kolibri_kb_create','_kolibri_add_formula','_kolibri_query'] -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap']"
    )
endif()

# Print configuration summary
message(STATUS "")
message(STATUS "Kolibri AI v${PROJECT_VERSION}")
message(STATUS "─────────────────────────────")
message(STATUS "  C Standard:     C${CMAKE_C_STANDARD}")
message(STATUS "  Build Type:     ${CMAKE_BUILD_TYPE}")
message(STATUS "  Build Tests:    ${BUILD_TESTS}")
message(STATUS "  Build WASM:     ${BUILD_WASM}")
message(STATUS "")
