'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/formatters';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '0,00',
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    value ? formatCurrency(value) : ''
  );

  useEffect(() => {
    setDisplayValue(value ? formatCurrency(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ''); // Mantém apenas dígitos
    if (!raw) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numericValue = parseFloat(raw) / 100;
    setDisplayValue(formatCurrency(numericValue));
    onChange(numericValue);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`text-right p-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${className}`}
    />
  );
};