/**
 * Button Types
 */

import type { ReactNode } from 'react';

// Button variants
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

// Button sizes
export type ButtonSize = 'sm' | 'md' | 'lg';

// Base props shared by all variants
export interface BaseButtonProps {
  /** Additional CSS classes */
  className?: string;

  /** Button content */
  children: ReactNode;

  /** Visual style variant */
  variant?: ButtonVariant;

  /** Size variant */
  size?: ButtonSize;

  /** Loading state */
  isLoading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Full width */
  fullWidth?: boolean;

  /** Left icon */
  leftIcon?: ReactNode;

  /** Right icon */
  rightIcon?: ReactNode;
}

// Native button props
export interface ButtonAsButton extends BaseButtonProps {
  as?: 'button';
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

// Anchor button props
export interface ButtonAsAnchor extends BaseButtonProps {
  as: 'a';
  href: string;
  target?: string;
  rel?: string;
}

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;
