/**
 * Skeleton Types
 */

import type { HTMLAttributes } from 'react';

export type SkeletonVariant = 'rect' | 'circle' | 'text';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Skeleton variant */
  variant?: SkeletonVariant;
}
