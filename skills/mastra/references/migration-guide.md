# Migration Guide

Guide for upgrading to Mastra v1 with real-world migration patterns.

---

## Pre-Migration Requirements

### Node.js Version
Mastra v1 requires **Node.js 22.13.0 or higher**.

```bash
node --version  # Must be 22.13.0+
```

### Update All Packages Together
Always update all @mastra packages simultaneously:

```bash
npm install @mastra/core@latest @mastra/memory@latest @mastra/rag@latest mastra@latest
```

### Database Migration
If using PostgreSQL or LibSQL storage, run database migrations. See [Storage Migration Guide](https://mastra.ai/guides/migrations/upgrade-to-v1/storage).

---

## Automated Migration (Run This First)

Mastra provides automated codemods to handle mechanical changes:

```bash
npx @mastra/codemod@latest v1
```

This handles most API changes automatically. Manual refinement may still be needed.

---

## High-Impact Breaking Changes

### 1. Tool Execute Signature (CRITICAL)

**Old pattern**:
```typescript
const tool = createTool({
  id: 'my-tool',
  execute: async (input) => {
    // Input mixed with context
    return { result: 'done' };
  }
});
```

**New pattern**:
```typescript
const tool = createTool({
  id: 'my-tool',
  execute: async (inputData, context) => {
    // inputData: Tool input parameters
    // context: Mastra context (agent, memory, requestContext)
    return { result: 'done' };
  }
});
```

**Migration**: Separate input data from context access.

---

### 2. Pagination API (BREAKING)

**Old pattern**:
```typescript
const messages = await storage.getMessages({
  offset: 0,
  limit: 10
});
```

**New pattern**:
```typescript
const messages = await storage.listMessages({
  page: 1,
  perPage: 10
});
```

**Migration**:
- `offset` → `page` (1-indexed)
- `limit` → `perPage`
- `get*` methods → `list*` methods

---

### 3. Observability Configuration

**Old pattern**:
```typescript
const mastra = new Mastra({
  telemetry: {
    serviceName: 'my-service',
    // ... config
  }
});
```

**New pattern**:
```typescript
import { Observability } from '@mastra/observability';

const mastra = new Mastra({
  observability: new Observability({
    serviceName: 'my-service',
    // ... config
  })
});
```

**Migration**: Install `@mastra/observability` and wrap telemetry config.

---

### 4. RuntimeContext → RequestContext

**Old pattern**:
```typescript
const tool = createTool({
  execute: async (input, context) => {
    const userId = context.runtimeContext?.get('userId');
  }
});
```

**New pattern**:
```typescript
const tool = createTool({
  execute: async (inputData, context) => {
    const userId = context.requestContext?.get('userId');
  }
});
```

**Migration**: Rename all `runtimeContext` → `requestContext`.

---

## Medium-Impact Changes

### Property Access → Getter Methods

**Old pattern**:
```typescript
const agent = mastra.agents.myAgent;
const workflow = mastra.workflows.myWorkflow;
```

**New pattern**:
```typescript
const agent = mastra.getAgent('myAgent');
const workflow = mastra.getWorkflow('myWorkflow');
```

---

### Voice Methods Namespace

**Old pattern**:
```typescript
await agent.transcribe(audioFile);
await agent.synthesize(text);
```

**New pattern**:
```typescript
await agent.voice.transcribe(audioFile);
await agent.voice.synthesize(text);
```

---

### Memory Scope Default Changed

**Old default**: `thread` scope
**New default**: May differ (verify against docs)

**Explicit configuration**:
```typescript
const memory = new Memory({
  id: 'my-memory',
  storage,
  options: {
    workingMemory: {
      enabled: true,
      scope: 'thread' // Explicitly set if you relied on old default
    }
  }
});
```

---

### Storage Method Renames

**Old pattern**:
```typescript
await storage.getMessages();
await storage.getThreads();
await storage.getAgents();
```

**New pattern**:
```typescript
await storage.listMessages();
await storage.listThreads();
await storage.listAgents();
```

---

## Lower-Impact Updates

### RAG Parameters
```typescript
// Old
{ keepSeparator: true }

// New
{ separatorPosition: 'start' } // or 'end'
```

---

### Workflow Methods
```typescript
// Old
await workflow.createRunAsync();
const { runCount } = run;

// New
await workflow.createRun();
const { retryCount } = run;
```

---

### Voice Package Names
```bash
# Old
npm install @mastra/speech-synthesis @mastra/speech-recognition

# New
npm install @mastra/voice-synthesis @mastra/voice-recognition
```

---

### Evals API
```typescript
// Old
await runExperiment();
getScorerByName('accuracy');

// New
await runEvals();
getScorerById('accuracy');
```

---

## Deprecation Notices

### Check for Deprecated APIs

1. Use `mastra-embedded-docs-look-up` skill
2. Check console warnings during development
3. Review package changelog
4. Search codebase for deprecated patterns

### Common Deprecations

**Always verify against current docs** - APIs change frequently.

---

## Migration Tools

### Automated Checks

```bash
# TypeScript will catch many breaking changes
npx tsc --noEmit

# Lint for common issues
npm run lint
```

### Manual Review

1. Search for imports: `grep -r "from '@mastra" src/`
2. Review agent configurations
3. Review workflow patterns
4. Check memory setup
5. Validate tool definitions

---

## Version-Specific Guides

### Before Migrating

1. **Backup your code**: Commit all changes
2. **Review changelog**: Check for breaking changes
3. **Test current version**: Ensure tests pass
4. **Update dependencies**: Update @mastra packages together

### After Migrating

1. **Run tests**: `npm test`
2. **Check types**: `npx tsc --noEmit`
3. **Test in Studio**: `npm run dev`
4. **Review warnings**: Check console for deprecation warnings

---

## Getting Migration Help

1. **Embedded docs**: Use `mastra-embedded-docs-look-up` skill for current API
2. **Official docs**: [mastra.ai/docs](https://mastra.ai/docs)
3. **Migration guides**: Check docs/migration/ in package
4. **Community**: Ask in Discord or GitHub Discussions
5. **Issues**: Report migration problems on GitHub

---

## Migration Checklist Template

```markdown
## Migration from vX.X to vY.Y

### Pre-Migration
- [ ] Current version documented
- [ ] Code backed up (git commit)
- [ ] Tests passing
- [ ] Changelog reviewed

### Update
- [ ] Dependencies updated
- [ ] TypeScript compilation successful
- [ ] Import statements updated
- [ ] Configuration updated

### Validation
- [ ] All tests pass
- [ ] Studio works (npm run dev)
- [ ] No console warnings
- [ ] Production tested (if applicable)

### Notes
- Breaking changes encountered:
- Time spent:
- Issues filed:
```

---

## Future-Proofing Your Code

### Best Practices

1. **Use embedded docs**: Always verify APIs with `mastra-embedded-docs-look-up`
2. **Pin versions**: Use exact versions in package.json during development
3. **Test regularly**: Run tests frequently
4. **Monitor deprecations**: Pay attention to console warnings
5. **Update incrementally**: Don't skip major versions

### Recommended package.json

```json
{
  "dependencies": {
    "@mastra/core": "^1.0.0",
    "@mastra/memory": "^1.0.0",
    "@mastra/rag": "^1.0.0"
  }
}
```

Use `^` for minor version updates, or pin exact versions for stability.
