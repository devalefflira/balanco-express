'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/formatters';

interface CurrencyInputProps {
  value: number | undefined | null;
  onChange: (value: number) => void;
  onFocus?: () => void;
  onBlur?: (finalValue: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  className = '',
  placeholder = '0,00',
  disabled = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    value && value !== 0 ? formatCurrency(value) : ''
  );

  useEffect(() => {
    setDisplayValue(value && value !== 0 ? formatCurrency(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numericValue = parseFloat(raw) / 100;
    setDisplayValue(formatCurrency(numericValue));
    onChange(numericValue);
  };

  const handleBlur = () => {
    const numericValue = displayValue
      ? parseFloat(displayValue.replace(/\./g, '').replace(',', '.')) || 0
      : 0;
    if (onBlur) {
      onBlur(numericValue);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      disabled={disabled}
      value={displayValue}
      onFocus={onFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`text-right px-2 py-1 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs transition ${className}`}
    />
  );
};