# Mastra Agent Skills

Official agent skills for coding agents working with the [Mastra AI framework](https://mastra.ai).

## Installation

```bash
npx skills add mastra-ai/skills
```

## Included Skills

### ✨ mastra

**Single comprehensive skill for all Mastra development.**

Uses progressive disclosure with reference files covering:
- **Setup & Installation** (`references/create-mastra.md`) - CLI and manual project setup
- **Embedded Docs Lookup** (`references/embedded-docs.md`) - Find APIs in `node_modules/@mastra/*/dist/docs/`
- **Remote Docs Lookup** (`references/remote-docs.md`) - Fetch from `https://mastra.ai/llms.txt`
- **Troubleshooting** (`references/common-errors.md`) - Common errors and solutions
- **Migrations** (`references/migration-guide.md`) - Version upgrade workflows

Main skill file teaches core concepts and routes to appropriate reference files based on user questions.

---

## Manual Installation

```bash
git clone https://github.com/mastra-ai/skills.git
```

Then configure your coding agent to load skills from the cloned directory.

---

## Contributing

Contributions welcome!

1. Fork the repository
2. Make improvements to SKILL.md files
3. Test with actual development workflows
4. Submit a pull request

---

## Resources

- [Mastra Docs](https://mastra.ai/docs)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [Agent Skills Spec](https://agentskills.io)
- [Discord](https://discord.gg/BTYqqHKUrf)

---

## License

Apache-2.0 - See [LICENSE](LICENSE) for details

---

Built with ❤️ by the [Mastra](https://mastra.ai) team
