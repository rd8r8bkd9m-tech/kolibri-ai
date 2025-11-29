# DSL Format Specification

## Overview

Kolibri uses a Domain-Specific Language (DSL) for representing knowledge formulas. Each formula defines a pattern-action pair that enables the system to match queries and generate responses.

## Basic Syntax

```
"PATTERN" -> "ACTION" | CONFIDENCE | "TAGS"
```

### Components

| Component   | Required | Description                                    |
|-------------|----------|------------------------------------------------|
| PATTERN     | Yes      | The input pattern to match                     |
| ACTION      | Yes      | The output template to generate                |
| CONFIDENCE  | No       | Float 0.0-1.0, default 0.9                    |
| TAGS        | No       | Comma-separated classification tags            |

## Patterns

### Literal Patterns

Exact text matching (case-insensitive):

```
"hello" -> "Hello! How can I help?"
"what is kolibri" -> "Kolibri is a knowledge engine"
```

### Variable Patterns

Use `{VAR}` to capture variable text:

```
"what is {X}" -> "Information about {X}"
"who is {PERSON}" -> "{PERSON} is someone"
"{A} plus {B}" -> "Sum of {A} and {B}"
```

Variable names:
- Can contain letters, numbers, underscores
- Case-sensitive in substitution
- Captured value includes all text until next literal

### Pattern Matching Rules

1. Patterns are matched case-insensitively
2. Whitespace is significant
3. Variables are greedy (capture until next literal or end)
4. Multiple variables are supported

## Actions

### Literal Actions

Static response text:

```
"hello" -> "Greetings!"
```

### Variable Substitution

Use captured variables in output:

```
"define {TERM}" -> "{TERM}: A concept requiring further exploration"
```

The `{TERM}` in the action is replaced with the matched value.

### Multi-Variable Actions

```
"{SUBJECT} is {PREDICATE}" -> "{SUBJECT} has property: {PREDICATE}"
```

## Confidence

Confidence score from 0.0 to 1.0:

```
"hello" -> "Hi there!" | 0.95
"maybe {X}" -> "Possibly {X}" | 0.5
```

When multiple patterns match, the highest confidence wins.

### Confidence Guidelines

| Range     | Meaning                          |
|-----------|----------------------------------|
| 0.9 - 1.0 | High confidence, exact knowledge |
| 0.7 - 0.9 | Good confidence, general rules   |
| 0.5 - 0.7 | Moderate, may need refinement    |
| 0.3 - 0.5 | Low, fallback patterns           |
| < 0.3     | Very uncertain                   |

## Tags

Comma-separated classification labels:

```
"what is math" -> "Mathematics is..." | 0.9 | "education,math,definition"
```

Tags are used for:
- Organization and filtering
- Analytics and statistics
- Category-based operations

## File Format

### Comments

Lines starting with `#` are comments:

```
# This is a comment
# Greetings section
"hello" -> "Hi!"
```

### Example File

```
# Kolibri Knowledge Base: Example
# Format: PATTERN -> ACTION | CONFIDENCE | TAGS

# Greetings
"hello" -> "Hello! How can I help?" | 0.95 | "greeting"
"hi" -> "Hi there!" | 0.95 | "greeting"

# Questions
"what is {X}" -> "{X} is a concept" | 0.7 | "question,definition"
"who is {X}" -> "{X} is someone" | 0.7 | "question,identity"

# Math
"what is pi" -> "Pi is approximately 3.14159" | 0.99 | "math,constant"
```

## API Functions

### Import DSL

```c
int kolibri_import_dsl(k_kb_t* kb, const char* dsl);
```

Returns the number of formulas imported.

### Export DSL

```c
int kolibri_export_dsl(const k_kb_t* kb, char* buffer, size_t size);
```

Returns the number of characters written.

## Best Practices

1. **Be Specific**: More specific patterns have higher confidence
2. **Use Variables Wisely**: Too many variables reduce precision
3. **Order Matters**: Check patterns match as expected
4. **Tag Consistently**: Use consistent tag naming conventions
5. **Test Iteratively**: Add formulas and test immediately

## Error Handling

Common parsing errors:
- Missing quotes around pattern or action
- Missing `->` separator
- Invalid confidence value (not 0.0-1.0)
- Unclosed variable braces `{X`

## Escape Sequences

Currently, the DSL does not support escape sequences. Avoid using:
- Double quotes inside patterns/actions
- Pipe characters in text
- Curly braces outside of variables
