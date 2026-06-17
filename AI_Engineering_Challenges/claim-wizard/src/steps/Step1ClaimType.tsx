import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWizard } from '../context/WizardContext';
import { step1Schema, type Step1FormData } from '../schemas/stepSchemas';
import type { ClaimType } from '../types/wizard';
import Button from '../components/ui/Button';

const CLAIM_TYPES: { type: ClaimType; label: string; description: string; icon: string }[] = [
  {
    type: 'outpatient',
    label: 'Outpatient',
    description: "Doctor visits and treatments that don't require overnight hospital stay.",
    icon: '🏥',
  },
  {
    type: 'inpatient',
    label: 'Inpatient',
    description: 'Hospital admissions requiring overnight stays, surgeries, or extended care.',
    icon: '🛏️',
  },
  {
    type: 'dental',
    label: 'Dental',
    description: 'Dental treatments including check-ups, fillings, extractions, and major dental work.',
    icon: '🦷',
  },
];

export default function Step1ClaimType() {
  const { state, updateStep1, nextStep } = useWizard();

  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: { claimType: state.step1.claimType ?? undefined },
  });

  const selected = useWatch({ control, name: 'claimType' });

  const onSubmit = (data: Step1FormData) => {
    updateStep1({ claimType: data.claimType });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="step-page">
      <div className="step-page-header">
        <h2 className="step-page-title">Select Claim Type</h2>
        <p className="step-page-subtitle">Choose the type of medical claim you want to submit.</p>
      </div>

      <div className="space-y-4" role="radiogroup" aria-label="Claim type">
        {CLAIM_TYPES.map(ct => (
          <div
            key={ct.type}
            role="radio"
            aria-checked={selected === ct.type}
            tabIndex={0}
            onClick={() => setValue('claimType', ct.type, { shouldValidate: true })}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setValue('claimType', ct.type, { shouldValidate: true });
              }
            }}
            className={[
              'p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4',
              'outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
              selected === ct.type
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
            ].join(' ')}
          >
            <span className="text-3xl mt-0.5">{ct.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-lg">{ct.label}</span>
                <span
                  className={[
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    selected === ct.type ? 'border-blue-500' : 'border-slate-300',
                  ].join(' ')}
                >
                  {selected === ct.type && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" />
                  )}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{ct.description}</p>
            </div>
          </div>
        ))}
      </div>

      {errors.claimType && <p className="form-error mt-3">{errors.claimType.message}</p>}

      <div className="step-nav justify-end">
        <Button type="submit" variant="primary">
          Continue →
        </Button>
      </div>
    </form>
  );
}
