export type ClaimType = 'outpatient' | 'inpatient' | 'dental';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

export interface Step1Data {
  claimType: ClaimType | null;
}

export interface Step2Data {
  name: string;
  policyNumber: string;
  memberId: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  isForDependent: boolean;
  dependentId: string;
}

export interface Step3Data {
  diagnosisDescription: string;
  icd10Code: string;
  icd10Description: string;
  treatmentDateFrom: string;
  treatmentDateTo: string;
  providerName: string;
  admissionReason: string;
  lengthOfStay: number;
}

export interface Step4Data {
  medicalReceipt: UploadedFile | null;
  prescription: UploadedFile | null;
  dischargeSummary: UploadedFile | null;
  itemizedBill: UploadedFile | null;
  dentalReceipt: UploadedFile | null;
  treatmentPlan: UploadedFile | null;
}

export interface WizardState {
  currentStep: number;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  confirmed: boolean;
}
