# Test All 50 Mastra Skills

Run complete skill invocation test suite by spawning 50 independent subagents.

---

## Instructions for Claude

When user says: **"run the skill tests"** or **"test all 50 cases"**

Execute this process:

### Step 1: Load Test Cases

Read all 50 test cases from `TEST_CASES.md`

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

### Step 3: Observe Results

For each subagent response, check:
```typescript
// Extract from subagent transcript
const toolCalls = extractToolCalls(response);
const skillCalls = toolCalls.filter(call => call.name === 'Skill');

// Record results
{
  testId: "TC-XX",
  skillInvoked: skillCalls.length > 0,
  invokedSkill: skillCalls[0]?.parameters?.skill || null,
  expectedSkill: testCase.expectedSkill,
  passed: invokedSkill === expectedSkill
}
```

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

### Step 6: Report

Display summary:
```
============================================================
MASTRA SKILLS TEST RESULTS
============================================================
Total Tests:        50
Passed:             XX (XX%)
Failed:             XX (XX%)
Invocation Rate:    XX.X%
Correctness Rate:   XX.X%

Target: ≥95% invocation rate
Status: PASS/FAIL

By Category:
  Setup & Installation:  X/10 (XX%)
  Agent Development:     X/15 (XX%)
  Workflows:             X/10 (XX%)
  Tools & Integrations:  X/5  (XX%)
  Storage & Memory:      X/5  (XX%)
  RAG & Vector Search:   X/3  (XX%)
  Troubleshooting:       X/2  (XX%)

Failures (if any):
  TC-XX: "query" - Expected: skill-name, Got: other-skill
  ...

✓ Results saved to test/snapshots.json
============================================================
```

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
