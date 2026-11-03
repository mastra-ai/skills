# Embedded Docs Reference

Look up API signatures from embedded docs in `node_modules/@mastra/*/dist/docs/` - these match the installed version.

**Use this FIRST** when Mastra packages are installed locally. Embedded docs are always accurate for the installed version.

## Why use embedded docs

- **Version accuracy**: Embedded docs match the exact installed version
- **No network required**: All docs are local in `node_modules/`
- **Mastra evolves quickly**: APIs change rapidly, embedded docs stay in sync
- **TypeScript definitions**: Includes JSDoc, type signatures, and examples
- **Training data may be outdated**: Claude's knowledge cutoff may not reflect latest APIs

## Documentation structure

```
node_modules/@mastra/core/dist/docs/
├── SKILL.md # Package overview, exports
├── assets/
│   └── SOURCE_MAP.json # Module -> file mappings
└── references/ # Individual topic docs
```

## Lookup process

### 1. Check if packages are installed

```bash
ls node_modules/@mastra/
```

If you see packages like `core`, `memory`, `rag`, etc., proceed with embedded docs lookup.

### 2. Look through topic docs

Use `grep` to find relevant docs in `references/`:

```bash
grep -r "Agent" node_modules/@mastra/core/dist/docs/references
```

### Naming convention

Documents are typically formatted as `<category>-<topic>.md` where category is one of: `"docs", "reference", "guides", "models"`.

### Optional: Check source code for type definitions / additional details

`SOURCE_MAP.json` maps modules to files. Its top level has four keys: `version`, `package`, `exports`, and `modules`.

- `modules` holds the real module names (`agent`, `tools`, `workflows`, `memory`, `stream`, `llm`, `mastra`, `mcp`, `evals`, `processors`, `storage`, `vector`, `voice`). Use it to find which file implements a module.
- `exports` holds five single-letter keys (`t`, `r`, `i`, `n`, `a`). The keys are mangled build artifacts, not export names, so the map cannot be searched by export name.

List the modules and their entry files:

```bash
python3 -c "import json;d=json.load(open('node_modules/@mastra/core/dist/docs/assets/SOURCE_MAP.json'));[print(k,v['index']) for k,v in d['modules'].items()]"
```

For a specific export's signature, go straight to the type definition. Read the `.d.ts` file for the module the export belongs to:

```bash
cat node_modules/@mastra/core/dist/agent/agent.d.ts
```

Read the type definition for exact constructor parameters, types, and JSDoc.

[`migration-guide.md`](migration-guide.md) uses `SOURCE_MAP.json` for the same lookup. Apply the same correction there.

## Common packages

| Package          | Path                                     | Contains                                  |
| ---------------- | ---------------------------------------- | ----------------------------------------- |
| `@mastra/core`   | `node_modules/@mastra/core/dist/docs/`   | Agents, Workflows, Tools, Mastra instance  |
| `@mastra/memory` | `node_modules/@mastra/memory/dist/docs/` | Memory systems, conversation history      |
| `@mastra/rag`    | `node_modules/@mastra/rag/dist/docs/`    | RAG features, vector stores               |
| `@mastra/pg`     | `node_modules/@mastra/pg/dist/docs/`     | PostgreSQL storage                        |
| `@mastra/libsql` | `node_modules/@mastra/libsql/dist/docs/` | LibSQL/SQLite storage                     |

## Quick commands reference

```bash
# List installed @mastra packages
ls node_modules/@mastra/

# List available topic documentation
ls node_modules/@mastra/core/dist/docs/references/

# List modules and their entry files from SOURCE_MAP
python3 -c "import json;d=json.load(open('node_modules/@mastra/core/dist/docs/assets/SOURCE_MAP.json'));[print(k,v['index']) for k,v in d['modules'].items()]"

# Read type definition for a module
cat node_modules/@mastra/core/dist/[module-path]/[file].d.ts

# View package overview
cat node_modules/@mastra/core/dist/docs/SKILL.md
```

## When embedded docs are not available

If packages aren't installed or `dist/docs/` doesn't exist:

1. **Recommend installation**: Suggest installing packages to access embedded docs
2. **Fall back to remote docs**: See `references/remote-docs.md`

## Best Practices

1. **Check topic docs** for conceptual understanding and patterns
2. **Search source code** if docs don't answer the question
3. **Verify imports** match what's exported in the type definitions
