import { useRef, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWizard } from '../context/WizardContext';
import { createStep4Schema, type Step4FormData } from '../schemas/stepSchemas';
import type { UploadedFile } from '../types/wizard';
import Button from '../components/ui/Button';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_MB = 10;

type DocKey = keyof Step4FormData;

interface DocConfig { key: DocKey; label: string; required: boolean; claimTypes: string[] }

const DOC_CONFIGS: DocConfig[] = [
  { key: 'medicalReceipt',  label: 'Medical Receipt',   required: true,  claimTypes: ['outpatient', 'inpatient'] },
  { key: 'prescription',    label: 'Prescription',       required: false, claimTypes: ['outpatient'] },
  { key: 'dischargeSummary',label: 'Discharge Summary',  required: true,  claimTypes: ['inpatient'] },
  { key: 'itemizedBill',    label: 'Itemized Bill',      required: true,  claimTypes: ['inpatient'] },
  { key: 'dentalReceipt',   label: 'Dental Receipt',     required: true,  claimTypes: ['dental'] },
  { key: 'treatmentPlan',   label: 'Treatment Plan',     required: true,  claimTypes: ['dental'] },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface UploadSlotProps {
  label: string;
  required: boolean;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  error?: string;
}

function UploadSlot({ label, required, value, onChange, error }: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = (file: File) => {
    const base: UploadedFile = { id: crypto.randomUUID(), file, name: file.name, size: file.size, progress: 0, status: 'uploading' };

    if (!ALLOWED_TYPES.includes(file.type)) {
      onChange({ ...base, status: 'error', error: 'Invalid file type. Only PDF, JPG, PNG accepted.' });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      onChange({ ...base, status: 'error', error: `File exceeds ${MAX_MB}MB limit.` });
      return;
    }

    onChange(base);
    let progress = 0;
    const iv = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        clearInterval(iv);
        onChange({ ...base, progress: 100, status: 'done' });
      } else {
        onChange({ ...base, progress: Math.floor(progress) });
      }
    }, 200);
  };

  return (
    <div className={`card ${error ? 'border-red-300' : ''}`}>
      <div className={`card-body ${error ? 'bg-red-50' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${required ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
              {required ? 'Required' : 'Optional'}
            </span>
          </div>
          {value?.status === 'done' && (
            <button type="button" onClick={() => onChange(null)} className="text-xs text-red-500 hover:text-red-700">
              Remove
            </button>
          )}
        </div>

        {!value ? (
          <div
            className={`upload-zone ${dragOver ? 'upload-zone-active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-slate-500">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max {MAX_MB}MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                value.file.type === 'application/pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{value.name}</p>
                <p className="text-xs text-slate-500">{formatSize(value.size)}</p>
              </div>
              {value.status === 'done' && (
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {value.status === 'uploading' && (
              <div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${value.progress}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{value.progress}% uploading...</p>
              </div>
            )}
            {value.status === 'error' && <p className="text-xs text-red-500">{value.error}</p>}
          </div>
        )}
      </div>
      {error && <p className="px-5 pb-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function Step4Documents() {
  const { state, updateStep4, nextStep, prevStep } = useWizard();
  const claimType = state.step1.claimType!;

  const schema = useMemo(() => createStep4Schema(claimType), [claimType]);

  const { control, handleSubmit, formState: { errors } } = useForm<Step4FormData>({
    resolver: zodResolver(schema),
    defaultValues: state.step4,
  });

  const visibleDocs = DOC_CONFIGS.filter(d => d.claimTypes.includes(claimType));

  const onSubmit = (data: Step4FormData) => {
    updateStep4(data);
    nextStep();
  };

  return (
    <div className="step-page">
      <div className="step-page-header">
        <h2 className="step-page-title">Document Upload</h2>
        <p className="step-page-subtitle">Upload supporting documents for your claim.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {visibleDocs.map(doc => (
            <Controller
              key={doc.key}
              name={doc.key}
              control={control}
              render={({ field }) => (
                <UploadSlot
                  label={doc.label}
                  required={doc.required}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  error={errors[doc.key]?.message}
                />
              )}
            />
          ))}
        </div>

        <div className="step-nav">
          <Button type="button" variant="secondary" onClick={prevStep}>← Back</Button>
          <Button type="submit" variant="primary">Review →</Button>
        </div>
      </form>
    </div>
  );
}
