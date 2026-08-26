import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error Boundary Exception:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isRateLimit =
        this.state.error?.message?.toLowerCase().includes('rate') ||
        this.state.error?.message?.toLowerCase().includes('429') ||
        this.state.error?.message?.toLowerCase().includes('exceeded') ||
        this.state.error?.message?.toLowerCase().includes('quota');

      return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans">
          <div className="max-w-md w-full bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {isRateLimit ? 'API Rate Limit Protection Active' : 'Application Connection Notice'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {isRateLimit
                  ? 'Upstream anime providers are cooling down to prevent rate limit blocks. Your session is protected and will auto-resume.'
                  : (this.state.error?.message || 'A temporary display exception occurred. You can retry or return to the main feed.')}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 active:scale-95"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                Reload & Retry
              </button>
              <button
                onClick={() => {
                  (this as any).setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
