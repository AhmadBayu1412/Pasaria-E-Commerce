/**
 * Container Types
 */

import type { HTMLAttributes } from 'react';
import type { ReactNode } from 'react';

export type ContainerSize = 'sm' | 'default' | 'lg' | 'full';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Container content */
  children: ReactNode;

  /** Container max-width size */
  size?: ContainerSize;
}
