import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
export default Input;
