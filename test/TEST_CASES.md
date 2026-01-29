# Mastra Skills Test Cases

50 real-world user queries to test if AI agents properly invoke Mastra skills.

---

## Setup & Installation (create-mastra skill)

### TC-01: New Project
**Query:** "how do i get started with mastra?"
**Expected:** create-mastra

### TC-02: Add to Next.js
**Query:** "i already have a nextjs app, how do i add mastra to it?"
**Expected:** create-mastra

### TC-03: Express Integration
**Query:** "does mastra work with express?"
**Expected:** create-mastra

### TC-04: Import Error
**Query:** "getting module not found error when i try to import from @mastra/core, any ideas?"
**Expected:** create-mastra

### TC-05: TypeScript Setup
**Query:** "what typescript config do i need for mastra?"
**Expected:** create-mastra

### TC-06: API Keys
**Query:** "where do i put my openai api key for mastra?"
**Expected:** create-mastra

### TC-07: Simple Script
**Query:** "can i just write a quick script with mastra without setting up a whole project?"
**Expected:** create-mastra

### TC-08: Monorepo
**Query:** "how do i use mastra in a monorepo?"
**Expected:** create-mastra

### TC-09: CLI vs Manual
**Query:** "should i use create-mastra or install manually?"
**Expected:** create-mastra

### TC-10: Deployment
**Query:** "what do i need to do before deploying my mastra app to production?"
**Expected:** create-mastra

---

## Agent Development (mastra skill)

### TC-11: First Agent
**Query:** "how do i make a simple chatbot with mastra?"
**Expected:** mastra

### TC-12: GPT-4
**Query:** "i want to use gpt-4 for my agent, how?"
**Expected:** mastra

### TC-13: Agent with Tools
**Query:** "can my agent use tools to search google and get weather data?"
**Expected:** mastra

### TC-14: Custom System Prompt
**Query:** "how do i make my agent always respond in spanish?"
**Expected:** mastra

### TC-15: Multiple Agents
**Query:** "can i have multiple agents talking to each other?"
**Expected:** mastra

### TC-16: Conversation Memory
**Query:** "my agent forgets everything between messages, how do i fix that?"
**Expected:** mastra

### TC-17: Structured JSON Output
**Query:** "i need my agent to return json in a specific format every time"
**Expected:** mastra

### TC-18: Error Handling
**Query:** "what happens if my agent call fails or times out?"
**Expected:** mastra

### TC-19: Streaming
**Query:** "can i stream the response as the agent generates it?"
**Expected:** mastra

### TC-20: Passing Context
**Query:** "how do i pass user session data to my agent?"
**Expected:** mastra

### TC-21: Testing
**Query:** "what's the best way to test my mastra agents?"
**Expected:** mastra

### TC-22: Cost Tracking
**Query:** "how can i see how much money each agent call costs me?"
**Expected:** mastra

### TC-23: Claude vs GPT
**Query:** "should i use claude or gpt4 for my agent?"
**Expected:** mastra

### TC-24: Local Models
**Query:** "can i use ollama or local llms with mastra?"
**Expected:** mastra

### TC-25: Timeout Issues
**Query:** "my agent keeps timing out after 30 seconds, help!"
**Expected:** mastra

---

## Workflows (mastra skill)

### TC-26: Basic Workflow
**Query:** "how do i chain multiple steps together in mastra?"
**Expected:** mastra

### TC-27: Conditional Branching
**Query:** "i need my workflow to take different paths based on the result"
**Expected:** mastra

### TC-28: Parallel Tasks
**Query:** "can i run multiple workflow steps at the same time?"
**Expected:** mastra

### TC-29: Loop Through Items
**Query:** "how do i process a list of items in my workflow?"
**Expected:** mastra

### TC-30: Passing Data
**Query:** "how do i pass data between workflow steps?"
**Expected:** mastra

### TC-31: Wait for Input
**Query:** "can i pause my workflow and wait for user approval?"
**Expected:** mastra

### TC-32: Error Recovery
**Query:** "what if one of my workflow steps fails?"
**Expected:** mastra

### TC-33: Long-Running Workflow
**Query:** "my workflow takes hours, how do i track progress?"
**Expected:** mastra

### TC-34: Testing Workflows
**Query:** "how can i test my workflow without running everything?"
**Expected:** mastra

### TC-35: Dynamic Steps
**Query:** "can workflow steps be decided at runtime?"
**Expected:** mastra

---

## Tools (mastra skill)

### TC-36: Custom Tool
**Query:** "i want to give my agent a tool that calls my api"
**Expected:** mastra

### TC-37: Tool with Context
**Query:** "my tool needs access to the user's session data"
**Expected:** mastra

### TC-38: Approval Tool
**Query:** "how do i make a tool that asks for permission before running?"
**Expected:** mastra

### TC-39: Input Validation
**Query:** "how do i validate the inputs my tool receives?"
**Expected:** mastra

### TC-40: Multiple Tools
**Query:** "can my agent use like 5 different tools?"
**Expected:** mastra

---

## Storage & Memory (mastra skill)

### TC-41: Postgres
**Query:** "how do i connect mastra to postgres?"
**Expected:** mastra

### TC-42: Turso/LibSQL
**Query:** "i want to use turso database with mastra"
**Expected:** mastra

### TC-43: Chat History
**Query:** "how do i store and load conversation history?"
**Expected:** mastra

### TC-44: Semantic Memory
**Query:** "i want my agent to remember facts and recall them later"
**Expected:** mastra

### TC-45: Temporary Data
**Query:** "where can i store temporary data during agent execution?"
**Expected:** mastra

---

## RAG (mastra skill)

### TC-46: Document Q&A
**Query:** "how do i make an agent that answers questions from my docs?"
**Expected:** mastra

### TC-47: Vector Search Tool
**Query:** "i need a tool that searches my vector database"
**Expected:** mastra

### TC-48: Knowledge Graph
**Query:** "can i do graph rag with mastra?"
**Expected:** mastra

---

## Troubleshooting (mastra / embedded-docs-look-up)

### TC-49: Migration
**Query:** "i'm upgrading from mastra v0.1, what breaking changes are there?"
**Expected:** mastra

### TC-50: API Reference
**Query:** "what are all the parameters for the Agent constructor?"
**Expected:** mastra-embedded-docs-look-up

---

## Format

Each test case follows:
```
Query: Natural user question (lowercase, casual, how real users ask)
Expected: Which skill should be invoked (mastra, create-mastra, or mastra-embedded-docs-look-up)
```

---

## Categories

| Category | Tests | Expected Skill |
|----------|-------|----------------|
| Setup & Installation | TC-01 to TC-10 | create-mastra |
| Agent Development | TC-11 to TC-25 | mastra |
| Workflows | TC-26 to TC-35 | mastra |
| Tools | TC-36 to TC-40 | mastra |
| Storage & Memory | TC-41 to TC-45 | mastra |
| RAG | TC-46 to TC-48 | mastra |
| Troubleshooting | TC-49 to TC-50 | mastra / embedded-docs-look-up |

**Total:** 50 test cases

---

**Last Updated:** 2026-01-29
