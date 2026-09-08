import React from 'react';

interface State {
  error?: Error;
}

/**
 * Last line of defence: instead of a blank page, show what happened and offer a reload.
 * The DOM guard in main.tsx should make this unreachable for the translation case.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error('PuraVidaGov: unrecoverable render error', error);
  }

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Algo salió mal al dibujar la página</h1>
        <p className="mt-2 text-sm text-slate-600">
          Suele ocurrir cuando el navegador traduce la página mientras se carga. Recargue para continuar; sus datos
          de sesión se conservan.
        </p>
        <pre className="mt-4 overflow-x-auto rounded bg-slate-100 p-3 text-left text-xs text-slate-500">
          {this.state.error.message}
        </pre>
        <button type="button" className="btn-primary mt-4" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    );
  }
}
