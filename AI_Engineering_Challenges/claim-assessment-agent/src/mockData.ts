import type { PolicyData, DocumentData } from './types.js';

// ─── Policy Master Data ────────────────────────────────────────────────────────

export const policies: Record<string, PolicyData> = {

  // Test Case 1 — Comprehensive Health Plus (used for APPROVE case)
  'POL-001': {
    policyId: 'POL-001',
    memberId: 'MEM-001',
    memberName: 'John Smith',
    status: 'ACTIVE',
    coverageStartDate: '2024-01-01',
    coverageEndDate: '2025-12-31',
    planName: 'Comprehensive Health Plus',
    benefits: {
      hospitalization: { limit: 10000, copayPercent: 10 },
      outpatient:      { limit: 500,   copayPercent: 20 },
      surgical:        { limit: 8000,  copayPercent: 10 },
    },
    exclusions: [
      {
        clause: 'E-1',
        description:
          'Cosmetic and aesthetic procedures not medically indicated, including but not limited to rhinoplasty, liposuction, breast augmentation, and facelifts',
      },
      {
        clause: 'E-2',
        description:
          'Pre-existing conditions first diagnosed within 12 months prior to the policy start date',
      },
      {
        clause: 'E-3',
        description:
          'Dental treatment except when directly resulting from accidental injury covered under this policy',
      },
      {
        clause: 'E-4',
        description:
          'Injuries sustained during participation in professional or competitive sports activities',
      },
    ],
    waitingPeriods: [
      { type: 'general_illness', days: 30,  effectiveDate: '2024-01-01' },
      { type: 'surgical',        days: 90,  effectiveDate: '2024-01-01' },
    ],
    annualLimitUsed: { hospitalization: 0, surgical: 0, outpatient: 150 },
    requiredDocuments: {
      HOSPITALIZATION: ['hospital_admission_form', 'doctor_report', 'itemized_bill', 'discharge_summary'],
      SURGICAL:        ['pre_op_assessment', 'doctor_surgical_report', 'itemized_bill', 'discharge_summary'],
      OUTPATIENT:      ['doctor_report', 'itemized_bill', 'prescription'],
    },
  },

  // Test Case 2 — Basic Surgical Plan (used for REJECT case)
  'POL-002': {
    policyId: 'POL-002',
    memberId: 'MEM-002',
    memberName: 'Sarah Johnson',
    status: 'ACTIVE',
    coverageStartDate: '2025-01-01',
    coverageEndDate: '2025-12-31',
    planName: 'Basic Surgical Plan',
    benefits: {
      hospitalization: { limit: 5000, copayPercent: 20 },
      surgical:        { limit: 5000, copayPercent: 20 },
      outpatient:      { limit: 300,  copayPercent: 20 },
    },
    exclusions: [
      {
        clause: 'E-1',
        description:
          'Cosmetic and aesthetic procedures not medically indicated, including rhinoplasty, liposuction, blepharoplasty, and other elective appearance-altering surgeries',
      },
      {
        clause: 'E-4',
        description: 'Injuries resulting from participation in hazardous or professional sports',
      },
      {
        clause: 'E-5',
        description:
          'Cosmetic dental procedures including teeth whitening, veneers, and orthodontics for aesthetic purposes',
      },
      {
        clause: 'E-6',
        description:
          'Mental health and psychiatric treatment except as required by emergency admission',
      },
    ],
    waitingPeriods: [
      { type: 'general_illness', days: 30, effectiveDate: '2025-01-01' },
      { type: 'surgical',        days: 60, effectiveDate: '2025-01-01' },
    ],
    annualLimitUsed: { hospitalization: 0, surgical: 0, outpatient: 0 },
    requiredDocuments: {
      SURGICAL:        ['pre_op_assessment', 'doctor_surgical_report', 'itemized_bill'],
      HOSPITALIZATION: ['hospital_admission_form', 'doctor_report', 'itemized_bill', 'discharge_summary'],
    },
  },

  // Test Case 3 — Outpatient & Specialist Care (used for REQUEST_MORE_INFO case)
  'POL-003': {
    policyId: 'POL-003',
    memberId: 'MEM-003',
    memberName: 'Michael Chen',
    status: 'ACTIVE',
    coverageStartDate: '2025-01-01',
    coverageEndDate: '2025-12-31',
    planName: 'Outpatient & Specialist Care',
    benefits: {
      outpatient: { limit: 500, copayPercent: 15 },
      specialist: { limit: 400, copayPercent: 15, requiresReferral: true },
      medication:  { limit: 200 },
    },
    exclusions: [
      {
        clause: 'E-1',
        description: 'Cosmetic and aesthetic procedures',
      },
      {
        clause: 'E-7',
        description:
          'Experimental or investigational treatments not yet approved by the national medical authority',
      },
      {
        clause: 'E-8',
        description:
          'Specialist consultations without a valid GP referral letter (see benefit clause B-7)',
      },
    ],
    waitingPeriods: [
      { type: 'general_illness', days: 30, effectiveDate: '2025-01-01' },
    ],
    annualLimitUsed: { outpatient: 0, specialist: 0, medication: 0 },
    requiredDocuments: {
      OUTPATIENT_SPECIALIST: ['referral_letter', 'specialist_report', 'itemized_bill', 'prescription'],
      OUTPATIENT:            ['doctor_report', 'itemized_bill'],
    },
  },
};

