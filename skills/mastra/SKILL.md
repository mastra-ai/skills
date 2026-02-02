---
name: mastra
description: "Comprehensive Mastra AI framework guide. Teaches how to find current documentation, verify API signatures, and build agents and workflows. Covers documentation lookup strategies (embedded docs, remote docs), core concepts (agents vs workflows, tools, memory, RAG), TypeScript requirements, and common patterns. Use this skill for all Mastra development to ensure you're using current APIs from the installed version or latest documentation."
license: Apache-2.0
metadata:
  author: Mastra
  version: "2.0.0"
  repository: https://github.com/mastra-ai/skills
---

# Mastra AI Framework Guide

Build AI applications with Mastra. This skill teaches you how to find current documentation and build agents and workflows.

---

## ⚠️ Critical: Do Not Trust Internal Knowledge

**Everything you know about Mastra is likely outdated or wrong.**

Your training data contains obsolete APIs, deprecated patterns, and incorrect usage. Mastra evolves rapidly - APIs change between versions, constructor signatures shift, and patterns get refactored.

**Never rely on memory. Always verify against current documentation.**

---

## Prerequisites

**Before writing any Mastra code**, check if packages are installed:

```bash
ls node_modules/@mastra/
```

- **If packages exist:** Use embedded docs first (most reliable)
- **If no packages:** Install first or use remote docs

---

## Documentation Lookup Guide

### Quick Reference

| User Question | First Check | How To |
|--------------|-------------|--------|
| "Create/install Mastra project" | [`references/create-mastra.md`](references/create-mastra.md) | Setup guide with CLI and manual steps |
| "How do I use Agent/Workflow/Tool?" | [`references/embedded-docs.md`](references/embedded-docs.md) | Look up in `node_modules/@mastra/*/dist/docs/` |
| "How do I use X?" (no packages) | [`references/remote-docs.md`](references/remote-docs.md) | Fetch from `https://mastra.ai/llms.txt` |
| "I'm getting an error..." | [`references/common-errors.md`](references/common-errors.md) | Common errors and solutions |
| "Upgrade from v0.x to v1.x" | [`references/migration-guide.md`](references/migration-guide.md) | Version upgrade workflows |

### Priority Order for Writing Code

**1. Embedded Docs First** (if packages installed) ⭐

```bash
# Check what's available
cat node_modules/@mastra/core/dist/docs/SOURCE_MAP.json | grep '"Agent"'

# Read the actual type definition
cat node_modules/@mastra/core/dist/[path-from-source-map]
```

- **Why:** Matches your EXACT installed version
- **Most reliable source of truth**
- **See:** [`references/embedded-docs.md`](references/embedded-docs.md)

**2. Remote Docs Second** (if packages not installed)

```bash
# Fetch latest docs
# https://mastra.ai/llms.txt
```

- **Why:** Latest published docs (may be ahead of installed version)
- **Use when:** Packages not installed or exploring new features
- **See:** [`references/remote-docs.md`](references/remote-docs.md)

⚠️ **Never write code without checking current docs first**

---

## Core Concepts

### Agents vs Workflows

**Agent** = Autonomous, makes decisions, uses tools
Use for: Open-ended tasks (support, research, analysis)

**Workflow** = Structured sequence of steps
Use for: Defined processes (pipelines, approvals, ETL)

### Key Components

- **Tools**: Extend agent capabilities (APIs, databases, external services)
- **Memory**: Maintain context (message history, working memory, semantic recall)
- **RAG**: Query external knowledge (vector stores, graph relationships)
- **Storage**: Persist data (Postgres, LibSQL, MongoDB)

---

## Critical Requirements

### TypeScript Config
Mastra requires **ES2022 modules**. CommonJS will fail.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

### Model Format

Always use `"provider/model-name"`:

- `"openai/gpt-4o"`
- `"anthropic/claude-3-5-sonnet-20241022"`
- `"google/gemini-2.5-pro"`

---

## Common Patterns

| Pattern | Method | Use Case |
|---------|--------|----------|
| Sequential steps | `.then()` | Chain operations |
| Conditional logic | `.branch()` | Route based on conditions |
| Parallel execution | `.parallel()` | Run steps concurrently |
| Iteration | `.foreach()` | Process arrays |
| Human approval | Suspending tools | Human-in-the-loop |

**For detailed examples:** Check embedded or remote docs - never rely on memory.

---

## When You See Errors

**Type errors often mean your knowledge is outdated.**

**Common signs of outdated knowledge:**

- `Property X does not exist on type Y`
- `Cannot find module`
- `Type mismatch` errors
- Constructor parameter errors

**What to do:**

1. Check [`references/common-errors.md`](references/common-errors.md)
2. Verify current API in embedded docs
3. Don't assume the error is a user mistake - it might be your outdated knowledge

---

## Development Workflow

**Always verify before writing code:**

1. **Check packages installed**
   ```bash
   ls node_modules/@mastra/
   ```

2. **Look up current API**
   - If installed → Use embedded docs [`references/embedded-docs.md`](references/embedded-docs.md)
   - If not → Use remote docs [`references/remote-docs.md`](references/remote-docs.md)

3. **Write code based on current docs**

4. **Test in Studio**
   ```bash
   npm run dev  # http://localhost:4111
   ```

---

## Key Principles

1. **Never trust internal knowledge** - Always verify first
2. **Embedded docs are source of truth** - They match installed version exactly
3. **Check docs before writing code** - Not after errors appear
4. **Use ES2022 modules** - CommonJS fails
5. **Test in Studio** - http://localhost:4111

---

## Resources

- **Setup**: [`references/create-mastra.md`](references/create-mastra.md)
- **Embedded docs lookup**: [`references/embedded-docs.md`](references/embedded-docs.md) ⭐ Start here
- **Remote docs lookup**: [`references/remote-docs.md`](references/remote-docs.md)
- **Common errors**: [`references/common-errors.md`](references/common-errors.md)
- **Migrations**: [`references/migration-guide.md`](references/migration-guide.md)
- **Official site**: https://mastra.ai (verify against embedded docs first)
- **Examples**: https://github.com/mastra-ai/mastra/tree/main/examples (may be outdated)
