import { useState } from 'react';
import { useWizard } from '../context/WizardContext';
import { MOCK_DEPENDENTS } from '../data/mockData';
import type { Step4FormData } from '../schemas/stepSchemas';
import Button from '../components/ui/Button';

type DocKey = keyof Step4FormData;

const DOC_LABELS: Record<DocKey, string> = {
  medicalReceipt:   'Medical Receipt',
  prescription:     'Prescription',
  dischargeSummary: 'Discharge Summary',
  itemizedBill:     'Itemized Bill',
  dentalReceipt:    'Dental Receipt',
  treatmentPlan:    'Treatment Plan',
};

const CLAIM_TYPE_LABELS = { outpatient: 'Outpatient', inpatient: 'Inpatient', dental: 'Dental' };

const CLAIM_TYPE_COLOR: Record<string, string> = {
  outpatient: 'bg-green-100 text-green-700',
  inpatient:  'bg-purple-100 text-purple-700',
  dental:     'bg-orange-100 text-orange-700',
};

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                     rounded px-1 py-0.5"
        >
          Edit
        </button>
      </div>
      <div className="card-body divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      {/* Mobile: label on top, value below. Desktop: side by side */}
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5 sm:hidden">
        {label}
      </p>
      <div className="flex items-start gap-4">
        <span className="hidden sm:block text-sm text-slate-500 min-w-36 shrink-0">{label}</span>
        <span className="text-sm text-slate-800 font-medium">
          {value || <span className="text-slate-400 italic font-normal">—</span>}
        </span>
      </div>
    </div>
  );
}

export default function Step5Review() {
  const { state, goToStep, prevStep, setConfirmed, resetWizard } = useWizard();
  const { step1, step2, step3, step4, confirmed } = state;
  const claimType = step1.claimType!;
  const isInpatient = claimType === 'inpatient';

  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [confirmError, setConfirmError] = useState(false);

  const dependent = step2.isForDependent
    ? MOCK_DEPENDENTS.find(d => d.id === step2.dependentId)
    : null;

  const uploadedDocs = (Object.entries(step4) as [DocKey, Step4FormData[DocKey]][]).filter(
    ([, f]) => f && f.status === 'done',
  );

  const handleSubmit = () => {
    if (!confirmed) { setConfirmError(true); return; }

    const id = `CLM-${Date.now().toString().slice(-8)}`;

    const payload = {
      submittedAt: new Date().toISOString(),
      referenceId: id,
      claimType,
      member: {
        name: step2.name,
        policyNumber: step2.policyNumber,
        memberId: step2.memberId,
        dateOfBirth: step2.dateOfBirth,
        email: step2.email || null,
        phone: step2.phone || null,
        claimForDependent: step2.isForDependent,
        dependent: dependent
          ? {
              id: dependent.id,
              name: dependent.name,
              relationship: dependent.relationship,
              dateOfBirth: dependent.dateOfBirth,
            }
          : null,
      },
      diagnosis: {
        description: step3.diagnosisDescription,
        icd10: { code: step3.icd10Code, description: step3.icd10Description },
        treatmentDate: step3.treatmentDateFrom,
        ...(isInpatient && {
          dischargeDate: step3.treatmentDateTo,
          lengthOfStayDays: step3.lengthOfStay,
          admissionReason: step3.admissionReason,
        }),
        providerName: step3.providerName,
      },
      documents: uploadedDocs.map(([key, file]) => ({
        type: key,
        label: DOC_LABELS[key],
        filename: file!.name,
        sizeBytes: file!.size,
        mimeType: file!.file.type,
      })),
    };

    console.log('╔══════════════════════════════════╗');
    console.log('║    CLAIM SUBMISSION PAYLOAD       ║');
    console.log('╚══════════════════════════════════╝');
    console.log(JSON.stringify(payload, null, 2));

    setRefId(id);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-sm mx-auto text-center py-12 sm:py-16 px-4">
        <div className="animate-success-pop w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="animate-success-content">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Claim Submitted!</h2>
          <p className="text-slate-500 mb-1">Your claim has been received and is being processed.</p>
          <p className="text-sm text-slate-400 mb-8">
            Reference:{' '}
            <span className="font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {refId}
            </span>
          </p>
          <Button variant="primary" onClick={resetWizard} className="w-full sm:w-auto">
            Submit Another Claim
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="step-page">
      <div className="step-page-header">
        <h2 className="step-page-title">Review & Submit</h2>
        <p className="step-page-subtitle">Please review all information before submitting.</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <Section title="Claim Type" onEdit={() => goToStep(1)}>
          <Row label="Type" value={
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${CLAIM_TYPE_COLOR[claimType]}`}>
              {CLAIM_TYPE_LABELS[claimType]}
            </span>
          } />
        </Section>

        <Section title="Member & Policy Information" onEdit={() => goToStep(2)}>
          <Row label="Full Name"     value={step2.name} />
          <Row label="Policy Number" value={step2.policyNumber} />
          <Row label="Member ID"     value={step2.memberId} />
          <Row label="Date of Birth" value={step2.dateOfBirth} />
          <Row label="Email"         value={step2.email} />
          <Row label="Phone"         value={step2.phone} />
          {step2.isForDependent && (
            <Row label="Claim For" value={dependent ? `${dependent.name} (${dependent.relationship})` : 'Dependent'} />
          )}
        </Section>

        <Section title="Diagnosis & Treatment" onEdit={() => goToStep(3)}>
          <Row label="Diagnosis"  value={step3.diagnosisDescription} />
          <Row label="ICD-10"     value={step3.icd10Code ? `${step3.icd10Code} — ${step3.icd10Description}` : ''} />
          <Row label={isInpatient ? 'Admission Date' : 'Treatment Date'} value={step3.treatmentDateFrom} />
          {isInpatient && <Row label="Discharge Date"   value={step3.treatmentDateTo} />}
          {isInpatient && <Row label="Length of Stay"   value={`${step3.lengthOfStay} day${step3.lengthOfStay !== 1 ? 's' : ''}`} />}
          {isInpatient && <Row label="Admission Reason" value={step3.admissionReason} />}
          <Row label="Provider"   value={step3.providerName} />
        </Section>

        <Section title="Documents" onEdit={() => goToStep(4)}>
          {uploadedDocs.length > 0 ? (
            uploadedDocs.map(([key, file]) => (
              <div key={key} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
                </svg>
                <span className="text-sm text-slate-700 shrink-0">{DOC_LABELS[key]}</span>
                <span className="text-xs text-slate-400 truncate min-w-0">{file!.name}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 italic py-1">No documents uploaded</p>
          )}
        </Section>
      </div>

      {/* Confirmation */}
      <div className={`mt-4 sm:mt-6 p-4 rounded-xl border-2 transition-colors ${confirmError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => {
              setConfirmed(e.target.checked);
              if (e.target.checked) setConfirmError(false);
            }}
            className="w-4 h-4 mt-0.5 rounded accent-blue-600 cursor-pointer shrink-0"
          />
          <span className="text-sm text-slate-700">
            I confirm that all information provided is accurate and complete to the best of my knowledge.
          </span>
        </label>
        {confirmError && <p className="mt-2 text-xs text-red-500 ml-7">You must confirm before submitting.</p>}
      </div>

      <div className="step-nav">
        <Button type="button" variant="secondary" onClick={prevStep}>← Back</Button>
        <Button type="button" variant="success" onClick={handleSubmit}>Submit Claim ✓</Button>
      </div>
    </div>
  );
}
