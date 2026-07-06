/**
 * Auth Loading Component
 *
 * Shows loading state while checking session.
 * Prevents UI flicker during authentication check.
 */

export function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-secondary-600">Memuat...</p>
      </div>
    </div>
  );
}
