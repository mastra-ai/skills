# Knowledge

Knowledge is a scoped graph shared by agents and importers. Nodes represent subjects, records hold facts, wikilinks relate nodes, and scope memberships place content and define access.

Use this reference when configuring a Knowledge instance, registering an importer, attaching Knowledge to an agent, or deciding where content belongs.

## Read embedded docs first

Verify against the installed `@mastra/core` version before writing code. Read these files under `node_modules/@mastra/core/dist/docs/references/`:

| Question | Embedded document |
| --- | --- |
| Configure structure, descriptions, and scope templates | `docs-knowledge-configuration.md` |
| Model roles, grants, scopes, and visibility | `docs-knowledge-access.md` |
| Create, query, relate, version, or delete content | `docs-knowledge-records.md` |
| Register static or agentic importers | `docs-knowledge-importers.md` |
| Capture session knowledge | `docs-knowledge-capture.md` |
| Configure governed curation | `docs-knowledge-curation.md` |
| Use Explore, Approvals, Imports, and Activity | `docs-knowledge-ui.md` |
| Review an organization-wide design | `docs-knowledge-example.md` |

If package docs aren't installed, follow [`remote-docs.md`](remote-docs.md) to read current remote documentation. Remote docs may be newer than the project's packages, so verify final code against installed TypeScript types.

## Core rules

1. Create one application-wide `Knowledge` instance with a stable ID and durable storage.
2. Treat scope IDs as opaque UUIDs. Names and address separators don't imply containment.
3. Let the host vouch for caller scope IDs. Never derive authority from identity strings, content, wikilinks, or target scopes.
4. Authorize before ranking, counts, pagination, cursors, graph shaping, or existence disclosure. Hidden resources behave as absent.
5. Use node memberships for placement and separate record memberships for record visibility.
6. Keep imports bounded and replayable. Store cursors in importer state, and make removals explicit.
7. Write uncertain session capture to uncurated companions. Promotion into curated knowledge is a governed curation action.
8. Use numeric versions for compare-and-swap mutations and retry from fresh authorized state after conflicts.

Use the embedded documents for API signatures, setup examples, and complete operational guidance.
