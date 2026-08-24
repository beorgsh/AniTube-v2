export interface LogEntry {
  id: string;
  timestamp: string;
  timeMs: number;
  level: 'info' | 'success' | 'warn' | 'error' | 'network';
  category: 'API' | 'STREAM' | 'PLAYER' | 'SYSTEM' | 'NETWORK';
  message: string;
  details?: any;
  url?: string;
  method?: string;
  status?: number | string;
  durationMs?: number;
  isError?: boolean;
}

class DevLoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private listeners: Array<() => void> = [];
  private isInterceptorInitialized = false;
  private devModeEnabled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('anitube_dev_mode_enabled');
      this.devModeEnabled = stored === 'true';
      this.initInterceptors();
    }
  }

  public isDevMode(): boolean {
    return this.devModeEnabled;
  }

  public setDevMode(enabled: boolean): void {
    this.devModeEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('anitube_dev_mode_enabled', enabled ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('anitube_dev_mode_changed', { detail: { enabled } }));
    }
    this.notify();
    if (enabled) {
      this.addLog({
        id: `sys-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        timeMs: Date.now(),
        level: 'info',
        category: 'SYSTEM',
        message: 'Developer Diagnostics Mode activated.',
        details: { origin: window.location.origin, userAgent: navigator.userAgent }
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anitube_dev_log_event'));
    }
  }

  public addLog(entry: LogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    this.notify();
  }

  public logInfo(category: LogEntry['category'], message: string, details?: any) {
    this.addLog({
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
      timeMs: Date.now(),
      level: 'info',
      category,
      message,
      details
    });
  }

  public logSuccess(category: LogEntry['category'], message: string, details?: any) {
    this.addLog({
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
      timeMs: Date.now(),
      level: 'success',
      category,
      message,
      details
    });
  }

  public logWarn(category: LogEntry['category'], message: string, details?: any) {
    this.addLog({
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
      timeMs: Date.now(),
      level: 'warn',
      category,
      message,
      details
    });
  }

  public logError(category: LogEntry['category'], message: string, details?: any) {
    this.addLog({
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
      timeMs: Date.now(),
      level: 'error',
      category,
      message,
      details
    });
  }

  public logNetwork(
    url: string,
    method: string,
    status: number | string,
    durationMs: number,
    details?: any,
    isError?: boolean
  ) {
    this.addLog({
      id: `net-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
      timeMs: Date.now(),
      level: 'network',
      category: 'NETWORK',
      message: `${method} ${url} - Status: ${status} (${durationMs}ms)`,
      url,
      method,
      status,
      durationMs,
      details,
      isError: isError || (typeof status === 'number' && (status < 200 || status >= 400))
    });
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public clearLogs(): void {
    this.logs = [];
    this.notify();
  }

  private initInterceptors(): void {
    if (this.isInterceptorInitialized || typeof window === 'undefined') return;
    this.isInterceptorInitialized = true;

    // Intercept window.fetch to capture API & stream network requests
    const originalFetch = window.fetch;
    const self = this;

    if (typeof originalFetch === 'function') {
      const customFetch = async function (...args: Parameters<typeof fetch>) {
        const startTime = performance.now();
        let url = '';
        let method = 'GET';

        try {
          if (typeof args[0] === 'string') {
            url = args[0];
          } else if (args[0] instanceof URL) {
            url = args[0].toString();
          } else if (args[0] && typeof args[0] === 'object' && 'url' in args[0]) {
            url = (args[0] as Request).url;
          }

          if (args[1] && args[1].method) {
            method = args[1].method.toUpperCase();
          }
        } catch {
          // ignore parsing
        }

        try {
          const response = await originalFetch.apply(window, args);
          const duration = Math.round(performance.now() - startTime);

          if (self.devModeEnabled) {
            const status = response.status;
            const statusText = response.statusText;
            const isErr = !response.ok;

            const headerObj: Record<string, string> = {};
            try {
              response.headers?.forEach((val, key) => {
                headerObj[key] = val;
              });
            } catch {
              // ignore
            }

            self.logNetwork(url, method, `${status} ${statusText}`, duration, {
              type: response.type,
              redirected: response.redirected,
              headers: headerObj
            }, isErr);
          }

          return response;
        } catch (err: any) {
          const duration = Math.round(performance.now() - startTime);
          if (self.devModeEnabled) {
            self.logNetwork(url, method, 'FAILED (Network / CORS Error)', duration, {
              errorName: err?.name,
              errorMessage: err?.message || String(err)
            }, true);
          }
          throw err;
        }
      };

      try {
        Object.defineProperty(window, 'fetch', {
          value: customFetch,
          writable: true,
          configurable: true,
        });
      } catch {
        try {
          (window as any).fetch = customFetch;
        } catch {
          // If window.fetch cannot be overridden in strict context, skip network interception gracefully
        }
      }
    }

    // Intercept console.warn and console.error
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      if (self.devModeEnabled) {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        self.logWarn('SYSTEM', msg, args);
      }
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      if (self.devModeEnabled) {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        self.logError('SYSTEM', msg, args);
      }
    };
  }
}

export const devLogger = new DevLoggerService();
