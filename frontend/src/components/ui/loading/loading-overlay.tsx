'use client';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

/**
 * LoadingOverlay - untuk operasi yang butuh feedback langsung
 * Gunakan untuk: Checkout, Payment, Upload
 * Jangan untuk: Search results, page navigation (gunakan skeleton)
 */
export function LoadingOverlay({
  isLoading,
  children,
  message,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm
                        flex flex-col items-center justify-center z-10 rounded-lg">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent
                          rounded-full animate-spin mb-4" />
          {message && <p className="text-gray-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
