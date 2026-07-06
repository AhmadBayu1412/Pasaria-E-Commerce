/**
 * Spinner Types
 */

import type { HTMLAttributes } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Spinner size */
  size?: SpinnerSize;

  /** Accessible label */
  label?: string;
}
