# Mastra Agent Skills

Official agent skills for coding agents working with the [Mastra AI framework](https://mastra.ai).

## What are Agent Skills?

Agent skills are structured instruction sets that teach coding agents (Claude Code, Cursor AI, etc.) how to work effectively with specific frameworks. These skills follow the [agentskills.io](https://agentskills.io) specification.

## Installation

```bash
npx add-skill mastra-ai/skills
```

Once installed, coding agents will automatically activate these skills when helping you build with Mastra.

## Included Skills

### 1. 📚 mastra-embeded-docs-look-up

**Purpose**: Look up Mastra API signatures from embedded documentation

**Use when**:
- Need accurate API signatures and parameters
- Validating code correctness
- Checking configuration options
- Debugging Mastra errors

**What it does**:
- Reads embedded docs from `node_modules/@mastra/*/dist/docs/`
- Provides 3-step lookup process (SOURCE_MAP.json → .d.ts → topic docs)
- Ensures docs match installed version (critical for beta software)

**Key benefit**: Always uses documentation that matches the installed Mastra version, more accurate than training data.

---

### 2. ✅ mastra-best-practices

**Purpose**: Quick reference for Mastra architectural patterns and conventions

**Use when**:
- Choosing between agents vs workflows
- Setting up project structure
- Configuring TypeScript (ES2022 requirements)
- Following Mastra conventions

**What it provides**:
- Agent vs Workflow decision guide
- TypeScript configuration requirements
- Project structure conventions
- Code patterns and examples
- Quick reference for common tasks

**Key benefit**: Concise, scannable guide based on official Mastra documentation.

---

### 3. 🚀 create-mastra

**Purpose**: Guide for setting up Mastra projects (new or existing)

**Use when**:
- Starting a new Mastra project
- Adding Mastra to existing application
- Configuring framework integration
- Troubleshooting setup issues

**What it provides**:
- Decision tree (new vs existing project)
- Installation commands and package info
- TypeScript configuration (ES2022 required)
- Agent and workflow setup examples
- Framework integration patterns (Next.js, Express, etc.)
- Setup checklist and troubleshooting

**Key benefit**: Step-by-step setup guide following Better Auth's create-auth pattern.

---

## Why Use These Skills?

**Without skills**, coding agents:
- ❌ Guess API signatures from outdated training data
- ❌ Provide code that doesn't match installed version
- ❌ Miss critical configuration requirements (like ES2022)
- ❌ Can't validate code correctness

**With skills**, coding agents:
- ✅ Look up current APIs from embedded docs
- ✅ Provide accurate signatures matching installed version
- ✅ Follow documented conventions and patterns
- ✅ Validate code correctness

## Quick Example

**User**: "How do I create an agent with tools?"

**Agent with mastra-embeded-docs-look-up skill**:
1. Checks `node_modules/@mastra/core/dist/docs/SOURCE_MAP.json` for Agent
2. Reads type definition from `dist/agent/agent.d.ts`
3. Reviews topic docs for patterns
4. Provides accurate code with correct `tools` parameter ✅

**Agent without skill**:
1. Guesses from training data
2. May use incorrect/outdated API ❌

---

## Requirements

- Mastra packages installed in `node_modules`
- Coding agent supporting agent skills (Claude Code, Cursor, etc.)

---

## Manual Installation

If not using `npx add-skill`:

```bash
git clone https://github.com/mastra-ai/skills.git
```

Then configure your coding agent to load skills from the cloned directory.

---

## Skill Structure

```
mastra-skills/
├── .claude-plugin/
│   └── marketplace.json       # Package metadata
├── skills/
│   ├── mastra-embeded-docs-look-up/
│   │   └── SKILL.md          # API lookup
│   ├── mastra-best-practices/
│   │   └── SKILL.md          # Patterns & conventions
│   └── create-mastra/
│       └── SKILL.md          # Project setup
├── README.md
└── LICENSE
```

Each `SKILL.md` follows the [agentskills.io specification](https://agentskills.io/specification):
- YAML frontmatter with metadata
- Concise, scannable content
- Tables for quick reference
- Code examples
- Links to full documentation

---

## Contributing

Contributions welcome! To improve these skills:

1. Fork the repository
2. Make improvements to SKILL.md files
3. Test with actual development workflows
4. Submit a pull request

**Ideas for contributions**:
- Add more code examples
- Improve clarity of instructions
- Update for new Mastra features
- Fix inaccuracies

---

## Resources

- **Mastra Docs**: https://mastra.ai/docs
- **Mastra GitHub**: https://github.com/mastra-ai/mastra
- **Agent Skills Spec**: https://agentskills.io
- **Discord**: https://discord.gg/BTYqqHKUrf

---

## License

Apache-2.0 - See [LICENSE](LICENSE) for details

---

Built with ❤️ by the [Mastra](https://mastra.ai) team
