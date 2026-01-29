# Test Mastra Skill Usage: 50 Test Cases

Test if subagents properly discover and invoke Mastra skills when given various queries.

**Goal:** Verify that skill descriptions trigger invocation (instead of agents answering from training knowledge)

**Skills Being Tested:**
1. `mastra` - Main Mastra development skill
2. `create-mastra` - Project setup skill
3. `mastra-embedded-docs-look-up` - API verification skill

---

## Instructions for Claude

When user says: **"run the skill tests"**

Execute this process:

### Step 1: Load Test Cases

Read all 50 test cases from `TEST_CASES.md`

Example test cases:
- "Create a basic AI agent" → Should invoke `mastra` skill
- "How do I start a new project?" → Should invoke `create-mastra` skill
- "What parameters does X accept?" → Should invoke `mastra-embedded-docs-look-up` skill

### Step 2: Spawn Subagents (in parallel batches)

For each test case:
```
1. Spawn subagent with Task tool (subagent_type="general-purpose")
2. Pass ONLY the user query (e.g., "Create a basic AI agent that can answer questions")
3. NO test context - subagent should not know it's being tested
```

**Parallel batches:**
- Run 5 subagents at once (to speed up testing)
- Wait for batch to complete
- Move to next batch

### Step 3: Check if Subagent Invoked Skill

For each subagent response, analyze:

**Question:** Did the subagent invoke the Skill tool?

```typescript
// Look for Skill tool invocation in transcript
const skillCalls = response.tool_uses.filter(call => call.name === 'Skill');

// What we're testing:
{
  testId: "TC-11",
  query: "Create a basic AI agent",
  expectedSkill: "mastra",

  // Did subagent invoke Skill tool?
  skillInvoked: skillCalls.length > 0,  // true = good, false = bad

  // If yes, which skill?
  invokedSkill: skillCalls[0]?.parameters?.skill || null,

  // Did it invoke the RIGHT skill?
  correctSkill: invokedSkill === expectedSkill,

  // Overall: Pass if correct skill invoked
  passed: skillInvoked && correctSkill
}
```

**Why This Matters:**
- If subagent doesn't invoke skill → Skill description needs improvement
- If subagent invokes wrong skill → Skill targeting needs refinement
- If subagent invokes correct skill → Success! ✓

### Step 4: Calculate Metrics

```typescript
const invocationRate = (casesWithSkillInvoked / totalCases) * 100;
const correctnessRate = (casesWithCorrectSkill / totalCases) * 100;
```

### Step 5: Save Results

Append results to `test/snapshots.json`:
```json
{
  "timestamp": "2026-01-29T...",
  "totalTests": 50,
  "passed": XX,
  "failed": XX,
  "invocationRate": XX.X,
  "correctnessRate": XX.X,
  "results": [...]
}
```

### Step 6: Report Results

Display summary:
```
============================================================
SKILL USAGE TEST RESULTS
============================================================
Testing: Do subagents invoke Mastra skills?

Total Test Cases:   50
Skill Invoked:      XX (XX%)  ← Did agent call Skill tool?
Correct Skill:      XX (XX%)  ← Was it the right skill?
Failed:             XX (XX%)  ← No skill or wrong skill

Target: ≥95% correct skill invocation
Status: PASS/FAIL ✓

By Category:
  Setup & Installation:  X/10 (XX%)  → create-mastra
  Agent Development:     X/15 (XX%)  → mastra
  Workflows:             X/10 (XX%)  → mastra
  Tools & Integrations:  X/5  (XX%)  → mastra
  Storage & Memory:      X/5  (XX%)  → mastra
  RAG & Vector Search:   X/3  (XX%)  → mastra
  Troubleshooting:       X/2  (XX%)  → mastra/embedded-docs

Failures (what needs fixing):
  TC-18: "How do I handle agent failures?"
    Problem: Subagent answered directly (no skill invoked)
    Fix: Add "error handling" to mastra skill triggers

  TC-22: "Track agent costs"
    Problem: Subagent answered directly
    Fix: Add "monitoring/costs" to mastra skill triggers

✓ Results saved to test/snapshots.json
============================================================
```

**Interpretation:**
- High % = Skill descriptions are working (agents invoke skills)
- Low % = Skill descriptions need improvement (agents skip skills)

---

## Example Usage

**User:**
```
run the skill tests
```

**Claude:**
```
Running all 50 skill invocation tests...

Batch 1/10 - Spawning 5 subagents...
  TC-01: ✓ create-mastra
  TC-02: ✓ create-mastra
  TC-03: ✓ create-mastra
  TC-04: ✓ create-mastra
  TC-05: ✓ create-mastra

Batch 2/10 - Spawning 5 subagents...
  TC-06: ✓ create-mastra
  ...

[Full results displayed]
```

---

## Important Notes

### For Claude:

1. **Spawn REAL subagents** - Use Task tool, not self-analysis
2. **No test context** - Subagent should not know it's being tested
3. **Check actual tool calls** - Look for Skill tool invocations in transcript
4. **Run ALL 50 cases** - Not just 9 quick samples
5. **Save to snapshots.json** - Append, don't overwrite
6. **Report honestly** - If tests fail, report failures and why

### For User:

- Just say: "run the skill tests"
- Claude will handle everything
- Results saved to `test/snapshots.json`
- Check if ≥95% invocation rate achieved

---

## Test Cases Reference

All 50 test cases are defined in `TEST_CASES.md`:

**Categories:**
- Setup & Installation: TC-01 to TC-10 (create-mastra)
- Agent Development: TC-11 to TC-25 (mastra)
- Workflows: TC-26 to TC-35 (mastra)
- Tools & Integrations: TC-36 to TC-40 (mastra)
- Storage & Memory: TC-41 to TC-45 (mastra)
- RAG & Vector Search: TC-46 to TC-48 (mastra)
- Troubleshooting: TC-49 to TC-50 (mastra + embedded-docs-look-up)

**Total:** 50 test cases

---

## Success Criteria

**Target:** ≥95% skill invocation rate

**Passing Conditions:**
- ≥48 out of 50 tests invoke correct skill
- All categories show >90% invocation
- No systematic failures (e.g., entire category failing)

**If Failed:**
- Identify which test cases failed
- Analyze why skills weren't invoked
- Refine skill descriptions
- Re-run tests

---

**Last Updated:** 2026-01-29
