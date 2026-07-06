import { ProtectedRoute } from '@/components/features/auth';

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
