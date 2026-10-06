# Knowledge

Knowledge is a scoped graph shared by agents and importers. Nodes represent subjects, records hold facts, wikilinks relate nodes, scope memberships place content, and grants on scopes decide who can read or change it.

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
| Curate session observations into Knowledge | `docs-knowledge-curation.md` |
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
7. Let the Subconscious `curate` agent write committed session observations into Knowledge. It uses ordinary Knowledge tools with the session's own grants.
8. Make content private with grants. Callers see content only through scopes they can read, so a private scope needs restricted grants and no public grant or mirror path.
9. Use numeric versions for compare-and-swap mutations and retry from fresh authorized state after conflicts.

Use the embedded documents for API signatures, setup examples, and complete operational guidance.
