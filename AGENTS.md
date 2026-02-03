# AGENTS.md

This file provides context for AI coding assistants (Cursor, GitHub Copilot, Claude Code, etc.) working with the Mastra Agent Skills repository.

## Project Overview

The **Mastra Agent Skills** repository provides official agent skills for coding agents working with the [Mastra framework](https://mastra.ai). These skills enable AI assistants to write accurate Mastra code with production-ready patterns validated against the current codebase.

- **Repository**: https://github.com/mastra-ai/skills
- **Mastra Framework**: https://github.com/mastra-ai/mastra
- **Documentation**: https://mastra.ai/docs
- **License**: Apache-2.0

## Repository Structure

| Directory        | Description                                                   |
| ---------------- | ------------------------------------------------------------- |
| `skills/`        | Agent skill definitions                                       |
| `skills/mastra/` | Single comprehensive Mastra skill with progressive disclosure |

## Specification

Fetch the up-to-date [Agent Skills Specification](https://agentskills.io/specification.md) for details on skill structure, frontmatter fields, and best practices.

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
