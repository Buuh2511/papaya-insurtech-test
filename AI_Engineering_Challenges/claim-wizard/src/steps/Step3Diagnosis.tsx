import { useMemo, useState } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWizard } from '../context/WizardContext';
import { createStep3Schema, type Step3FormData } from '../schemas/stepSchemas';
import { ICD10_CODES, MOCK_PROVIDERS } from '../data/mockData';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import Autocomplete from '../components/ui/Autocomplete';

const ICD10_OPTIONS = ICD10_CODES.map(c => ({ value: c.code, label: c.description, badge: c.code }));
const PROVIDER_OPTIONS = MOCK_PROVIDERS.map(p => ({ value: p, label: p }));

export default function Step3Diagnosis() {
  const { state, updateStep3, nextStep, prevStep } = useWizard();
  const isInpatient = state.step1.claimType === 'inpatient';

  const schema = useMemo(() => createStep3Schema(isInpatient), [isInpatient]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step3FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...state.step3,
      treatmentDateTo: state.step3.treatmentDateTo ?? '',
      admissionReason: state.step3.admissionReason ?? '',
    },
  });

  const dateFrom = useWatch({ control, name: 'treatmentDateFrom' });
  const dateTo = useWatch({ control, name: 'treatmentDateTo' });

  const lengthOfStay = useMemo(() => {
    if (!dateFrom || !dateTo) return 0;
    const diff = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }, [dateFrom, dateTo]);

  // Separate display state for autocomplete inputs (shows "CODE — Label" while field stores just the code)
  const [icd10Text, setIcd10Text] = useState(
    state.step3.icd10Code ? `${state.step3.icd10Code} — ${state.step3.icd10Description}` : '',
  );
  const [providerText, setProviderText] = useState(state.step3.providerName);

  const onSubmit = (data: Step3FormData) => {
    updateStep3({ ...data, lengthOfStay });
    nextStep();
  };

  return (
    <div className="step-page">
      <div className="step-page-header">
        <h2 className="step-page-title">Diagnosis & Treatment</h2>
        <p className="step-page-subtitle">Provide details about the medical condition and treatment received.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card card-body space-y-5">
          {/* Diagnosis description */}
          <FormField
            label="Diagnosis Description"
            required
            htmlFor="diagnosisDescription"
            error={errors.diagnosisDescription?.message}
          >
            <Textarea
              id="diagnosisDescription"
              rows={3}
              placeholder="Describe the diagnosis or symptoms..."
              error={!!errors.diagnosisDescription}
              {...register('diagnosisDescription')}
            />
          </FormField>

          {/* ICD-10 autocomplete — Controller stores the code; display text is local state */}
          <Controller
            name="icd10Code"
            control={control}
            render={({ field }) => (
              <FormField label="ICD-10 Code" required htmlFor="icd10" error={errors.icd10Code?.message}>
                <Autocomplete
                  id="icd10"
                  inputValue={icd10Text}
                  onInputChange={text => {
                    setIcd10Text(text);
                    field.onChange(''); // clear code when user types freely
                  }}
                  onSelect={opt => {
                    setIcd10Text(`${opt.badge ?? opt.value} — ${opt.label}`);
                    field.onChange(opt.value);
                    setValue('icd10Description', opt.label);
                  }}
                  options={ICD10_OPTIONS}
                  placeholder="Search by code or description (e.g. J45, Asthma)..."
                  error={!!errors.icd10Code}
                />
              </FormField>
            )}
          />

          {/* Treatment dates */}
          <div className={`grid gap-5 ${isInpatient ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <FormField
              label={isInpatient ? 'Admission Date' : 'Treatment Date'}
              required
              htmlFor="treatmentDateFrom"
              error={errors.treatmentDateFrom?.message}
            >
              <Input
                id="treatmentDateFrom"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                error={!!errors.treatmentDateFrom}
                {...register('treatmentDateFrom')}
              />
            </FormField>

            {isInpatient && (
              <FormField
                label="Discharge Date"
                required
                htmlFor="treatmentDateTo"
                error={errors.treatmentDateTo?.message}
              >
                <Input
                  id="treatmentDateTo"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  error={!!errors.treatmentDateTo}
                  {...register('treatmentDateTo')}
                />
              </FormField>
            )}
          </div>

          {isInpatient && lengthOfStay > 0 && (
            <div className="info-banner">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Length of stay: <strong>{lengthOfStay} day{lengthOfStay !== 1 ? 's' : ''}</strong>
            </div>
          )}

          {/* Provider autocomplete — field value IS the display string */}
          <Controller
            name="providerName"
            control={control}
            render={({ field }) => (
              <FormField
                label="Hospital / Provider Name"
                required
                htmlFor="providerName"
                error={errors.providerName?.message}
              >
                <Autocomplete
                  id="providerName"
                  inputValue={providerText}
                  onInputChange={text => {
                    setProviderText(text);
                    field.onChange(text);
                  }}
                  onSelect={opt => {
                    setProviderText(opt.label);
                    field.onChange(opt.value);
                  }}
                  options={PROVIDER_OPTIONS}
                  placeholder="Type hospital or clinic name..."
                  error={!!errors.providerName}
                />
              </FormField>
            )}
          />

          {/* Inpatient only: admission reason */}
          {isInpatient && (
            <FormField
              label="Reason for Admission"
              required
              htmlFor="admissionReason"
              error={errors.admissionReason?.message}
            >
              <Textarea
                id="admissionReason"
                rows={2}
                placeholder="Describe the reason for hospital admission..."
                error={!!errors.admissionReason}
                {...register('admissionReason')}
              />
            </FormField>
          )}
        </div>

        <div className="step-nav">
          <Button type="button" variant="secondary" onClick={prevStep}>← Back</Button>
          <Button type="submit" variant="primary">Continue →</Button>
        </div>
      </form>
    </div>
  );
}
