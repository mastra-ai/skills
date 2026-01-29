# Mastra Skills Test Suite

Real-world testing: Claude spawns subagents to measure actual skill invocation behavior.

---

## How It Works

**Claude Tests Claude:**

1. User says: **"run the skill tests"**
2. Claude reads PROMPT.md for instructions
3. Claude spawns 50 independent subagents (one per test case)
4. Each subagent gets a query like: "Create a basic AI agent..."
5. Claude observes which tools each subagent invokes
6. Results saved to snapshots.json

**Why This Works:**
- ✅ Real subagents (not self-analysis)
- ✅ Fresh context (no test bias)
- ✅ Actual tool calls (measured, not estimated)
- ✅ All 50 cases (complete coverage)

---

## Files

```
test/
├── PROMPT.md         # Instructions for Claude to run tests
├── snapshots.json    # Historical test results
└── README.md         # This file
```

---

## Running Tests

### Simple: Just Ask Claude

```
User: "run the skill tests"
```

Claude will:
1. Load all 50 test cases from TEST_CASES.md
2. Spawn subagents in parallel batches (5 at a time)
3. Check each response for Skill tool invocations
4. Calculate invocation rate and correctness
5. Save results to snapshots.json
6. Display summary report

### What Claude Does

```
Running all 50 skill invocation tests...

Batch 1/10 - Spawning 5 subagents...
  TC-01: ✓ create-mastra invoked
  TC-02: ✓ create-mastra invoked
  TC-03: ✓ create-mastra invoked
  TC-04: ✓ create-mastra invoked
  TC-05: ✓ create-mastra invoked

Batch 2/10...
  TC-06: ✓ create-mastra invoked
  ...

============================================================
MASTRA SKILLS TEST RESULTS
============================================================
Total Tests:        50
Passed:             48 (96%)
Failed:             2 (4%)
Invocation Rate:    96.0%
Correctness Rate:   96.0%

Target: ≥95% → PASS ✓

By Category:
  Setup & Installation:  10/10 (100%)
  Agent Development:     14/15 (93%)
  Workflows:             10/10 (100%)
  Tools & Integrations:  5/5 (100%)
  Storage & Memory:      5/5 (100%)
  RAG & Vector Search:   3/3 (100%)
  Troubleshooting:       2/2 (100%)

Failures:
  TC-18: "How do I handle when an agent call fails?"
    Expected: mastra, Got: none (answered directly)

✓ Results saved to test/snapshots.json
============================================================
```

---

## Test Cases

All 50 test cases are defined in `TEST_CASES.md`

**By Category:**

| Category | Tests | Expected Skill |
|----------|-------|----------------|
| Setup & Installation | TC-01 to TC-10 | create-mastra |
| Agent Development | TC-11 to TC-25 | mastra |
| Workflows | TC-26 to TC-35 | mastra |
| Tools & Integrations | TC-36 to TC-40 | mastra |
| Storage & Memory | TC-41 to TC-45 | mastra |
| RAG & Vector Search | TC-46 to TC-48 | mastra |
| Troubleshooting | TC-49 to TC-50 | mastra / embedded-docs-look-up |

**Total:** 50 test cases covering all Mastra development scenarios

---

## Success Criteria

**Target:** ≥95% skill invocation rate

**Passing:**
- ≥48 out of 50 tests invoke correct skill
- All categories >90% invocation
- No systematic failures

**If Tests Fail:**
1. Claude identifies which cases failed
2. Analyzes why skills weren't invoked
3. Suggests skill description improvements
4. Can re-run tests after changes

---

## Snapshots

Results are saved in `snapshots.json`:

```json
[
  {
    "timestamp": "2026-01-29T15:30:00Z",
    "totalTests": 50,
    "passed": 48,
    "failed": 2,
    "invocationRate": 96.0,
    "correctnessRate": 96.0,
    "results": [
      {
        "testId": "TC-01",
        "input": "How do I start a new Mastra project?",
        "expectedSkill": "create-mastra",
        "actualSkill": "create-mastra",
        "skillInvoked": true,
        "passed": true
      },
      ...
    ]
  }
]
```

**View Latest Results:**
```bash
cat snapshots.json | jq '.[-1]'
```

**Track Progress Over Time:**
```bash
cat snapshots.json | jq '[.[] | {timestamp, invocationRate}]'
```

---

## Why Not TypeScript?

**Previous approach:** test/prompt.ts (TypeScript code)
- Required npm, tsx, dependencies
- External script, harder to use
- Not integrated with Claude's workflow

**Current approach:** test/PROMPT.md (simple prompt)
- No dependencies
- Just ask Claude: "run the skill tests"
- Claude handles everything
- Results automatically saved

---

## Advantages

1. **Simple:** No setup, just ask Claude
2. **Integrated:** Works within Claude Code workflow
3. **Complete:** Tests all 50 cases, not just samples
4. **Parallel:** Runs in batches for speed
5. **Tracked:** Historical snapshots for comparison
6. **Honest:** Real subagent behavior, not estimates

---

## Example Session

```
User: "run the skill tests"

Claude: "Running all 50 skill invocation tests...
         [spawns subagents, collects results]

         Results: 48/50 passed (96%)
         Invocation Rate: 96.0% ✓

         Target achieved! ≥95% skill invocation rate."

User: "show me the failures"

Claude: "2 test cases failed:

         TC-18: Error handling question
         - Expected: mastra
         - Got: none (answered directly from training)
         - Suggests: Add 'error handling' to triggers

         TC-22: Cost tracking question
         - Expected: mastra
         - Got: none (monitoring not in triggers)
         - Suggests: Add 'monitoring/costs' to triggers"

User: "update the skill descriptions based on failures"

Claude: "Updating mastra skill description...
         [makes changes]

         Ready to re-test. Say 'run the skill tests' again."
```

---

## Maintenance

**When to Run Tests:**
- After updating skill descriptions
- After adding new test cases
- Before releasing skill updates
- Weekly/monthly for monitoring

**Iterative Improvement:**
1. Run tests
2. Identify failures
3. Refine skill descriptions
4. Re-run tests
5. Repeat until ≥95%

---

**Last Updated:** 2026-01-29
