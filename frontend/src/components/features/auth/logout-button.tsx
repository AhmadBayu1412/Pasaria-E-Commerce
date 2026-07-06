/**
 * Logout Button Component
 *
 * Handles user logout.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function LogoutButton({
  variant = 'ghost',
  size = 'md',
  children = 'Logout',
}: LogoutButtonProps) {
  const { reset } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with local logout even if API fails
      console.error('Logout API failed:', error);
    } finally {
      // Always clear local state
      reset();
      router.push('/');
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleLogout}>
      {children}
    </Button>
  );
}
