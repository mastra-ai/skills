# Mastra Skills Test Cases

Complete list of 50 test cases for validating AI agent skill invocation.

---

## Test Format

Each test includes:
- **ID**: Test case identifier (TC-XX)
- **Input**: User query exactly as asked
- **Expected Skill**: Which skill should be invoked
- **Category**: Test category
- **Key Validation**: What to check in the response

---

## Setup & Installation (create-mastra skill)

### TC-01: New Project Setup
**Input:** "How do I start a new Mastra project?"
**Expected Skill:** create-mastra
**Key Check:** Mentions `npx create-mastra`

### TC-02: Add to Next.js
**Input:** "I have a Next.js app. How do I add Mastra to it?"
**Expected Skill:** create-mastra
**Key Check:** Shows `npm install @mastra/core` + ES2022 config

### TC-03: Add to Express
**Input:** "Can I use Mastra with Express? How do I set it up?"
**Expected Skill:** create-mastra
**Key Check:** Express integration pattern

### TC-04: Installation Errors
**Input:** "I'm getting 'Module not found' when importing from @mastra/core"
**Expected Skill:** create-mastra
**Key Check:** Troubleshooting steps (≥3 suggestions)

### TC-05: TypeScript Configuration
**Input:** "What TypeScript settings does Mastra need?"
**Expected Skill:** create-mastra
**Key Check:** Explicitly mentions "ES2022" requirement

### TC-06: Environment Variables
**Input:** "How do I set up my API keys for Mastra?"
**Expected Skill:** create-mastra
**Key Check:** .env setup with process.env usage

### TC-07: Standalone Script
**Input:** "I just want to run a simple Mastra script, not a full app"
**Expected Skill:** create-mastra
**Key Check:** Minimal setup example

### TC-08: Monorepo Setup
**Input:** "How do I add Mastra to my monorepo workspace?"
**Expected Skill:** create-mastra
**Key Check:** Package dependencies discussion

### TC-09: Framework Choice
**Input:** "Should I use the CLI or manual setup for my Mastra project?"
**Expected Skill:** create-mastra
**Key Check:** Decision tree or comparison

### TC-10: Deployment Preparation
**Input:** "What do I need to configure before deploying my Mastra app?"
**Expected Skill:** create-mastra
**Key Check:** Environment and build config

---

## Agent Development (mastra skill)

### TC-11: First Agent
**Input:** "Create a basic AI agent that can answer questions"
**Expected Skill:** mastra
**Key Check:** `new Agent()`, provider/name format, no deprecated APIs

### TC-12: Model Selection
**Input:** "How do I create an agent using GPT-4?"
**Expected Skill:** mastra
**Key Check:** `model: { provider: 'openai', name: 'gpt-4o' }`

### TC-13: Agent with Tools
**Input:** "Build an agent that can search the web and check weather"
**Expected Skill:** mastra
**Key Check:** ≥2 tools defined, Zod schemas, tools registered

### TC-14: Custom Instructions
**Input:** "Make an agent that always responds in a formal tone"
**Expected Skill:** mastra
**Key Check:** Shows `instructions` parameter

### TC-15: Multi-Agent System
**Input:** "I need multiple agents that work together"
**Expected Skill:** mastra
**Key Check:** Multiple agent registration

### TC-16: Agent with Memory
**Input:** "Create an agent that remembers previous conversations"
**Expected Skill:** mastra
**Key Check:** Memory setup (Postgres/LibSQL), threadId usage

### TC-17: Structured Output
**Input:** "I need an agent that returns JSON in a specific format"
**Expected Skill:** mastra
**Key Check:** Zod outputSchema, type-safe usage

### TC-18: Error Handling
**Input:** "How do I handle when an agent call fails?"
**Expected Skill:** mastra
**Key Check:** Error handling patterns (try/catch)

### TC-19: Streaming Responses
**Input:** "Can I stream the agent's response as it's generated?"
**Expected Skill:** mastra
**Key Check:** Streaming pattern

### TC-20: Agent with Context
**Input:** "Pass user profile data to my agent on every call"
**Expected Skill:** mastra
**Key Check:** Context passing mechanism

### TC-21: Testing Agents
**Input:** "How do I test my Mastra agent?"
**Expected Skill:** mastra
**Key Check:** Testing patterns/approach

### TC-22: Cost Tracking
**Input:** "I want to track how much each agent call costs"
**Expected Skill:** mastra
**Key Check:** Usage tracking discussion

### TC-23: Model Comparison
**Input:** "Should I use Claude or GPT-4 for my agent?"
**Expected Skill:** mastra
**Key Check:** Model comparison/guidance

### TC-24: Local Models
**Input:** "Can I use Ollama models with Mastra agents?"
**Expected Skill:** mastra
**Key Check:** Local model integration

### TC-25: Agent Timeout
**Input:** "My agent calls are timing out, how do I fix this?"
**Expected Skill:** mastra
**Key Check:** Timeout configuration

---

## Workflows (mastra skill)

### TC-26: Basic Workflow
**Input:** "Create a workflow that processes data in steps"
**Expected Skill:** mastra
**Key Check:** Sequential workflow, ≥2 steps, state passing

### TC-27: Branching Workflow
**Input:** "I need a workflow that takes different paths based on conditions"
**Expected Skill:** mastra
**Key Check:** Conditional execution (`when` parameter)

