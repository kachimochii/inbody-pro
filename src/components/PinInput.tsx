import React, { useRef } from 'react';
import { PIN_LENGTH } from '../lib/userPin';

interface PinInputProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  idPrefix?: string;
  onEnter?: () => void;
}

export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  disabled,
  autoFocus,
  idPrefix = 'pin',
  onEnter,
}) => {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH).split('');

  const setAt = (index: number, digit: string) => {
    const next = Array.from({ length: PIN_LENGTH }, (_, i) => digits[i] || '');
    next[index] = digit;
    onChange(next.join(''));
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <input
          key={`${idPrefix}-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={`${idPrefix}-${i}`}
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          value={digits[i] || ''}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (!raw) {
              setAt(i, '');
              return;
            }
            const last = raw.slice(-1);
            setAt(i, last);
            if (i < PIN_LENGTH - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i] && i > 0) {
              refs.current[i - 1]?.focus();
            }
            if (e.key === 'Enter') onEnter?.();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
            if (pasted) onChange(pasted);
          }}
          className="w-11 h-12 sm:w-12 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-blue-500 text-white font-mono text-xl text-center outline-none disabled:opacity-50"
        />
      ))}
    </div>
  );
};
