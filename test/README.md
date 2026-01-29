# Mastra Skills Test Suite

Real-world testing for skill invocation by spawning independent Claude subagents.

## How It Works

**Claude Tests Claude:**
1. Spawns fresh Claude instance (subagent) for each test
2. Passes user query without test context
3. Observes which tools the subagent actually calls
4. Measures if Skill tool was invoked with correct skill name
5. Records results in snapshots.json

## Why This Approach

**❌ Self-Testing (what we did before):**
- "Would I invoke the skill?" → Circular reasoning
- Estimates, not measurements
- No proof of actual behavior

**✅ Subagent Testing (this approach):**
- Real Claude instances with fresh context
- Actual tool invocations observed
- Measured invocation rates
- Proof in transcripts

## Files

- **prompt.ts** - Test runner that spawns subagents
- **snapshots.json** - Historical test results
- **README.md** - This file

## Running Tests

### Prerequisites

```bash
npm install @anthropic-ai/sdk
export ANTHROPIC_API_KEY=your_key_here
```

### Run Quick Test (9 cases)

```bash
cd test
npx tsx prompt.ts
```

### Run Full Test (50 cases)

Edit `prompt.ts` to use all test cases from `TEST_CASES.md`

### View Results

```bash
cat snapshots.json | jq '.[-1]'  # Latest run
cat snapshots.json | jq '.[-1].invocationRate'  # Just the score
```

## Test Cases

See `TEST_CASES.md` for complete list of 50 test cases.

**Quick Test (9 samples):**
- TC-01: "How do I start a new Mastra project?"
- TC-02: "I have a Next.js app. How do I add Mastra to it?"
- TC-11: "Create a basic AI agent that can answer questions"
- TC-13: "Build an agent that can search the web and check weather"
- TC-16: "Create an agent that remembers previous conversations"
- TC-26: "Create a workflow that processes data in steps"
- TC-36: "Create a tool that calls my internal API"
- TC-41: "Connect Mastra to my Postgres database"
- TC-50: "What parameters does createAgent accept?"

## Success Criteria

**Target:** ≥95% skill invocation rate

**Metrics:**
- `invocationRate`: % of tests where Skill tool was called
- `correctnessRate`: % of tests where correct skill was used
- `passed`: Tests that invoked the correct skill

## Example Output

```
============================================================
Mastra Skills Invocation Test Suite
============================================================
Running 9 test cases...

Testing TC-01: "How do I start a new Mastra project?"
  ✓ Skill invoked: create-mastra
  ✓ Correct: YES

Testing TC-11: "Create a basic AI agent that can answer questions"
  ✓ Skill invoked: mastra
  ✓ Correct: YES

...

============================================================
TEST RESULTS
============================================================
Total Tests:        9
Passed:             9 (100.0%)
Failed:             0 (0.0%)
Invocation Rate:    100.0%
Correctness Rate:   100.0%
============================================================

✓ Snapshot saved to snapshots.json
```

## Snapshot Format

```json
{
  "totalTests": 9,
  "passed": 9,
  "failed": 0,
  "invocationRate": 100,
  "correctnessRate": 100,
  "results": [
    {
      "testId": "TC-01",
      "category": "setup",
      "input": "How do I start a new Mastra project?",
      "expectedSkill": "create-mastra",
      "actualSkill": "create-mastra",
      "skillInvoked": true,
      "correctSkill": true,
      "passed": true,
      "timestamp": "2026-01-29T...",
      "responseLength": 1234,
      "toolCalls": [...]
    }
  ],
  "timestamp": "2026-01-29T..."
}
```

## Troubleshooting

**Issue: Skills not available to subagent**

The spawned Claude instances need access to skills via the tools parameter. In Claude Code CLI, this happens automatically. For direct API usage, skills would need to be passed as tools in the API call.

**Issue: Rate limits**

Test runner includes 1-second delays between tests. For full 50-test suite, consider:
- Running in batches
- Increasing delays
- Using different API tiers

## Next Steps

1. Run quick test (9 cases)
2. Verify ≥95% invocation rate
3. If passing, run full test (50 cases)
4. Compare snapshot results over time
5. Refine skill descriptions if needed
