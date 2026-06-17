import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`form-input resize-none ${error ? 'form-input-error' : ''} ${className}`}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
export default Textarea;
