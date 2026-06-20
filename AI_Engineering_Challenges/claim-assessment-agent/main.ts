import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { assessClaim } from './src/agent.js';
import { testCases } from './test-cases/index.js';
import type { AssessmentResult, TestCase } from './src/types.js';

const OUTPUTS_DIR = './outputs';

function buildOutputMarkdown(tc: TestCase, result: AssessmentResult): string {
  const passed = result.recommendation === tc.expectedOutcome;
  const statusBadge = passed ? '✅ PASS' : '❌ FAIL';
  const separator = '='.repeat(80);

  return [
    separator,
    `TEST CASE : ${tc.claimId}`,
    `Description : ${tc.description}`,
    `Expected    : ${tc.expectedOutcome}`,
    `Actual      : ${result.recommendation}`,
    `Status      : ${statusBadge}`,
    separator,
    '',
    result.report,
    '',
  ].join('\n');
}

function buildToolLogMarkdown(tc: TestCase, result: AssessmentResult): string {
  const lines: string[] = [
    `# Tool Call Log — ${tc.claimId}`,
    '',
    `**Claim:** ${tc.description}`,
    `**Expected:** ${tc.expectedOutcome} | **Actual:** ${result.recommendation}`,
    '',
    '---',
    '',
  ];

  result.toolCallLogs.forEach((log, idx) => {
    lines.push(`## Call #${idx + 1} — \`${log.tool}\``);
    lines.push(`**Timestamp:** ${log.timestamp}`);
    lines.push('');
    lines.push('**Input:**');
    lines.push('```json');
    lines.push(JSON.stringify(log.input, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('**Output:**');
    lines.push('```json');
    lines.push(JSON.stringify(log.output, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌  GEMINI_API_KEY is not set. Add it to your .env file.');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        Papaya Insurtech — AI Claim Assessment Agent          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const summary: Array<{
    claimId: string;
    expected: string;
    actual: string;
    passed: boolean;
    toolCallCount: number;
  }> = [];

  const allLogs: Record<string, unknown> = {};

  for (const tc of testCases) {
    console.log(`┌─ ${tc.claimId} ─────────────────────────────────────────────`);
    console.log(`│  ${tc.description}`);
    console.log(`│  Expected: ${tc.expectedOutcome}`);
    console.log('│');

    try {
      const result = await assessClaim(tc.claim);
      const passed = result.recommendation === tc.expectedOutcome;

      console.log('│');
      console.log(`│  Result : ${result.recommendation}  ${passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`│  Tools  : ${result.toolCallLogs.length} calls`);
      console.log('└─────────────────────────────────────────────────────────────');
      console.log('');

      // Save full report
      const reportPath = path.join(OUTPUTS_DIR, `${tc.claimId}-report.md`);
      fs.writeFileSync(reportPath, buildOutputMarkdown(tc, result), 'utf8');

      // Save tool call log as markdown
      const logPath = path.join(OUTPUTS_DIR, `${tc.claimId}-tool-calls.md`);
      fs.writeFileSync(logPath, buildToolLogMarkdown(tc, result), 'utf8');

      summary.push({
        claimId: tc.claimId,
        expected: tc.expectedOutcome,
        actual: result.recommendation,
        passed,
        toolCallCount: result.toolCallLogs.length,
      });

      allLogs[tc.claimId] = {
        description: tc.description,
        expectedOutcome: tc.expectedOutcome,
        actualOutcome: result.recommendation,
        passed,
        toolCallLogs: result.toolCallLogs,
      };
    } catch (err) {
      console.error(`└── ❌ Error processing ${tc.claimId}:`, err);
      summary.push({
        claimId: tc.claimId,
        expected: tc.expectedOutcome,
        actual: 'ERROR',
        passed: false,
        toolCallCount: 0,
      });
    }
  }

  // Save combined JSON log
  const combinedLogPath = path.join(OUTPUTS_DIR, 'all-tool-call-logs.json');
  fs.writeFileSync(combinedLogPath, JSON.stringify(allLogs, null, 2), 'utf8');

  // Print summary table
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                       SUMMARY                               ║');
  console.log('╠═══════════╦════════════════════╦════════════════════╦═══════╣');
  console.log('║  Claim ID ║ Expected           ║ Actual             ║ Tools ║');
  console.log('╠═══════════╬════════════════════╬════════════════════╬═══════╣');
  for (const row of summary) {
    const id       = row.claimId.padEnd(9);
    const expected = row.expected.padEnd(18);
    const actual   = (row.passed ? '✅ ' : '❌ ') + row.actual.padEnd(16);
    const tools    = String(row.toolCallCount).padStart(5);
    console.log(`║ ${id} ║ ${expected} ║ ${actual} ║ ${tools} ║`);
  }
  console.log('╚═══════════╩════════════════════╩════════════════════╩═══════╝');

  const passCount = summary.filter(r => r.passed).length;
  console.log('');
  console.log(`Result: ${passCount}/${summary.length} test cases passed`);
  console.log('');
  console.log(`Outputs saved to: ${path.resolve(OUTPUTS_DIR)}/`);
  console.log('  • CLM-001-report.md');
  console.log('  • CLM-001-tool-calls.md');
  console.log('  • CLM-002-report.md');
  console.log('  • CLM-002-tool-calls.md');
  console.log('  • CLM-003-report.md');
  console.log('  • CLM-003-tool-calls.md');
  console.log('  • all-tool-call-logs.json');
  console.log('');
}

main().catch(console.error);
