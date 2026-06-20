import { policies, documents, medicalNecessityDatabase } from './mockData.js';
import type {
  PolicyData,
  DocumentData,
  MedicalNecessityResult,
  BenefitCalculationResult,
  ClaimType,
} from './types.js';

/**
 * Tool 1 — lookupPolicy
 * Returns full policy terms: benefits, limits, exclusions, copay, waiting periods,
 * and the required document list per claim type.
 */
export function lookupPolicy(policyId: string): PolicyData | { error: string } {
  const policy = policies[policyId];
  if (!policy) {
    return { error: `Policy "${policyId}" not found in the system.` };
  }
  return policy;
}

/**
 * Tool 2 — verifyDocument
 * Returns document type, completeness status, and any issues found.
 * A missing document (not in the system) returns an explicit error so the agent
 * can distinguish "not submitted" from "submitted but incomplete".
 */
export function verifyDocument(documentId: string): DocumentData | { error: string } {
  const doc = documents[documentId];
  if (!doc) {
    return {
      error: `Document "${documentId}" was not received — it is not present in the system.`,
    };
  }
  return doc;
}

/**
 * Tool 3 — checkMedicalNecessity
 * Returns whether the treatment is clinically appropriate for the given diagnosis.
 * Lookup is by ICD-10 diagnosis code extracted from the diagnosis string.
 * Defaults to medically necessary if no explicit override exists in the knowledge base.
 */
export function checkMedicalNecessity(
  diagnosis: string,
  procedures: string[],
): MedicalNecessityResult {
  // Extract the ICD-10 code (first token before any space)
  const diagCode = diagnosis.trim().split(/\s+/)[0];
  const entry = medicalNecessityDatabase[diagCode];

  if (entry) {
    return {
      isNecessary: entry.isNecessary,
      diagnosisCode: diagCode,
      procedures,
      reasoning: entry.reasoning,
      clinicalGuideline: entry.clinicalGuideline,
    };
  }

  // Default: no known contraindication — treat as medically necessary
  return {
    isNecessary: true,
    diagnosisCode: diagCode,
    procedures,
    reasoning: `No contraindication found in the clinical knowledge base for diagnosis ${diagCode}. Treatment appears appropriate based on standard clinical practice.`,
    clinicalGuideline: 'Standard clinical practice guidelines apply',
  };
}

/**
 * Tool 4 — calculateBenefit
 * Computes covered amount, copay, and member responsibility.
 * Caps coverage at the remaining annual limit; never approves amounts exceeding limits.
 */
export function calculateBenefit(
  policyId: string,
  claimType: ClaimType,
  amount: number,
): BenefitCalculationResult | { error: string } {
  const policy = policies[policyId];
  if (!policy) {
    return { error: `Policy "${policyId}" not found.` };
  }

  // Map ClaimType → benefit key in policy.benefits
  const benefitKeyMap: Record<ClaimType, keyof typeof policy.benefits> = {
    HOSPITALIZATION:      'hospitalization',
    OUTPATIENT:           'outpatient',
    SURGICAL:             'surgical',
    OUTPATIENT_SPECIALIST:'specialist',
  };
  const benefitKey = benefitKeyMap[claimType];
  const benefit = policy.benefits[benefitKey];

  if (!benefit || !('copayPercent' in benefit)) {
    return {
      error: `Claim type "${claimType}" has no benefit structure under policy "${policyId}". This benefit is not covered.`,
    };
  }

  const annualLimitUsed = policy.annualLimitUsed[benefitKey] ?? 0;
  const annualLimit = benefit.limit;
  const remainingBeforeClaim = Math.max(0, annualLimit - annualLimitUsed);

  // Coverable = min(submitted, remaining limit)
  const coverableAmount = Math.min(amount, remainingBeforeClaim);
  const copayAmount = Math.round(coverableAmount * (benefit.copayPercent / 100) * 100) / 100;
  const coveredAmount = Math.round((coverableAmount - copayAmount) * 100) / 100;
  const memberResponsibility = Math.round((amount - coveredAmount) * 100) / 100;
  const remainingAfterClaim = Math.max(0, remainingBeforeClaim - coverableAmount);

  const notes: string[] = [];
  if (amount > remainingBeforeClaim) {
    notes.push(
      `Submitted amount $${amount} exceeds remaining annual limit of $${remainingBeforeClaim}. ` +
      `Coverage is capped at $${remainingBeforeClaim} per policy annual benefit limit.`,
    );
  }
  if (remainingBeforeClaim === 0) {
    notes.push(`Annual limit of $${annualLimit} for ${benefitKey} has been fully utilized. No further benefit available.`);
  }

  return {
    claimType,
    submittedAmount: amount,
    applicableLimit: annualLimit,
    coveredAmount,
    copayPercent: benefit.copayPercent,
    copayAmount,
    memberResponsibility,
    annualLimitUsed,
    remainingAnnualLimit: remainingAfterClaim,
    notes: notes.join(' ') || 'Benefit calculation within policy limits.',
  };
}
