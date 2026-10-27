# Core Concepts Reference

Use this reference when choosing Mastra primitives and native capabilities before designing custom infrastructure.

## Discover native capabilities first

Map the requested behavior to an existing Mastra capability before choosing an API. Use [embedded docs](embedded-docs.md) to search the installed packages for the topics below; if unavailable, discover them through [remote docs](remote-docs.md). Remote documentation may describe features newer than the installed release.

| Task | Native capability to investigate | Verify before implementing |
| ---- | ------------------------------- | -------------------------- |
| Add structured application logs | Logging and `PinoLogger` (`@mastra/loggers`) | Logger configuration, levels, redaction, and supported destinations |
| Set up execution tracing | Observability configuration and tracing (`@mastra/observability`) | Span capture, sampling, exporters, storage, and flush lifecycle |
| Track latency, token usage, or estimated model cost | Automatic span-derived metrics and metric queries | Installed-version support, analytics-capable storage, provider usage reporting, and model pricing coverage |
| Compare prompts, models, or agent/workflow quality | Datasets, experiments, and scorers | Supported targets, dataset storage, scorer configuration, and per-item results; execution success is not a quality score |

For querying existing traces and spans or aggregating their measures, use [trace queries and aggregation](trace-query.md). This is distinct from configuring collection or querying automatic metrics.

Prefer the native capability when it meets the requirement. Before adding custom infrastructure, identify the specific gap in the installed version and check available configuration or extension points. Experiments can make model calls; get user approval before running them.

Keep application-specific accounting and business rules separate: observability cost estimates are not an authoritative billing ledger. Customer pricing, credits, invoices, and enforcement remain application-owned; scorer results likewise do not define business policy.

## Agents vs workflows

Agent: Autonomous, makes decisions, uses tools.
Use for open-ended tasks such as support, research, analysis, and tool-using assistants.

Workflow: Structured sequence of steps.
Use for defined processes such as pipelines, approvals, ETL, multi-step business logic, and resumable processes.

## Key components

- Tools: Extend agent capabilities through APIs, databases, external services, and deterministic functions.
- Memory: Maintain context through message history, working memory, semantic recall, and observational memory.
- Storage: Persist data with providers such as Postgres, LibSQL, and MongoDB.
