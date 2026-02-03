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

Main skill file teaches core concepts and routes to appropriate reference files based on user questions.

## Manual installation

```bash
git clone https://github.com/mastra-ai/skills.git
```

Then configure your agent to load skills from the cloned directory.

## `.well-known` skills discovery

This repository is served via the [RFC 8615 Well-Known URI](https://github.com/cloudflare/agent-skills-discovery-rfc) at `https://mastra.ai/.well-known/skills/`.

Agents can discover available skills by fetching:

- **Index**: `https://mastra.ai/.well-known/skills/index.json`
- **Skills**: `https://mastra.ai/.well-known/skills/mastra/SKILL.md`

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
