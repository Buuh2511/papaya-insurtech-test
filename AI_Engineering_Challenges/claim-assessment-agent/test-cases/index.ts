import type { TestCase } from '../src/types.js';

/**
 * Three test cases designed to cover all three possible agent decisions:
 *  - CLM-001: APPROVE  — emergency hospitalization, all docs complete, within limits
 *  - CLM-002: REJECT   — cosmetic surgery explicitly excluded under policy clause E-1
 *  - CLM-003: REQUEST_MORE_INFO — specialist claim missing required referral letter
 */
export const testCases: TestCase[] = [
  {
    claimId: 'CLM-001',
    description:
      'Straightforward approval — emergency hospitalization (appendectomy), all 4 required documents complete, $3,500 well within $10,000 annual limit, medically necessary, coverage period valid.',
    expectedOutcome: 'APPROVE',
    claim: {
      claimId: 'CLM-001',
      policyId: 'POL-001',
      memberId: 'MEM-001',
      claimType: 'HOSPITALIZATION',
      submittedAmount: 3500,
      diagnosis: 'K35.80 Acute appendicitis without abscess',
      diagnosisCode: 'K35.80',
      procedures: ['appendectomy', 'laparoscopic surgery', 'post-operative care'],
      treatmentDateStart: '2025-06-10',
      treatmentDateEnd: '2025-06-13',
      submittedDocumentIds: ['DOC-001', 'DOC-002', 'DOC-003', 'DOC-004'],
    },
  },

  {
    claimId: 'CLM-002',
    description:
      'Rejection — elective cosmetic rhinoplasty (Z41.1), explicitly excluded under clause E-1 of the Basic Surgical Plan, and not medically necessary. All documents are present and complete.',
    expectedOutcome: 'REJECT',
    claim: {
      claimId: 'CLM-002',
      policyId: 'POL-002',
      memberId: 'MEM-002',
      claimType: 'SURGICAL',
      submittedAmount: 4500,
      diagnosis: 'Z41.1 Encounter for cosmetic surgery (rhinoplasty)',
      diagnosisCode: 'Z41.1',
      procedures: ['rhinoplasty', 'nasal reshaping'],
      treatmentDateStart: '2025-06-05',
      submittedDocumentIds: ['DOC-005', 'DOC-006', 'DOC-007'],
    },
  },

  {
    claimId: 'CLM-003',
    description:
      'Request more info — orthopedic specialist visit for chronic low back pain. Referral letter (required by clause B-7 / E-8) is MISSING entirely. Submitted specialist report (DOC-010) is also incomplete with a document type mismatch.',
    expectedOutcome: 'REQUEST_MORE_INFO',
    claim: {
      claimId: 'CLM-003',
      policyId: 'POL-003',
      memberId: 'MEM-003',
      claimType: 'OUTPATIENT_SPECIALIST',
      submittedAmount: 1150,
      diagnosis: 'M54.5 Chronic low back pain',
      diagnosisCode: 'M54.5',
      procedures: ['specialist_consultation', 'mri_scan', 'physiotherapy_referral'],
      treatmentDateStart: '2025-06-15',
      submittedDocumentIds: ['DOC-008', 'DOC-009', 'DOC-010'],
      // NOTE: 'referral_letter' document is NOT in this list — it was never submitted.
    },
  },
];
