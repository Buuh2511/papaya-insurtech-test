import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'success';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-success',
};

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`btn ${VARIANT_CLASS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
