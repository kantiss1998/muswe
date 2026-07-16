import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = idProp ?? generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null].filter(Boolean).join(' ') ||
      undefined

    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs uppercase tracking-wider font-heading font-medium text-brand-black/70 transition-colors duration-200"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center group">
          {leftIcon && (
            <div
              className="absolute left-3 text-neutral-400 flex items-center justify-center transition-colors duration-200 group-focus-within:text-brand-black"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              // Input styles — Modern premium minimalist design
              'w-full bg-neutral-50/50 text-sm px-4 py-3 border border-neutral-200 rounded-lg text-brand-black transition-all duration-300 placeholder:text-neutral-400 focus:border-brand-black focus:bg-white focus:ring-4 focus:ring-brand-black/5 outline-none',
              {
                'pl-10': leftIcon,
                'pr-10': rightIcon,
                'border-red-500 focus:border-red-500': error,
              },
              className
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />

          {rightIcon && (
            <div
              className="absolute right-3 text-neutral-400 flex items-center justify-center transition-colors duration-200 group-focus-within:text-brand-black"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <span id={errorId} className="text-xs text-red-500 tracking-wide font-sans">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="text-xs text-neutral-500 tracking-wide font-sans">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
