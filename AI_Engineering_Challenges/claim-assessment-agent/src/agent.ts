import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Tool, Part } from "@google/generative-ai";
import {
  lookupPolicy,
  verifyDocument,
  checkMedicalNecessity,
  calculateBenefit,
} from "./tools.js";
import type {
  ClaimDetails,
  ClaimType,
  ToolCallLog,
  AssessmentResult,
} from "./types.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── Tool Definitions (Gemini FunctionDeclaration format) ─────────────────────

const TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "verifyDocument",
        description:
          "Verifies a submitted document by its ID. Returns the document type, completeness status, and a list of any issues found. Must be called for EVERY document ID in the submitted documents list — do not skip any.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            documentId: {
              type: SchemaType.STRING,
              description: "The unique document identifier (e.g., DOC-001)",
            },
          },
          required: ["documentId"],
        },
      },
      {
        name: "lookupPolicy",
        description:
          "Retrieves full policy terms for a given policy ID: benefits (types, limits, copay %), exclusion clauses, waiting periods, annual limit usage, and the required documents list per claim type. Must be called before any coverage determination. Never invent policy terms — always call this tool.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            policyId: {
              type: SchemaType.STRING,
              description: "The unique policy identifier (e.g., POL-001)",
            },
          },
          required: ["policyId"],
        },
      },
      {
        name: "checkMedicalNecessity",
        description:
          "Checks whether the treatment is clinically appropriate for the given diagnosis. Returns a medical necessity determination, clinical reasoning, and the relevant guideline reference.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            diagnosis: {
              type: SchemaType.STRING,
              description:
                'Diagnosis string including ICD-10 code, e.g. "K35.80 Acute appendicitis"',
            },
            procedures: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description:
                'List of procedures performed, e.g. ["appendectomy", "laparoscopic surgery"]',
            },
          },
          required: ["diagnosis", "procedures"],
        },
      },
      {
        name: "calculateBenefit",
        description:
          "Calculates the insurer-covered amount, copay, and member responsibility based on policy terms and submitted amount. Caps coverage at the remaining annual benefit limit.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            policyId: {
              type: SchemaType.STRING,
              description: "The unique policy identifier",
            },
            claimType: {
              type: SchemaType.STRING,
              description:
                "The type of claim: HOSPITALIZATION, OUTPATIENT, SURGICAL, or OUTPATIENT_SPECIALIST",
            },
            amount: {
              type: SchemaType.NUMBER,
              description: "Total submitted claim amount in USD",
            },
          },
          required: ["policyId", "claimType", "amount"],
        },
      },
    ],
  },
];

// ─── System Prompt ─────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

const SYSTEM_PROMPT = `You are an expert insurance claim assessor for Papaya Insurtech. Your role is to perform a thorough, objective, and fully traceable assessment of insurance claims using the tools provided.

## MANDATORY ASSESSMENT SEQUENCE
You MUST follow this exact order — no skipping, no reordering:

1. Call verifyDocument() for EVERY document ID in the claim's submitted documents list. Check each one individually.
2. Call lookupPolicy() to retrieve all policy terms. NEVER invent or assume any policy detail — always use this tool.
3. Call checkMedicalNecessity() to determine clinical appropriateness of the treatment.
4. Call calculateBenefit() to compute covered amounts, copay, and member responsibility.

## DECISION RULES

**APPROVE** — all of the following must be true:
- All required documents are submitted and complete
- Policy is ACTIVE and claim falls within the coverage period
- Claim type is not excluded under any policy clause
- Treatment is medically necessary
- Submitted amount does not exceed the remaining annual benefit limit
- All applicable waiting periods have been satisfied before the treatment date

**REJECT** — only when:
- The claim type is explicitly excluded by a named policy clause (cite it), OR
- The treatment is not medically necessary and no clinical justification exists

**REQUEST_MORE_INFO** — when:
- Any required document is MISSING (not submitted at all), OR
- Any submitted document is INCOMPLETE or has issues
- Do NOT reject for document issues — always request them first

## CRITICAL RULES
- Never hallucinate policy terms. Always call lookupPolicy and cite the exact clause.
- Never approve amounts exceeding the remaining annual benefit limit.
- Verify that the treatment dates fall within the policy coverage period.
- Verify that waiting periods are satisfied (waiting period end date < treatment start date).
- Cross-reference submitted documents against the requiredDocuments list from lookupPolicy for the specific claim type. Identify any that are missing entirely.
- If a document's type does not match what is expected, flag it as an issue.

## OUTPUT FORMAT
After all tool calls are complete, write the assessment report in EXACTLY this structure:

---
# CLAIM ASSESSMENT REPORT

**Claim ID:** [id]
**Assessment Date:** ${TODAY}
**Assessor:** AI Claim Assessment Agent (Gemini)

---

## 1. Document Review

| Document ID | Expected Type | Submitted Type | Status | Issues |
|-------------|---------------|----------------|--------|--------|
[One row per required document — include MISSING ones with status MISSING]

**Document Summary:** [X of Y required documents are complete/present. State what is missing or incomplete.]

---

## 2. Policy Verification

- **Policy ID:** [id]
- **Plan Name:** [name]
- **Status:** [ACTIVE / EXPIRED / SUSPENDED]
- **Coverage Period:** [start] to [end]
- **Treatment Date(s):** [date(s)] — [within / outside] coverage period
- **Member:** [name] ([memberId])
- **Claim Type Coverage:** [covered / not covered] — [cite clause or benefit]
- **Applicable Waiting Period:** [type, N days, effective date — satisfied / not satisfied as of treatment date]
- **Annual Limit Status:** [$used of $total used before this claim]

---

## 3. Medical Necessity

- **Diagnosis:** [full diagnosis with code]
- **Procedures:** [list]
- **Determination:** [MEDICALLY NECESSARY / NOT MEDICALLY NECESSARY]
- **Clinical Reasoning:** [reasoning from tool]
- **Guideline Reference:** [guideline from tool]

---

## 4. Benefit Calculation

| Item | Amount |
|------|--------|
| Submitted Amount | $[x] |
| Policy Annual Limit (benefit type) | $[x] |
| Annual Limit Used (prior) | $[x] |
| Remaining Annual Limit | $[x] |
| Coverable Amount | $[x] |
| Copay Rate | [x]% |
| Copay Amount | $[x] |
| **Insurer Covers** | **$[x]** |
| **Member Responsibility** | **$[x]** |

---

## 5. Recommendation

### Decision: APPROVE
*or*
### Decision: REJECT
*or*
### Decision: REQUEST_MORE_INFO

**Reasoning:**
1. [Specific reason 1]
2. [Specific reason 2]

---

## 6. Policy Citations

- **Clause [X]:** "[exact description]" — [how it applies to this decision]
- **Benefit [Y]:** [benefit type, limit, copay] — [how it applies]

---`;

