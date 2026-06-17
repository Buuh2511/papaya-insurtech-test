import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWizard } from '../context/WizardContext';
import { step2Schema, type Step2FormData } from '../schemas/stepSchemas';
import { MOCK_DEPENDENTS } from '../data/mockData';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

export default function Step2MemberInfo() {
  const { state, updateStep2, nextStep, prevStep } = useWizard();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: state.step2,
  });

  const isForDependent = useWatch({ control, name: 'isForDependent' });

  // Intercept onChange to strip non-digit characters before RHF processes the value
  const { onChange: phoneOnChange, ...phoneRest } = register('phone');

  const onSubmit = (data: Step2FormData) => {
    updateStep2(data);
    nextStep();
  };

  return (
    <div className="step-page">
      <div className="step-page-header">
        <h2 className="step-page-title">Member & Policy Information</h2>
        <p className="step-page-subtitle">Verify your details — fields are pre-filled and can be edited.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card card-body space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Full Name" required htmlFor="name" error={errors.name?.message}>
              <Input id="name" error={!!errors.name} {...register('name')} />
            </FormField>

            <FormField label="Policy Number" required htmlFor="policyNumber" error={errors.policyNumber?.message}>
              <Input id="policyNumber" error={!!errors.policyNumber} {...register('policyNumber')} />
            </FormField>

            <FormField label="Member ID" required htmlFor="memberId" error={errors.memberId?.message}>
              <Input id="memberId" error={!!errors.memberId} {...register('memberId')} />
            </FormField>

            <FormField label="Date of Birth" required htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
              <Input id="dateOfBirth" type="date" error={!!errors.dateOfBirth} {...register('dateOfBirth')} />
            </FormField>

            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" placeholder="you@email.com" error={!!errors.email} {...register('email')} />
            </FormField>

            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="0900000000"
                error={!!errors.phone}
                {...phoneRest}
                onChange={e => {
                  e.target.value = e.target.value.replace(/\D/g, '');
                  phoneOnChange(e);
                }}
              />
            </FormField>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                {...register('isForDependent')}
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                This claim is for a dependent
              </span>
            </label>

            {isForDependent && (
              <div className="mt-4">
                <FormField
                  label="Select Dependent"
                  required
                  htmlFor="dependentId"
                  error={errors.dependentId?.message}
                >
                  <Select id="dependentId" error={!!errors.dependentId} {...register('dependentId')}>
                    <option value="">-- Choose a dependent --</option>
                    {MOCK_DEPENDENTS.map(dep => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name} ({dep.relationship}) — DOB: {dep.dateOfBirth}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
            )}
          </div>
        </div>

        <div className="step-nav">
          <Button type="button" variant="secondary" onClick={prevStep}>← Back</Button>
          <Button type="submit" variant="primary">Continue →</Button>
        </div>
      </form>
    </div>
  );
}
