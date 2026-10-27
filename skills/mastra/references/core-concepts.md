# Core Concepts Reference

Use this reference when choosing Mastra primitives and native capabilities before designing custom infrastructure.

## Discover native capabilities first

Check whether Mastra already provides the requested behavior before designing custom infrastructure. Verify the installed version's capabilities, configuration, and limits using [embedded docs](embedded-docs.md), or [remote docs](remote-docs.md) when unavailable. Prefer native capabilities where they fit; add custom logic for identified gaps and application-specific business rules.

## Agents vs workflows

Agent: Autonomous, makes decisions, uses tools.
Use for open-ended tasks such as support, research, analysis, and tool-using assistants.

Workflow: Structured sequence of steps.
Use for defined processes such as pipelines, approvals, ETL, multi-step business logic, and resumable processes.

## Key components

- Tools: Extend agent capabilities through APIs, databases, external services, and deterministic functions.
- Memory: Maintain context through message history, working memory, semantic recall, and observational memory.
- Storage: Persist data with providers such as Postgres, LibSQL, and MongoDB.
