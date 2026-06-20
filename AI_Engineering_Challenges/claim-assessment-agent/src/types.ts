export type ClaimType =
  | 'HOSPITALIZATION'
  | 'OUTPATIENT'
  | 'SURGICAL'
  | 'OUTPATIENT_SPECIALIST';

export type RecommendationType = 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO';

export interface ClaimDetails {
  claimId: string;
  policyId: string;
  memberId: string;
  claimType: ClaimType;
  submittedAmount: number;
  diagnosis: string;
  diagnosisCode: string;
  procedures: string[];
  treatmentDateStart: string;
  treatmentDateEnd?: string;
  submittedDocumentIds: string[];
}

export interface BenefitStructure {
  limit: number;
  copayPercent: number;
  requiresReferral?: boolean;
}

export interface PolicyData {
  policyId: string;
  memberId: string;
  memberName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  coverageStartDate: string;
  coverageEndDate: string;
  planName: string;
  benefits: {
    hospitalization?: BenefitStructure;
    outpatient?: BenefitStructure;
    surgical?: BenefitStructure;
    specialist?: BenefitStructure;
    medication?: { limit: number };
  };
  exclusions: Array<{ clause: string; description: string }>;
  waitingPeriods: Array<{ type: string; days: number; effectiveDate: string }>;
  annualLimitUsed: Record<string, number>;
  requiredDocuments: Partial<Record<ClaimType, string[]>>;
}

export interface DocumentData {
  documentId: string;
  documentType: string;
  isComplete: boolean;
  issues: string[];
  submissionDate: string;
  notes?: string;
}

export interface MedicalNecessityResult {
  isNecessary: boolean;
  diagnosisCode: string;
  procedures: string[];
  reasoning: string;
  clinicalGuideline: string;
}

export interface BenefitCalculationResult {
  claimType: string;
  submittedAmount: number;
  applicableLimit: number;
  coveredAmount: number;
  copayPercent: number;
  copayAmount: number;
  memberResponsibility: number;
  annualLimitUsed: number;
  remainingAnnualLimit: number;
  notes: string;
}

export interface ToolCallLog {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: string;
}

export interface AssessmentResult {
  claimId: string;
  recommendation: RecommendationType;
  report: string;
  toolCallLogs: ToolCallLog[];
}

export interface TestCase {
  claimId: string;
  description: string;
  expectedOutcome: RecommendationType;
  claim: ClaimDetails;
}