// ─── Document Master Data ──────────────────────────────────────────────────────

export const documents: Record<string, DocumentData> = {

  // ── CLM-001 (APPROVE) — All documents complete ────────────────────────────

  'DOC-001': {
    documentId: 'DOC-001',
    documentType: 'hospital_admission_form',
    isComplete: true,
    issues: [],
    submissionDate: '2025-06-13',
    notes: 'Admission form for John Smith — admitted 2025-06-10 for acute appendicitis; attending physician: Dr. Nguyen V.T.',
  },
  'DOC-002': {
    documentId: 'DOC-002',
    documentType: 'doctor_report',
    isComplete: true,
    issues: [],
    submissionDate: '2025-06-13',
    notes: 'Surgeon\'s operative report confirming emergency laparoscopic appendectomy performed 2025-06-10. Signed and stamped by Dr. Nguyen V.T., General Surgery.',
  },
  'DOC-003': {
    documentId: 'DOC-003',
    documentType: 'itemized_bill',
    isComplete: true,
    issues: [],
    submissionDate: '2025-06-13',
    notes: 'Itemized hospital bill totaling $3,500: surgical fee $2,000, ward charges (3 nights) $1,200, post-op medication $300.',
  },
  'DOC-004': {
    documentId: 'DOC-004',
    documentType: 'discharge_summary',
    isComplete: true,
    issues: [],
    submissionDate: '2025-06-13',
    notes: 'Discharge summary signed by attending physician; discharge date 2025-06-13; recovery prognosis good; follow-up scheduled in 2 weeks.',
  },

  // ── CLM-002 (REJECT) — All documents complete, but claim is excluded ──────

  'DOC-005': {
    documentId: 'DOC-005',
    documentType: 'pre_op_assessment',
    isComplete: true,
    issues: [],
    submissionDate: '2025-06-04',
    notes: 'Pre-operative assessment for elective rhinoplasty. Patient requests cosmetic nasal reshaping for aesthetic/personal appearance reasons. No documented functional impairment.',
  },
  'DOC-006': {
    documentId: 'DOC-006',
    documentType: 'doctor_surgical_report',
    isComplete: true,
    issues: [],
    submissionDate: '2025-06-05',
    notes: 'Surgical report: rhinoplasty (nasal reshaping) performed for cosmetic and aesthetic purposes. Procedure: CPT 30400. No underlying medical indication (e.g., septal deviation, trauma, obstruction) documented.',
  },
  'DOC-007': {
    documentId: 'DOC-007',
    documentType: 'itemized_bill',
    isComplete: true,
    issues: [],
    submissionDate: '2025-06-05',
    notes: 'Itemized bill: surgeon fee $3,000; anesthesia $800; facility/OR fee $700. Total: $4,500.',
  },

  // ── CLM-003 (REQUEST_MORE_INFO) — Missing & incomplete documents ──────────
  // NOTE: 'referral_letter' is NOT submitted at all for this claim.

  'DOC-008': {
    documentId: 'DOC-008',
    documentType: 'itemized_bill',
    isComplete: true,
    issues: [],
    submissionDate: '2025-06-15',
    notes: 'Itemized bill: specialist consultation fee $650; MRI lumbar spine $300; prescription medications $200. Total: $1,150.',
  },
  'DOC-009': {
    documentId: 'DOC-009',
    documentType: 'prescription',
    isComplete: true,
    issues: [],
    submissionDate: '2025-06-15',
    notes: 'Prescription for Ibuprofen 400mg (30 tablets) and Cyclobenzaprine 5mg (14 tablets), issued by Dr. Tan B.K., Orthopedic Specialist.',
  },
  'DOC-010': {
    documentId: 'DOC-010',
    documentType: 'specialist_report',
    isComplete: false,
    issues: [
      'Missing attending specialist signature — document is unauthenticated',
      'Findings section is incomplete: MRI interpretation and clinical assessment notes are absent',
      'Document type mismatch: submitted as a specialist consultation report but content is an incomplete GP referral draft, not a completed specialist assessment',
    ],
    submissionDate: '2025-06-15',
    notes: 'Partial document — only cover page and patient demographics present; clinical findings and recommendation section are blank.',
  },
};

