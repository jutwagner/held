"use client";

import React from 'react';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

export function Switch({ checked, onCheckedChange, className = '', disabled = false, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : checked ? 'bg-blue-600' : 'bg-gray-300'
      } ${className}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default Switch;

