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

**Official docs: [mastra.ai](https://mastra.ai)**

---

## Quick Reference

| User asks about... | Use this reference |
|-------------------|-------------------|
| Creating/installing/setup | [`references/create-mastra.md`](references/create-mastra.md) |
| API usage (packages installed) | [`references/embedded-docs.md`](references/embedded-docs.md) |
| API usage (no packages) | [`references/remote-docs.md`](references/remote-docs.md) |
| Errors or issues | [`references/common-errors.md`](references/common-errors.md) |
| Version migration | [`references/migration-guide.md`](references/migration-guide.md) |

---

## Documentation Lookup Strategy

### Project Setup
**For installation, setup, or "create a Mastra project" questions:**
→ [`references/create-mastra.md`](references/create-mastra.md)

### Writing Code
**For API signatures and usage:**

1. **Embedded docs first** (if packages installed)
   → [`references/embedded-docs.md`](references/embedded-docs.md)
   Location: `node_modules/@mastra/*/dist/docs/`
   Best for: Exact API signatures matching your installed version

2. **Remote docs second** (if needed)
   → [`references/remote-docs.md`](references/remote-docs.md)
   Location: `https://mastra.ai/llms.txt`
   Best for: Guides, concepts, latest features

### Troubleshooting
- **Errors**: [`references/common-errors.md`](references/common-errors.md)
- **Migrations**: [`references/migration-guide.md`](references/migration-guide.md)

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
Use `"provider/model-name"`:
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

**For detailed examples:** Check embedded or remote docs.

---

## Workflow

1. **Setup project** → [`references/create-mastra.md`](references/create-mastra.md)
2. **Look up APIs** → [`references/embedded-docs.md`](references/embedded-docs.md) or [`references/remote-docs.md`](references/remote-docs.md)
3. **Build components** → Use docs to get current API signatures
4. **Test in Studio** → `npm run dev` at http://localhost:4111
5. **Troubleshoot** → [`references/common-errors.md`](references/common-errors.md)

---

## Key Principles

1. **Always verify against current docs** - APIs evolve rapidly
2. **Check embedded docs first** - Match your installed version
3. **Use ES2022 modules** - CommonJS fails
4. **Test in Studio** - http://localhost:4111
5. **Minimal configuration** - Only specify non-defaults

---

## Resources

- **Setup**: [`references/create-mastra.md`](references/create-mastra.md)
- **Embedded docs**: [`references/embedded-docs.md`](references/embedded-docs.md)
- **Remote docs**: [`references/remote-docs.md`](references/remote-docs.md)
- **Errors**: [`references/common-errors.md`](references/common-errors.md)
- **Migration**: [`references/migration-guide.md`](references/migration-guide.md)
- **Official site**: https://mastra.ai
- **Examples**: https://github.com/mastra-ai/mastra/tree/main/examples
