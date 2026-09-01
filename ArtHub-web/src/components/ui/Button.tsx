'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base = 'btn-quark inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    default: '',
    primary: 'btn-quark-primary',
    danger: 'btn-quark-danger',
  };
  const sizes: Record<string, string> = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};