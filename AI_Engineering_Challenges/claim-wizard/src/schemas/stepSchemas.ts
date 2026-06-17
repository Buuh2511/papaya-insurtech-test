import { z } from 'zod';
import type { ClaimType, UploadedFile } from '../types/wizard';

export const step1Schema = z.object({
  claimType: z.enum(['outpatient', 'inpatient', 'dental'] as const, {
    error: 'Please select a claim type',
  }),
});

export const step2Schema = z.object({
  name: z.string().min(1, 'Full name is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  email: z.string().refine(
    v => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    { message: 'Invalid email address' },
  ),
  phone: z.string().refine(
    v => v === '' || /^0[1-9]\d{8}$/.test(v),
    { message: 'Phone must be 10 digits and start with 0 (e.g. 0901234567)' },
  ),
  isForDependent: z.boolean(),
  dependentId: z.string(),
}).superRefine((data, ctx) => {
  if (data.isForDependent && !data.dependentId) {
    ctx.addIssue({ code: 'custom', message: 'Please select a dependent', path: ['dependentId'] });
  }
});

export const createStep3Schema = (isInpatient: boolean) =>
  z.object({
    diagnosisDescription: z.string().min(1, 'Diagnosis description is required'),
    icd10Code: z.string().min(1, 'Please select an ICD-10 code'),
    icd10Description: z.string(),
    treatmentDateFrom: z.string().min(1, 'Treatment date is required'),
    treatmentDateTo: z.string(),
    providerName: z.string().min(1, 'Provider / hospital name is required'),
    admissionReason: z.string(),
    lengthOfStay: z.number(),
  }).superRefine((data, ctx) => {
    if (isInpatient) {
      if (!data.treatmentDateTo) {
        ctx.addIssue({ code: 'custom', message: 'Discharge date is required', path: ['treatmentDateTo'] });
      }
      if (!data.admissionReason) {
        ctx.addIssue({ code: 'custom', message: 'Admission reason is required', path: ['admissionReason'] });
      }
      if (data.treatmentDateTo && data.treatmentDateFrom && data.treatmentDateTo < data.treatmentDateFrom) {
        ctx.addIssue({ code: 'custom', message: 'Discharge date must be after admission date', path: ['treatmentDateTo'] });
      }
    }
  });

export type Step3FormData = z.infer<ReturnType<typeof createStep3Schema>>;

const uploadedFile = z.custom<UploadedFile | null>();
const requiredUpload = uploadedFile.refine(
  v => v !== null && v.status === 'done',
  'This document is required',
);

export const createStep4Schema = (claimType: ClaimType) =>
  z.object({
    medicalReceipt: claimType !== 'dental' ? requiredUpload : uploadedFile,
    prescription: uploadedFile,
    dischargeSummary: claimType === 'inpatient' ? requiredUpload : uploadedFile,
    itemizedBill: claimType === 'inpatient' ? requiredUpload : uploadedFile,
    dentalReceipt: claimType === 'dental' ? requiredUpload : uploadedFile,
    treatmentPlan: claimType === 'dental' ? requiredUpload : uploadedFile,
  });

export type Step4FormData = z.infer<ReturnType<typeof createStep4Schema>>;

export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
