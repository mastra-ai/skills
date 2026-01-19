# Mastra Agent Skills

Official agent skills for coding agents working with the [Mastra AI framework](https://mastra.ai).

## What are Agent Skills?

Agent skills are structured instruction sets that teach coding agents (Claude Code, Cursor AI, etc.) how to work effectively with specific frameworks. These skills follow the [agentskills.io](https://agentskills.io) specification.

## Installation

```bash
npx add-skill mastra/skills
```

Once installed, coding agents will automatically activate these skills when helping you build with Mastra.

## Included Skills

### 1. 📚 lookup-mastra-api

**Purpose**: Look up Mastra APIs and validate code against embedded documentation

**Two use cases**:
1. **Lookup**: Check APIs before/during implementation
2. **Validation**: Verify code correctness after implementation

**Activates when**:
- Implementing Mastra features (agents, workflows, tools)
- Checking API parameters or signatures
- Encountering errors with Mastra code
- Answering "how do I" questions
- Validating code from Context7 or other sources

**What it provides**:
- 3-step lookup process (SKILL.md → SOURCE_MAP.json → .d.ts + topic docs)
- Commands to find exports and read type definitions
- Example workflows for lookup and validation
- Validation guidance for Context7 suggestions
- Why embedded docs are authoritative

**Key benefit**: Always uses docs that match the installed Mastra version, ensuring accuracy for lookup or validation.

### 2. ✅ best-practices

**Purpose**: Patterns and conventions for building Mastra applications

**Activates when**:
- Choosing between agents vs workflows
- Setting up new Mastra projects
- Configuring TypeScript or environment variables
- Structuring applications
- Following Mastra conventions

**What it provides**:
- When to use agents vs workflows (with examples)
- Project setup patterns (installation, structure, config)
- Agent configuration (instructions, tools, streaming)
- Workflow configuration (steps, methods, nesting)
- TypeScript requirements and conventions
- Memory, tools, and runtime context patterns

**Key benefit**: Agents follow documented patterns from official Mastra docs, helping users build correctly from the start.

## Why Use These Skills?

**Without skills**, coding agents:
- ❌ Guess API signatures from outdated training data
- ❌ Can't validate if Context7 or other tool suggestions are current
- ❌ Provide code that doesn't match installed Mastra version
- ❌ Miss official usage patterns and conventions
- ❌ Unable to verify code correctness

**With skills**, coding agents:
- ✅ Look up current APIs from embedded docs (matches installed version)
- ✅ Validate code from any source against embedded docs
- ✅ Provide accurate signatures and usage patterns
- ✅ Follow documented conventions
- ✅ Verify code correctness before or after implementation

## Quick Examples

### Example 1: Lookup (Proactive)

**User**: "Implement parallel workflows in Mastra"

**Agent with skill**:
1. Uses `read-mastra-embedded-docs` to check `workflow.parallel()` API
2. Checks SOURCE_MAP.json → reads workflow types → checks topic docs
3. Writes code with correct signature and patterns
4. Code works! ✅

**Agent without skill**:
1. Guesses at API from training data
2. Uses incorrect signature
3. Code doesn't work, has to debug ❌

### Example 2: Validation (Reactive)

**User**: "Context7 suggested this code, is it correct?"
```typescript
await agent.generate('hello', { maxTokens: 1000 })
```

**Agent with skill**:
1. Uses `read-mastra-embedded-docs` to validate
2. Checks Agent.generate signature in embedded docs
3. Discovers parameter should be `maxSteps` not `maxTokens`
4. Reports: "Incorrect - should use `maxSteps`" ✅

**Agent without skill**:
1. Can't validate against installed version
2. Either guesses or can't verify ❌

## Requirements

- Mastra packages installed in your project's `node_modules`
- A coding agent that supports agent skills (Claude Code, Cursor, etc.)

## Manual Installation

If not using `npx add-skill`:

```bash
git clone https://github.com/mastra-ai/skills.git
```

Then configure your coding agent to load skills from the cloned directory.

## Skill Structure

```
mastra-skills/
├── .claude-plugin/
│   └── marketplace.json       # Package metadata
├── skills/
│   ├── lookup-mastra-api/
│   │   └── SKILL.md          # API lookup and validation
│   └── best-practices/
│       └── SKILL.md          # Patterns and conventions
├── README.md
└── LICENSE
```

Each `SKILL.md` follows the [agentskills.io specification](https://agentskills.io/specification):
- YAML frontmatter with metadata
- Clear activation triggers
- Step-by-step instructions
- Examples and anti-patterns
- Command references

## Contributing

Contributions welcome! To improve these skills:

1. Fork the repository
2. Make improvements to SKILL.md files
3. Test with actual development workflows
4. Submit a pull request

**Ideas for contributions**:
- Add more example workflows
- Improve clarity of instructions
- Add new patterns or anti-patterns
- Fix inaccuracies

## Resources

- **Mastra Docs**: https://mastra.ai/docs
- **Mastra GitHub**: https://github.com/mastra-ai/mastra
- **Agent Skills Spec**: https://agentskills.io
- **Discord**: https://discord.gg/BTYqqHKUrf

## License

Apache-2.0 - See [LICENSE](LICENSE) for details

---

Built with ❤️ by the [Mastra](https://mastra.ai) team
# skills
