'use client'

import React, { useState, useId } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

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

    const isPassword = type === 'password'
    const [showPassword, setShowPassword] = useState(false)

    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null].filter(Boolean).join(' ') ||
      undefined

    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type

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
            type={actualType}
            ref={ref}
            className={cn(
              // Input styles — Modern premium minimalist design
              'w-full bg-neutral-50/50 text-sm px-4 py-3 border border-neutral-200 rounded-lg text-brand-black transition-all duration-300 placeholder:text-neutral-400 focus:border-brand-black focus:bg-white focus:ring-4 focus:ring-brand-black/5 outline-none',
              {
                'pl-10': leftIcon,
                'pr-10': rightIcon || isPassword,
                'border-red-500 focus:border-red-500': error,
              },
              className
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />

          <div className="absolute right-3 flex items-center space-x-1 text-neutral-400">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="hover:text-brand-black focus:outline-none transition-colors duration-200 p-1"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
            {rightIcon && (
              <div
                className="flex items-center justify-center transition-colors duration-200 group-focus-within:text-brand-black"
                aria-hidden="true"
              >
                {rightIcon}
              </div>
            )}
          </div>
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
