import { useWizard } from '../context/WizardContext';

const STEPS = [
  { number: 1, label: 'Claim Type' },
  { number: 2, label: 'Member Info' },
  { number: 3, label: 'Diagnosis' },
  { number: 4, label: 'Documents' },
  { number: 5, label: 'Review' },
];

export default function ProgressBar() {
  const { state, goToStep } = useWizard();
  const current = state.currentStep;

  return (
    <div className="w-full bg-white border-b border-slate-200 px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 z-0">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {STEPS.map(step => {
            const done = step.number < current;
            const active = step.number === current;

            const circleVariant = done
              ? 'progress-circle-done'
              : active
                ? 'progress-circle-active'
                : 'progress-circle-pending';

            return (
              <div key={step.number} className="flex flex-col items-center z-10 flex-1">
                <button
                  type="button"
                  onClick={() => done && goToStep(step.number)}
                  disabled={!done}
                  className={`progress-circle ${circleVariant}`}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`Step ${step.number}: ${step.label}${done ? ' (completed)' : ''}`}
                >
                  {done ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.number}
                </button>
                <span className={[
                  'mt-1.5 text-xs font-medium hidden sm:block',
                  active ? 'text-blue-600' : done ? 'text-slate-600' : 'text-slate-400',
                ].join(' ')}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
