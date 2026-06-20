# AI Claim Assessment Agent — System Design Writeup

## Overview

This agent performs end-to-end insurance claim assessment using Claude (claude-sonnet-4-6) with tool use. Given a structured claim object, the agent executes four tools in a defined sequence, then produces a human-readable structured report with a final recommendation: **APPROVE**, **REJECT**, or **REQUEST_MORE_INFO**.

---

## System Prompt Design

The system prompt is the backbone of the agent's behavior. Key design decisions:

### 1. Mandatory Sequence Enforcement
The prompt specifies an exact tool call order:
```
1. verifyDocument (all docs) → 2. lookupPolicy → 3. checkMedicalNecessity → 4. calculateBenefit
```
This mirrors the real-world assessor workflow: check what was submitted, understand what the policy says, verify clinical appropriateness, then calculate money. Enforcing the order in the prompt prevents the model from skipping steps or calling tools out of order.

### 2. Hard No-Hallucination Rule
The prompt explicitly states: *"Never invent or assume any policy detail — always call lookupPolicy."* This is reinforced in the tool description itself. Without this, Claude might infer reasonable-sounding policy terms from context and skip the tool call — which would be a critical failure for a financial system.

### 3. REJECT vs REQUEST_MORE_INFO Distinction
This is the most common failure mode in claim assessment. The prompt is explicit: missing or incomplete documents → REQUEST_MORE_INFO (not REJECT). REJECT is reserved only for explicit exclusion clauses or lack of medical necessity. The boundary is clearly defined to prevent the agent from over-rejecting.

### 4. Structured Report Format
The output format is specified as a Markdown template with a fixed 6-section structure. This ensures the report is machine-parseable (recommendation extraction by regex) and human-auditable. Every section maps to a tool's output, making it fully traceable.

---

## Tool Design Decisions

### Tool 1 — `lookupPolicy(policyId)`
Returns the full policy object: benefits, limits per claim type, exclusion clauses (with clause IDs like E-1, E-2), waiting periods, annual limit usage, and the required document list per claim type.

**Key design:** `requiredDocuments` is keyed by `ClaimType`. This allows the agent to cross-reference submitted docs against what's actually required for _this_ specific claim type — not a generic list.

### Tool 2 — `verifyDocument(documentId)`
Returns document type, completeness flag, and an issues array. If the document was never submitted, it returns an explicit `{ error: "not found" }` so the agent can distinguish "submitted but broken" from "never submitted."

**Key design:** The issues array in `DOC-010` (Case 3) includes both an incompleteness issue _and_ a document type mismatch note. This tests the constraint: *"handle the case where a document is submitted but does not match the expected type."*

### Tool 3 — `checkMedicalNecessity(diagnosis, procedures)`
Uses the ICD-10 code (extracted from the first token of the diagnosis string) to look up a curated medical necessity database. Returns a boolean, clinical reasoning, and guideline citations.

**Key design:** Indexed by diagnosis code, not procedure name, because the same procedure (e.g., rhinoplasty) can be medically necessary (post-trauma) or not (cosmetic). The diagnosis code is the authoritative signal. The knowledge base explicitly handles `Z41.1` (cosmetic encounter) as not medically necessary.

### Tool 4 — `calculateBenefit(policyId, claimType, amount)`
Computes `coveredAmount`, `copayAmount`, and `memberResponsibility`. Hard-caps coverage at the remaining annual limit — never returns a covered amount exceeding what the policy allows.

**Key design:** The function maps `OUTPATIENT_SPECIALIST` → `specialist` benefit key internally, handles the `medication` sub-benefit (which has no copay), and always returns `remainingAnnualLimit` so the report can show the post-claim balance.

---

## Test Case Design

### Case 1 — CLM-001 (APPROVE)
**Policy:** POL-001 — Comprehensive Health Plus  
**Claim:** Emergency hospitalization, acute appendicitis, $3,500  
**Design rationale:**
- All 4 required documents (admission form, doctor report, itemized bill, discharge summary) are complete
- $3,500 is well within the $10,000 hospitalization limit
- Waiting period (90 days surgical) was satisfied months before the June 2025 treatment
- `K35.80` (appendicitis) → `checkMedicalNecessity` returns `isNecessary: true`
- Expected: **APPROVE**, insurer covers $3,150 (90%), member pays $350 copay

### Case 2 — CLM-002 (REJECT)
**Policy:** POL-002 — Basic Surgical Plan  
**Claim:** Cosmetic rhinoplasty, $4,500  
**Design rationale:**
- Diagnosis `Z41.1` (cosmetic encounter) is the signal — `checkMedicalNecessity` returns `isNecessary: false`
- Policy clause E-1 explicitly excludes "cosmetic and aesthetic procedures not medically indicated, including rhinoplasty"
- All 3 documents are complete — the rejection is not about missing docs, it's about exclusion
- Tests the constraint: agent must correctly REJECT when exclusion is clear, despite complete documentation
- Expected: **REJECT** citing clause E-1

### Case 3 — CLM-003 (REQUEST_MORE_INFO)
**Policy:** POL-003 — Outpatient & Specialist Care  
**Claim:** Orthopedic specialist visit, chronic lower back pain, $1,150  
**Design rationale:**
- `referral_letter` is never submitted (not in `submittedDocumentIds`) — a completely missing required document
- `DOC-010` (specialist_report) is submitted but incomplete AND has a document type mismatch
- Treatment is medically necessary (M54.5 → `isNecessary: true`) and within coverage period
- Tests the critical rule: missing/incomplete documents → REQUEST_MORE_INFO, not REJECT
- Also tests clause B-7/E-8 (specialist consultations require GP referral letter)
- Expected: **REQUEST_MORE_INFO** citing the missing referral letter and incomplete specialist report

---

## Agent Reasoning Traceability

Every tool call is logged with:
- Tool name and input parameters
- Full output (not truncated)
- ISO timestamp

Logs are saved per-case as `CLM-XXX-tool-calls.md` and combined in `all-tool-call-logs.json`. The report's Policy Citations section maps every decision point back to a specific clause or benefit, so a human auditor can follow the full reasoning chain without re-running the agent.

---

## Project Structure

```
claim-assessment-agent/
├── src/
│   ├── types.ts        — TypeScript interfaces for all data shapes
│   ├── mockData.ts     — Policy, document, and medical necessity data
│   ├── tools.ts        — 4 tool function implementations
│   └── agent.ts        — Claude agent with tool-calling loop
├── test-cases/
│   └── index.ts        — 3 test case definitions with expected outcomes
├── outputs/            — Generated at runtime (gitignored)
│   ├── CLM-001-report.md
│   ├── CLM-001-tool-calls.md
│   ├── CLM-002-report.md
│   ├── CLM-002-tool-calls.md
│   ├── CLM-003-report.md
│   ├── CLM-003-tool-calls.md
│   └── all-tool-call-logs.json
├── main.ts             — Entry point
├── package.json
├── tsconfig.json
└── WRITEUP.md
```

## Running

```bash
# Install dependencies
npm install

# Run all 3 test cases
npm start
```

Requires `ANTHROPIC_API_KEY` in `.env`.