### TC-28: Parallel Execution
**Input:** "Run multiple tasks at the same time in my workflow"
**Expected Skill:** mastra
**Key Check:** Parallel workflow pattern

### TC-29: Workflow with Loop
**Input:** "Process an array of items in my workflow"
**Expected Skill:** mastra
**Key Check:** Foreach pattern

### TC-30: Workflow State
**Input:** "How do I pass data between workflow steps?"
**Expected Skill:** mastra
**Key Check:** State management (inputData/return)

### TC-31: Suspend and Resume
**Input:** "Pause my workflow and wait for user input"
**Expected Skill:** mastra
**Key Check:** Suspend/resume mechanism

### TC-32: Workflow Error Recovery
**Input:** "What happens if a step in my workflow fails?"
**Expected Skill:** mastra
**Key Check:** Error handling in workflows

### TC-33: Long-Running Workflow
**Input:** "My workflow takes hours to run, how do I track progress?"
**Expected Skill:** mastra
**Key Check:** Workflow persistence discussion

### TC-34: Workflow Testing
**Input:** "How can I test my workflow without running all steps?"
**Expected Skill:** mastra
**Key Check:** Testing approach

### TC-35: Dynamic Workflow
**Input:** "Build a workflow where steps are determined at runtime"
**Expected Skill:** mastra
**Key Check:** Dynamic step creation

---

## Tools & Integrations (mastra skill)

### TC-36: Custom Tool
**Input:** "Create a tool that calls my internal API"
**Expected Skill:** mastra
**Key Check:** Tool structure (id, description, inputSchema, execute)

### TC-37: Context-Aware Tool
**Input:** "My tool needs access to user session data"
**Expected Skill:** mastra
**Key Check:** Context-aware tool pattern

### TC-38: Suspending Tool
**Input:** "Create a tool that pauses execution for user approval"
**Expected Skill:** mastra
**Key Check:** Uses `suspend` function

### TC-39: Tool Validation
**Input:** "How do I validate inputs to my tool?"
**Expected Skill:** mastra
**Key Check:** Zod schema in inputSchema

### TC-40: Multiple Tools
**Input:** "Give my agent access to several different tools"
**Expected Skill:** mastra
**Key Check:** Multiple tool registration

---

## Storage & Memory (mastra skill)

### TC-41: Postgres Setup
**Input:** "Connect Mastra to my Postgres database"
**Expected Skill:** mastra
**Key Check:** PostgresMemory, connectionString

### TC-42: LibSQL Setup
**Input:** "I want to use Turso for storage"
**Expected Skill:** mastra
**Key Check:** LibSQL storage pattern

### TC-43: Conversation History
**Input:** "Store and retrieve chat history for my agent"
**Expected Skill:** mastra
**Key Check:** Message history pattern

### TC-44: Semantic Memory
**Input:** "Let my agent remember facts and recall them later"
**Expected Skill:** mastra
**Key Check:** memorize/recall methods

### TC-45: Working Memory
**Input:** "Temporary storage during agent execution"
**Expected Skill:** mastra
**Key Check:** Working memory pattern

---

## RAG & Vector Search (mastra skill)

### TC-46: Basic RAG
**Input:** "Build an agent that answers questions from my documents"
**Expected Skill:** mastra
**Key Check:** RAG patterns

### TC-47: Vector Query Tool
**Input:** "Create a tool that searches my vector database"
**Expected Skill:** mastra
**Key Check:** Vector query tool pattern

### TC-48: Graph RAG
**Input:** "Implement knowledge graph RAG with Mastra"
**Expected Skill:** mastra
**Key Check:** Graph RAG pattern

---

## Troubleshooting & Migration (mastra skills)

### TC-49: V1 Migration
**Input:** "I'm upgrading from Mastra v0.1, what changed?"
**Expected Skill:** mastra
**Key Check:** Migration guide reference

### TC-50: API Verification
**Input:** "What parameters does createAgent accept?"
**Expected Skill:** mastra-embedded-docs-look-up
**Key Check:** References embedded docs (node_modules/@mastra/*/dist/docs/)

---

## Usage

### Quick Test (9 samples)
Run: TC-01, TC-02, TC-11, TC-13, TC-16, TC-26, TC-36, TC-41, TC-50

### Full Test (all 50)
Run all test cases above

### Validation Criteria

For each test, check:
1. ✅ **Skill Invoked**: Did agent call Skill tool?
2. ✅ **Correct Skill**: Was the right skill name used?
3. ✅ **Pattern Accuracy**: Does code follow Mastra patterns?
4. ✅ **API Correctness**: No deprecated APIs, correct imports?
5. ✅ **Convention Adherence**: ES2022, provider/name format, etc?

### Success Threshold

- **Critical**: 100% on skill invocation + correct skill name
- **Overall**: ≥95% of tests pass all validation criteria

---

## Test Categories

| Category | Count | Skill |
|----------|-------|-------|
| Setup & Installation | 10 | create-mastra |
| Agent Development | 15 | mastra |
| Workflows | 10 | mastra |
| Tools & Integrations | 5 | mastra |
| Storage & Memory | 5 | mastra |
| RAG & Vector Search | 3 | mastra |
| Troubleshooting | 2 | mastra + embedded-docs-look-up |
| **Total** | **50** | |

---

## Results History

See `test-results-full.md` for detailed test run results.

**Latest:** 100% skill invocation rate (50/50 tests)

---

**Version:** 1.0
**Last Updated:** 2026-01-29
