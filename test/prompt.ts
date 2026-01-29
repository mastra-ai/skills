/**
 * Mastra Skills Invocation Test Suite
 *
 * Tests whether AI agents properly discover and invoke Mastra skills
 * by spawning independent subagents and measuring actual behavior.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  id: string;
  category: string;
  input: string;
  expectedSkill: string;
}

const testCases: TestCase[] = [
  // Quick Test (9 samples)
  { id: 'TC-01', category: 'setup', input: 'How do I start a new Mastra project?', expectedSkill: 'create-mastra' },
  { id: 'TC-02', category: 'setup', input: 'I have a Next.js app. How do I add Mastra to it?', expectedSkill: 'create-mastra' },
  { id: 'TC-11', category: 'agent', input: 'Create a basic AI agent that can answer questions', expectedSkill: 'mastra' },
  { id: 'TC-13', category: 'agent', input: 'Build an agent that can search the web and check weather', expectedSkill: 'mastra' },
  { id: 'TC-16', category: 'agent', input: 'Create an agent that remembers previous conversations', expectedSkill: 'mastra' },
  { id: 'TC-26', category: 'workflow', input: 'Create a workflow that processes data in steps', expectedSkill: 'mastra' },
  { id: 'TC-36', category: 'tools', input: 'Create a tool that calls my internal API', expectedSkill: 'mastra' },
  { id: 'TC-41', category: 'storage', input: 'Connect Mastra to my Postgres database', expectedSkill: 'mastra' },
  { id: 'TC-50', category: 'api-verification', input: 'What parameters does createAgent accept?', expectedSkill: 'mastra-embedded-docs-look-up' },
];

// ============================================================================
// TEST RESULT TYPES
// ============================================================================

interface TestResult {
  testId: string;
  category: string;
  input: string;
  expectedSkill: string;
  actualSkill: string | null;
  skillInvoked: boolean;
  correctSkill: boolean;
  passed: boolean;
  timestamp: string;
  responseLength: number;
  toolCalls: any[];
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  invocationRate: number;
  correctnessRate: number;
  results: TestResult[];
  timestamp: string;
}

// ============================================================================
// SUBAGENT TESTING
// ============================================================================

/**
 * Tests a single query by spawning a Claude subagent
 *
 * This simulates how a real user would interact with Claude Code:
 * 1. Fresh Claude instance with access to skills
 * 2. User asks a Mastra-related question
 * 3. Observe if Claude invokes the Skill tool
 * 4. Check if correct skill was used
 */
async function testWithSubagent(testCase: TestCase): Promise<TestResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  console.log(`Testing ${testCase.id}: "${testCase.input}"`);

  try {
    // Spawn Claude instance with query
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: testCase.input
      }],
      // Note: Skills would need to be available via tools parameter
      // In Claude Code context, this happens automatically
    });

    // Extract tool calls from response
    const toolCalls = response.content.filter(
      (block: any) => block.type === 'tool_use'
    );

    // Find Skill tool calls
    const skillCalls = toolCalls.filter(
      (call: any) => call.name === 'Skill'
    );

    const skillInvoked = skillCalls.length > 0;
    const actualSkill = skillCalls[0]?.input?.skill || null;
    const correctSkill = actualSkill === testCase.expectedSkill;

    const result: TestResult = {
      testId: testCase.id,
      category: testCase.category,
      input: testCase.input,
      expectedSkill: testCase.expectedSkill,
      actualSkill,
      skillInvoked,
      correctSkill,
      passed: skillInvoked && correctSkill,
      timestamp: new Date().toISOString(),
      responseLength: JSON.stringify(response.content).length,
      toolCalls: toolCalls.map((call: any) => ({
        name: call.name,
        input: call.input
      }))
    };

    console.log(`  ✓ Skill invoked: ${skillInvoked ? actualSkill : 'none'}`);
    console.log(`  ✓ Correct: ${correctSkill ? 'YES' : 'NO'}`);

    return result;

  } catch (error) {
    console.error(`  ✗ Error testing ${testCase.id}:`, error);

    return {
      testId: testCase.id,
      category: testCase.category,
      input: testCase.input,
      expectedSkill: testCase.expectedSkill,
      actualSkill: null,
      skillInvoked: false,
      correctSkill: false,
      passed: false,
      timestamp: new Date().toISOString(),
      responseLength: 0,
      toolCalls: []
    };
  }
}

// ============================================================================
// TEST RUNNER
// ============================================================================

/**
 * Run all tests and generate report
 */
async function runTests(cases: TestCase[] = testCases): Promise<TestSummary> {
  console.log('='.repeat(60));
  console.log('Mastra Skills Invocation Test Suite');
  console.log('='.repeat(60));
  console.log(`Running ${cases.length} test cases...\n`);

  const results: TestResult[] = [];

  // Run tests sequentially (to avoid rate limits)
  for (const testCase of cases) {
    const result = await testWithSubagent(testCase);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Calculate summary statistics
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const invoked = results.filter(r => r.skillInvoked).length;
  const correct = results.filter(r => r.correctSkill).length;

  const summary: TestSummary = {
    totalTests: cases.length,
    passed,
    failed,
    invocationRate: (invoked / cases.length) * 100,
    correctnessRate: (correct / cases.length) * 100,
    results,
    timestamp: new Date().toISOString()
  };

  return summary;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Save test results to snapshot file
 */
function saveSnapshot(summary: TestSummary): void {
  const snapshotPath = path.join(__dirname, 'snapshots.json');

  let snapshots: TestSummary[] = [];

  // Load existing snapshots
  if (fs.existsSync(snapshotPath)) {
    const content = fs.readFileSync(snapshotPath, 'utf-8');
    snapshots = JSON.parse(content);
  }

  // Add new snapshot
  snapshots.push(summary);

  // Save updated snapshots
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshots, null, 2));

  console.log(`\n✓ Snapshot saved to ${snapshotPath}`);
}

/**
 * Print test results to console
 */
function printReport(summary: TestSummary): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests:        ${summary.totalTests}`);
  console.log(`Passed:             ${summary.passed} (${(summary.passed/summary.totalTests*100).toFixed(1)}%)`);
  console.log(`Failed:             ${summary.failed} (${(summary.failed/summary.totalTests*100).toFixed(1)}%)`);
  console.log(`Invocation Rate:    ${summary.invocationRate.toFixed(1)}%`);
  console.log(`Correctness Rate:   ${summary.correctnessRate.toFixed(1)}%`);
  console.log('='.repeat(60));

  // Show failures
  const failures = summary.results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\nFAILURES:');
    failures.forEach(result => {
      console.log(`  ${result.testId}: ${result.input}`);
      console.log(`    Expected: ${result.expectedSkill}`);
      console.log(`    Actual: ${result.actualSkill || 'none'}`);
      console.log(`    Invoked: ${result.skillInvoked ? 'YES' : 'NO'}`);
    });
  }

  console.log('\n✓ Full results saved to snapshots.json');
}

// ============================================================================
// EXECUTION
// ============================================================================

async function main() {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable required');
    }

    // Run tests
    const summary = await runTests();

    // Save and report
    saveSnapshot(summary);
    printReport(summary);

    // Exit with appropriate code
    process.exit(summary.failed === 0 ? 0 : 1);

  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { runTests, testWithSubagent, TestCase, TestResult, TestSummary };