// ─── Medical Necessity Knowledge Base ─────────────────────────────────────────
// Keyed by ICD-10 diagnosis code for deterministic lookups.

export const medicalNecessityDatabase: Record<
  string,
  { isNecessary: boolean; reasoning: string; clinicalGuideline: string }
> = {
  // Acute appendicitis → appendectomy is standard of care
  'K35.80': {
    isNecessary: true,
    reasoning:
      'Acute appendicitis (K35.80) is a surgical emergency. Appendectomy is the established standard of care to prevent rupture, peritonitis, and sepsis. Emergency surgical intervention is unambiguously medically necessary.',
    clinicalGuideline:
      'WHO Essential Surgery List; SAGES Clinical Guidelines for Appendectomy (2023); WSES Jerusalem Guidelines for Acute Appendicitis',
  },

  // Cosmetic encounter code → no medical necessity
  'Z41.1': {
    isNecessary: false,
    reasoning:
      'ICD-10-CM code Z41.1 denotes "Encounter for procedures for purposes other than remedying health state" — i.e., purely elective or cosmetic interventions. Rhinoplasty performed under this code is aesthetic in nature with no documented medical indication such as airway obstruction, post-traumatic deformity, or congenital defect. Clinical necessity is not established.',
    clinicalGuideline:
      'ICD-10-CM Official Guidelines for Coding and Reporting — Z41.1; AMA CPT Code 30400 (Rhinoplasty) documentation requirements; CMS LCD L33995 — cosmetic procedures do not meet medical necessity criteria',
  },

  // Chronic lower back pain → specialist evaluation and MRI are appropriate
  'M54.5': {
    isNecessary: true,
    reasoning:
      'Chronic lower back pain (M54.5) with insufficient response to primary care warrants specialist evaluation and diagnostic imaging (MRI lumbar spine) to identify structural causes such as disc herniation, spinal stenosis, or nerve root compression. Referral to an orthopedic or spine specialist with MRI is clinically appropriate and consistent with standard chronic pain management protocols.',
    clinicalGuideline:
      'NICE Guidelines NG59 — Low Back Pain and Sciatica in Over 16s (2016); ACP Clinical Practice Guidelines for Non-radicular Low Back Pain (2017); ACR Appropriateness Criteria for Low Back Pain',
  },
};
