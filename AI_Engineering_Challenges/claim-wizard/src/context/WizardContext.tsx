import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { WizardState, Step1Data, Step2Data, Step3Data, Step4Data } from '../types/wizard';
import { MOCK_MEMBER } from '../data/mockData';

const initialState: WizardState = {
  currentStep: 1,
  step1: { claimType: null },
  step2: {
    name: MOCK_MEMBER.name,
    policyNumber: MOCK_MEMBER.policyNumber,
    memberId: MOCK_MEMBER.memberId,
    dateOfBirth: MOCK_MEMBER.dateOfBirth,
    email: MOCK_MEMBER.email,
    phone: MOCK_MEMBER.phone,
    isForDependent: false,
    dependentId: '',
  },
  step3: {
    diagnosisDescription: '',
    icd10Code: '',
    icd10Description: '',
    treatmentDateFrom: '',
    treatmentDateTo: '',
    providerName: '',
    admissionReason: '',
    lengthOfStay: 0,
  },
  step4: {
    medicalReceipt: null,
    prescription: null,
    dischargeSummary: null,
    itemizedBill: null,
    dentalReceipt: null,
    treatmentPlan: null,
  },
  confirmed: false,
};

interface WizardContextType {
  state: WizardState;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;
  updateStep4: (data: Partial<Step4Data>) => void;
  setConfirmed: (value: boolean) => void;
  resetWizard: () => void;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  const goToStep = (step: number) =>
    setState(s => ({ ...s, currentStep: step }));

  const nextStep = () =>
    setState(s => ({ ...s, currentStep: Math.min(s.currentStep + 1, 5) }));

  const prevStep = () =>
    setState(s => ({ ...s, currentStep: Math.max(s.currentStep - 1, 1) }));

  const updateStep1 = (data: Partial<Step1Data>) =>
    setState(s => ({ ...s, step1: { ...s.step1, ...data } }));

  const updateStep2 = (data: Partial<Step2Data>) =>
    setState(s => ({ ...s, step2: { ...s.step2, ...data } }));

  const updateStep3 = (data: Partial<Step3Data>) =>
    setState(s => ({ ...s, step3: { ...s.step3, ...data } }));

  const updateStep4 = (data: Partial<Step4Data>) =>
    setState(s => ({ ...s, step4: { ...s.step4, ...data } }));

  const setConfirmed = (value: boolean) =>
    setState(s => ({ ...s, confirmed: value }));

  const resetWizard = () => setState(initialState);

  return (
    <WizardContext.Provider value={{
      state, goToStep, nextStep, prevStep,
      updateStep1, updateStep2, updateStep3, updateStep4,
      setConfirmed, resetWizard,
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}
