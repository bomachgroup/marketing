import React, { useRef, useLayoutEffect } from 'react';

export function stripCommas(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/,/g, '').trim();
}

export function formatNumberWithCommas(
  value: string | number | null | undefined,
  allowDecimals = true,
  maxDecimals = 2
): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/,/g, '').trim();
  if (!str) return '';

  const hasTrailingDot = str.endsWith('.');
  const parts = str.split('.');
  const intPart = parts[0].replace(/\D/g, '');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (!allowDecimals) {
    return formattedInt;
  }

  if (parts.length > 1) {
    const decPart = parts[1].replace(/\D/g, '').slice(0, maxDecimals);
    return `${formattedInt}.${decPart}`;
  }

  if (hasTrailingDot) {
    return `${formattedInt}.`;
  }

  return formattedInt;
}

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
  maxDecimals?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      allowDecimals = true,
      maxDecimals = 2,
      className,
      placeholder = '0.00',
      ...rest
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;
    const caretPosRef = useRef<number | null>(null);

    // Formatted display value derived from prop value
    const displayValue = formatNumberWithCommas(value, allowDecimals, maxDecimals);

    useLayoutEffect(() => {
      if (caretPosRef.current !== null && inputRef.current) {
        inputRef.current.setSelectionRange(caretPosRef.current, caretPosRef.current);
        caretPosRef.current = null;
      }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const rawText = input.value;
      const cursor = input.selectionStart ?? rawText.length;

      // Count non-comma characters before cursor
      const nonCommasBeforeCursor = rawText.slice(0, cursor).replace(/,/g, '').length;

      // Clean raw numeric value
      let clean = rawText.replace(/,/g, '');
      if (!allowDecimals) {
        clean = clean.replace(/\D/g, '');
      } else {
        const dotIndex = clean.indexOf('.');
        if (dotIndex !== -1) {
          const before = clean.slice(0, dotIndex).replace(/\D/g, '');
          const after = clean.slice(dotIndex + 1).replace(/\D/g, '').slice(0, maxDecimals);
          clean = clean.endsWith('.') && after.length === 0 ? `${before}.` : `${before}.${after}`;
        } else {
          clean = clean.replace(/\D/g, '');
        }
      }

      // Calculate future formatted string to position cursor
      const futureFormatted = formatNumberWithCommas(clean, allowDecimals, maxDecimals);

      // Find new cursor position matching non-comma count
      let newCursor = 0;
      let nonCommasCount = 0;
      for (let i = 0; i < futureFormatted.length; i++) {
        if (nonCommasCount >= nonCommasBeforeCursor) break;
        if (futureFormatted[i] !== ',') nonCommasCount++;
        newCursor = i + 1;
      }

      caretPosRef.current = newCursor;
      onChange(clean);
    };

    return (
      <input
        ref={inputRef}
        type="text"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        {...rest}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';
