import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'btn-primary-action hover:!text-white active:scale-95 focus-visible:ring-[var(--primary-400)] shadow-md',
  secondary:
    'bg-white text-[var(--primary-500)] border border-[var(--primary-400)] hover:bg-[var(--primary-100)] hover:text-[var(--primary-500)] active:scale-95 focus-visible:ring-[var(--primary-300)] shadow-md',
  danger:
    'bg-[var(--danger-500)] text-white hover:opacity-90 active:scale-95 focus-visible:ring-[var(--danger-500)] shadow-md',
  ghost:
    'bg-transparent text-[var(--text-primary)] hover:bg-[var(--primary-100)] hover:text-[var(--text-primary)] focus-visible:ring-[var(--primary-300)]',
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'min-h-[52px] min-w-[80px] px-3 text-sm shrink-0',
  md: 'min-h-[52px] min-w-[80px] px-4 text-sm',
  lg: 'min-h-[56px] min-w-[96px] px-5 text-base',
  icon: 'h-[52px] w-[52px] min-w-[52px] p-0 shrink-0',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-xl text-center font-bold transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:bg-[var(--primary-100)] disabled:text-[var(--text-secondary)] disabled:border-transparent',
    variantClassMap[variant],
    sizeClassMap[size],
    className ?? '',
  ]
    .join(' ')
    .trim();

  return <button type={type} className={classes} {...props} />;
}

