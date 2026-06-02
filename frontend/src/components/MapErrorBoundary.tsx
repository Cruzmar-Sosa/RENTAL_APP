'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MapErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-slate-900/50 backdrop-blur-md rounded-2xl border border-rose-500/20 p-6 text-center text-slate-200">
          <div className="p-4 bg-rose-500/10 rounded-full text-rose-400 mb-4 border border-rose-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-rose-400 mb-2">Error de Carga del Mapa</h3>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            No se pudo renderizar el mapa interactivo. Esto puede deberse a datos de coordenadas corruptos o a un problema en el proveedor de mapas.
          </p>
          {this.state.error?.message && (
            <div className="mb-6 px-3 py-1.5 bg-slate-950/60 rounded-lg border border-slate-800 font-mono text-xs text-rose-300 max-w-sm truncate">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium shadow-lg shadow-rose-500/25 transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
