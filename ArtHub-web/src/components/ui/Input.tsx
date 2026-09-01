'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-[var(--main-text)]">{label}</label>}
        <input
          ref={ref}
          className={`input-quark w-full ${error ? 'border-[var(--com-color-warn)]' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[var(--com-color-warn)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';