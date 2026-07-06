/**
 * Badge Types
 */

import type { ReactNode, HTMLAttributes } from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge content */
  children: ReactNode;

  /** Visual style variant */
  variant?: BadgeVariant;

  /** Size variant */
  size?: BadgeSize;

  /** Show dot indicator */
  dot?: boolean;
}
