# AGENTS.md

This file provides context for AI coding assistants (Cursor, GitHub Copilot, Claude Code, etc.) working with the Mastra Agent Skills repository.

## Project Overview

The **Mastra Agent Skills** repository provides official agent skills for coding agents working with the [Mastra AI framework](https://mastra.ai). These skills enable AI assistants to write accurate Mastra code with production-ready patterns validated against the current codebase.

- **Repository**: https://github.com/mastra-ai/skills
- **Mastra Framework**: https://github.com/mastra-ai/mastra
- **Documentation**: https://mastra.ai/docs
- **License**: Apache-2.0

## Repository Structure

### Key Directories

| Directory                 | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `skills/`                 | Agent skill definitions                                        |
| `skills/mastra/`          | Comprehensive Mastra development guide (27+ code patterns)     |
| `skills/create-mastra/`   | Project initialization and setup guide                         |
| `skills/mastra-embedded-docs-look-up/` | API documentation lookup from installed packages  |

## Installation

Users can install these skills in their coding agent using:

```bash
npx skills add mastra-ai/skills
```

## Included Skills

### 📚 mastra-embedded-docs-look-up

Look up Mastra API signatures from embedded documentation in `node_modules/@mastra/*/dist/docs/`. Ensures documentation matches the installed version.

**When to use**: Verifying current API signatures before writing code.

### ✨ mastra

Comprehensive guide for building AI applications with Mastra. Includes 27+ production-ready code patterns for agents, workflows, memory, tools, storage, and RAG. Covers troubleshooting, v1 migration, and best practices.

**When to use**: Writing Mastra code (agents, workflows, memory systems, tools, storage configurations, RAG implementations).

**Key patterns covered**:
- **Workflows**: Sequential steps, branching, parallel execution, foreach loops, suspend/resume, state management
- **Agents**: Basic agents, agents with tools, agents with memory, semantic recall, structured output
- **Memory**: Message history, working memory, semantic recall
- **Tools**: Basic tools, context-aware tools, suspending tools
- **Storage**: Postgres, LibSQL, agent-specific storage
- **RAG**: Vector query tools, Graph RAG

### 🚀 create-mastra

Setup guide for new or existing projects. Includes installation, configuration, framework integration, and troubleshooting.

**When to use**: Initializing new Mastra projects or integrating Mastra into existing applications.

## Skill File Structure

Each skill follows this structure:

```
skills/<skill-name>/
├── SKILL.md                    # Main skill content (frontmatter + guide)
├── references/                 # Deep-dive pattern documentation
│   ├── patterns/
│   │   └── *.md
│   ├── common-errors.md
│   └── migration-guide.md
└── assets/                     # Reference architectures (optional)
```

### SKILL.md Format

```markdown
---
name: skill-name
description: [What it provides]. Use when [use cases].
license: Apache-2.0
metadata:
  author: Mastra
  version: "1.0.0"
  repository: https://github.com/mastra-ai/skills
---

# Skill Name

[Main content with code patterns, examples, and guidance]
```

## Development Guidelines

### Adding New Skills

1. Create directory in `skills/`
2. Add `SKILL.md` with proper frontmatter
3. Include production-ready code patterns
4. Add reference documentation in `references/` if needed
5. Test patterns against current Mastra codebase
6. Update root `README.md`

### Updating Existing Skills

1. **Validate against current code**: Always verify patterns against the latest Mastra source code
2. **Use embedded docs**: Check `node_modules/@mastra/*/dist/docs/` for current APIs
3. **Test patterns**: Ensure all code examples are runnable
4. **Update references**: Keep migration guides and troubleshooting current
5. **Version alignment**: Note which Mastra versions the patterns support

### Code Pattern Requirements

- **Completeness**: Patterns should be copy-paste ready
- **Validation**: All APIs must be verified against current Mastra codebase
- **TODO placeholders**: Use `// TODO:` for user customization points
- **Imports**: Include all necessary import statements
- **Comments**: Explain non-obvious concepts, not syntax
- **No marketing language**: Technical documentation only

## Contributing

Contributions welcome!

1. Fork the repository
2. Make improvements to SKILL.md files
3. Validate patterns against current Mastra codebase
4. Test with actual development workflows
5. Submit a pull request

## Critical Knowledge

### API Freshness

Mastra APIs evolve rapidly. Skills should always direct users to:

1. **Use `mastra-embedded-docs-look-up` skill** for current API signatures
2. **Check `node_modules/@mastra/*/dist/docs/`** for package-specific documentation
3. **Search source code**: `node_modules/@mastra/*/src/`
4. **Fallback to docs**: [mastra.ai/docs](https://mastra.ai/docs)

### Common Patterns

- **ES2022 required**: Mastra requires `"target": "ES2022"` in tsconfig.json (not CommonJS)
- **Model format**: Always use `provider/model` (e.g., `openai/gpt-4o`)
- **Environment variables**: Load with `dotenv/config` or native `.env` support
- **Getter methods**: Use `mastra.getAgent('name')` not direct property access

## Resources

- [Mastra Docs](https://mastra.ai/docs)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [Agent Skills Spec](https://agentskills.io)
- [Discord](https://discord.gg/BTYqqHKUrf)

## License

Apache-2.0 - See [LICENSE](LICENSE) for details
