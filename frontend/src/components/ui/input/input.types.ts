/**
 * Input Types
 */

import type { InputHTMLAttributes } from 'react';
import type { ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;

  /** Error message */
  error?: string;

  /** Helper text */
  hint?: string;

  /** Show valid state */
  isValid?: boolean;

  /** Left element (icon, etc.) */
  leftElement?: ReactNode;

  /** Right element (icon, etc.) */
  rightElement?: ReactNode;
}
