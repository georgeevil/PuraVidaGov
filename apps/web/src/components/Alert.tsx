import type { ReactNode } from 'react';

type Kind = 'error' | 'info' | 'success' | 'warning';

const styles: Record<Kind, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-primary-100 bg-primary-50 text-primary-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

export function Alert({ kind = 'info', children }: { kind?: Kind; children: ReactNode }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-sm ${styles[kind]}`}>
      {children}
    </div>
  );
}
