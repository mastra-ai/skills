# Core Concepts Reference

Use this reference when deciding which Mastra primitive to use or when explaining the high-level shape of a Mastra application.

## Agents vs workflows

Agent: Autonomous, makes decisions, uses tools.
Use for open-ended tasks such as support, research, analysis, and tool-using assistants.

Workflow: Structured sequence of steps.
Use for defined processes such as pipelines, approvals, ETL, multi-step business logic, and resumable processes.

## Key components

- Tools: Extend agent capabilities through APIs, databases, external services, and deterministic functions.
- Memory: Maintain context through message history, working memory, semantic recall, and observational memory.
- Storage: Persist data with providers such as Postgres, LibSQL, and MongoDB.

## Mastra Studio

Mastra Studio is the interactive UI for building, testing, and managing agents, workflows, and tools. Use Studio when advising a human to inspect or debug visually.

Inside a Mastra project, run:

```bash
npm run dev
```

Then open `http://localhost:4111` in a browser to show Mastra Studio to your human user.

## Mastra API CLI

Use `mastra api` when you, the coding agent, need machine-readable state from a local dev server, Mastra platform deployment, or remote Mastra endpoint. See [`mastra-api.md`](mastra-api.md) for command patterns.
