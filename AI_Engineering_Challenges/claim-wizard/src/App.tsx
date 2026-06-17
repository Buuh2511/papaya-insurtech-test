import { WizardProvider, useWizard } from './context/WizardContext';
import ProgressBar from './components/ProgressBar';
import Step1ClaimType from './steps/Step1ClaimType';
import Step2MemberInfo from './steps/Step2MemberInfo';
import Step3Diagnosis from './steps/Step3Diagnosis';
import Step4Documents from './steps/Step4Documents';
import Step5Review from './steps/Step5Review';

function WizardContent() {
  const { state } = useWizard();
  const step = state.currentStep;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:py-4 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-800 leading-none">Claim Submission</h1>
            <p className="text-xs text-slate-500 mt-0.5">Papaya Insurtech</p>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <ProgressBar />

      {/* Step content — key forces remount → triggers enter animation each step */}
      <main className="flex-1 px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div key={step} className="animate-step-enter">
            {step === 1 && <Step1ClaimType />}
            {step === 2 && <Step2MemberInfo />}
            {step === 3 && <Step3Diagnosis />}
            {step === 4 && <Step4Documents />}
            {step === 5 && <Step5Review />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-3 mt-auto">
        <div className="max-w-3xl mx-auto text-center text-xs text-slate-400">
          Step {step} of 5 · All data is encrypted and secure
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