// ─── Tool Executor ─────────────────────────────────────────────────────────────

function executeTool(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case "lookupPolicy":
      return lookupPolicy(args.policyId as string);
    case "verifyDocument":
      return verifyDocument(args.documentId as string);
    case "checkMedicalNecessity":
      return checkMedicalNecessity(
        args.diagnosis as string,
        args.procedures as string[],
      );
    case "calculateBenefit":
      return calculateBenefit(
        args.policyId as string,
        args.claimType as ClaimType,
        args.amount as number,
      );
    default:
      return { error: `Unknown tool: "${name}"` };
  }
}

// ─── Rate-limit retry helper ───────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryDelay(error: unknown): number {
  try {
    const msg = (error as Error).message ?? "";
    const match = msg.match(/retry in ([\d.]+)s/i);
    if (match) return Math.ceil(parseFloat(match[1])) + 2;
  } catch {
    /* ignore */
  }
  return 65;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendWithRetry(
  chat: any,
  message: string | Part[],
  maxRetries = 6,
): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await chat.sendMessage(message);
    } catch (err) {
      const isRateLimit = err instanceof Error && err.message.includes("429");
      if (isRateLimit && attempt < maxRetries) {
        const wait = extractRetryDelay(err);
        console.log(
          `  [RATE LIMIT] Waiting ${wait}s before retry (attempt ${attempt + 1}/${maxRetries})...`,
        );
        await sleep(wait * 1000);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

// ─── Agent Loop ────────────────────────────────────────────────────────────────

export async function assessClaim(
  claim: ClaimDetails,
): Promise<AssessmentResult> {
  const toolCallLogs: ToolCallLog[] = [];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    systemInstruction: SYSTEM_PROMPT,
    tools: TOOLS,
  });

  const chat = model.startChat({ history: [] });

  const userMessage =
    `Please assess the following insurance claim and produce a structured assessment report.\n\n` +
    `\`\`\`json\n${JSON.stringify(claim, null, 2)}\n\`\`\``;

  let response = await sendWithRetry(chat, userMessage);

  const MAX_ITERATIONS = 20;
  let finalReport = "";

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const candidate = response.response.candidates?.[0];
    if (!candidate) break;

    const parts = candidate.content?.parts ?? [];
    const functionCallParts = parts.filter((p: Part) => p.functionCall);

    // No more function calls — extract final text
    if (functionCallParts.length === 0) {
      finalReport = response.response.text();
      break;
    }

    // Execute all function calls in this turn
    const functionResponseParts: Part[] = [];

    for (const part of functionCallParts) {
      if (!part.functionCall) continue;

      const { name, args } = part.functionCall;
      const toolArgs = (args ?? {}) as Record<string, unknown>;
      const toolOutput = executeTool(name, toolArgs);

      const log: ToolCallLog = {
        tool: name,
        input: toolArgs,
        output: toolOutput,
        timestamp: new Date().toISOString(),
      };
      toolCallLogs.push(log);

      console.log(
        `  [TOOL #${toolCallLogs.length}] ${name}(${JSON.stringify(toolArgs)})`,
      );
      const outputStr = JSON.stringify(toolOutput);
      console.log(
        `           → ${outputStr.slice(0, 120)}${outputStr.length > 120 ? "..." : ""}`,
      );

      functionResponseParts.push({
        functionResponse: {
          name,
          response: { output: toolOutput },
        },
      });
    }

    // Send function results back to the model
    response = await sendWithRetry(chat, functionResponseParts);
  }

  const recommendation = extractRecommendation(finalReport);

  return {
    claimId: claim.claimId,
    recommendation,
    report: finalReport,
    toolCallLogs,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractRecommendation(
  report: string,
): "APPROVE" | "REJECT" | "REQUEST_MORE_INFO" {
  if (/Decision:\s*APPROVE/i.test(report)) return "APPROVE";
  if (/Decision:\s*REJECT/i.test(report)) return "REJECT";
  if (/Decision:\s*REQUEST_MORE_INFO/i.test(report)) return "REQUEST_MORE_INFO";

  if (/\bAPPROVE\b/.test(report)) return "APPROVE";
  if (/\bREJECT\b/.test(report)) return "REJECT";
  if (/\bREQUEST_MORE_INFO\b/.test(report)) return "REQUEST_MORE_INFO";

  return "REQUEST_MORE_INFO";
}
