# Mastra Agent Skills

Official Mastra skills for agents working with the [Mastra framework](https://mastra.ai). Mastra is a framework for building AI-powered applications and agents with a modern TypeScript stack.

## Installation

```bash
npx skills add mastra-ai/skills
```

Mastra also supports the [`.well-known` skills discovery standard](https://github.com/cloudflare/agent-skills-discovery-rfc):

```bash
npx skills add https://mastra.ai/
```

## Included skills

### mastra

Single comprehensive skill for all Mastra development. Uses progressive disclosure with reference files covering:

- **Setup & Installation** (`references/create-mastra.md`): CLI and manual project setup
- **Embedded Docs Lookup** (`references/embedded-docs.md`): Find APIs in `node_modules/@mastra/*/dist/docs/`
- **Remote Docs Lookup** (`references/remote-docs.md`): Fetch from `https://mastra.ai/llms.txt`
- **Troubleshooting** (`references/common-errors.md`): Common errors and solutions
- **Migrations** (`references/migration-guide.md`): Version upgrade workflows
- **Mastra API CLI** (`references/mastra-api.md`): Inspect and call resources on local, platform, or remote servers
- **Advanced Trace Queries** (`references/trace-query.md`): Select completed traces with recursive predicates and cursor pagination
- **Trace Intelligence** (`references/trace-intelligence.md`): Query recurring themes across agent traces on the Mastra platform

Main skill file teaches core concepts and routes to appropriate reference files based on user questions.

### mastra-factory

Standalone Factory supervisor skill for coding agents using `mastra api factory`. Covers first-use CLI/login checks and URL-based connection from any directory, project and queue summaries, work-item session/thread and memory inspection, health interpretation, and user-authorized operations.

- [Connection and installation](skills/mastra-factory/references/connection.md): connect to your own deployment without a repository or project link file; choose the correct agent and installation scope.
- [Session and memory inspection](skills/mastra-factory/references/session-inspection.md): find your work, inspect progress and OM evidence, and distinguish findings from repair authorization.
- [Supervisor commands](skills/mastra-factory/references/factory-supervisor.md): contracts, output control, and safe mutations.

Install just the Factory skill with interactive agent/scope selection:

```bash
npx skills add mastra-ai/skills --skill mastra-factory
```

For a global install, specify your supported agent explicitly (`--agent <agent> -g`). PromptScript does not support global installation; use project scope for that agent instead, and confirm the skill is linked (a copied-but-"not linked" result means it is not active yet). Multi-agent installs can partially succeed: verify the intended agent with `npx skills list` (add `-g` for global scope) and confirm its skill references are present.

## Manual installation

```bash
git clone https://github.com/mastra-ai/skills.git
```

Then configure your agent to load skills from the cloned directory.

## `.well-known` skills discovery

This repository is served via the [RFC 8615 Well-Known URI](https://github.com/cloudflare/agent-skills-discovery-rfc) at `https://mastra.ai/.well-known/skills/`.

Agents can discover available skills by fetching:

- **Index**: `https://mastra.ai/.well-known/skills/index.json`
- **Mastra skill**: `https://mastra.ai/.well-known/skills/mastra/SKILL.md`
- **Factory skill**: `https://mastra.ai/.well-known/skills/mastra-factory/SKILL.md`

This enables automatic skill discovery without manual configuration.

## Contributing

Contributions welcome!

1. Fork the repository
2. Make improvements to `SKILL.md` files
3. Test with actual development workflows
4. Submit a pull request

## Resources

- [Mastra Docs](https://mastra.ai/docs)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [Agent Skills Spec](https://agentskills.io)
- [`.well-known` Skills RFC](https://github.com/cloudflare/agent-skills-discovery-rfc)
- [Discord](https://discord.gg/BTYqqHKUrf)

## License

Apache-2.0 - See [LICENSE](LICENSE) for details
