import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Activity, 
  X, 
  Minimize2, 
  Maximize2, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  Server, 
  Cpu, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  XCircle,
  Play
} from 'lucide-react';
import { devLogger, LogEntry } from '../services/devLogger';

interface DeveloperPanelProps {
  onClose?: () => void;
}

export const DeveloperPanel: React.FC<DeveloperPanelProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'terminal' | 'system'>('diagnostics');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // System Diagnostic Test state
  const [testResults, setTestResults] = useState<Array<{ name: string; status: 'idle' | 'testing' | 'pass' | 'fail'; message: string; latency?: number }>>([
    { name: 'Recent Anime API (/api/recent-anime)', status: 'idle', message: 'Not tested yet' },
    { name: 'Anime Details Proxy (/api/anime/info)', status: 'idle', message: 'Not tested yet' },
    { name: 'HLS Stream Manifest Proxy (/api/stream/manifest)', status: 'idle', message: 'Not tested yet' },
    { name: 'Direct Stream Endpoint (/api/anime/stream)', status: 'idle', message: 'Not tested yet' }
  ]);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync logs when devLogger emits update
  useEffect(() => {
    setLogs(devLogger.getLogs());
    const unsubscribe = devLogger.subscribe(() => {
      setLogs([...devLogger.getLogs()]);
    });
    return () => unsubscribe();
  }, []);

  // Auto scroll terminal to bottom if on terminal tab
  useEffect(() => {
    if (activeTab === 'terminal' && isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, activeTab, isOpen]);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.category}] ${l.message} ${l.details ? JSON.stringify(l.details) : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runSystemDiagnostic = async () => {
    setIsTesting(true);
    const results = [...testResults];

    // Test 1: Recent Anime
    results[0] = { name: 'Recent Anime API (/api/recent-anime)', status: 'testing', message: 'Testing endpoint...' };
    setTestResults([...results]);
    const start1 = performance.now();
    try {
      const res = await fetch('/api/recent-anime?page=1');
      const latency1 = Math.round(performance.now() - start1);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && !contentType.includes('text/html')) {
        results[0] = { name: 'Recent Anime API (/api/recent-anime)', status: 'pass', message: `200 OK (${latency1}ms)`, latency: latency1 };
      } else {
        results[0] = { name: 'Recent Anime API (/api/recent-anime)', status: 'fail', message: `Failed HTTP ${res.status} (returned ${contentType || 'non-JSON'})`, latency: latency1 };
      }
    } catch (err: any) {
      results[0] = { name: 'Recent Anime API (/api/recent-anime)', status: 'fail', message: err?.message || 'Network / CORS Error' };
    }
    setTestResults([...results]);

    // Test 2: Anime Info Proxy
    results[1] = { name: 'Anime Details Proxy (/api/anime/info)', status: 'testing', message: 'Testing endpoint...' };
    setTestResults([...results]);
    const start2 = performance.now();
    try {
      const res = await fetch('/api/anime/info?slug=one-piece');
      const latency2 = Math.round(performance.now() - start2);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && !contentType.includes('text/html')) {
        results[1] = { name: 'Anime Details Proxy (/api/anime/info)', status: 'pass', message: `200 OK (${latency2}ms)`, latency: latency2 };
      } else {
        results[1] = { name: 'Anime Details Proxy (/api/anime/info)', status: 'fail', message: `Failed HTTP ${res.status}`, latency: latency2 };
      }
    } catch (err: any) {
      results[1] = { name: 'Anime Details Proxy (/api/anime/info)', status: 'fail', message: err?.message || 'Network / CORS Error' };
    }
    setTestResults([...results]);

    // Test 3: Stream Proxy Manifest
    results[2] = { name: 'HLS Stream Manifest Proxy (/api/stream/manifest)', status: 'testing', message: 'Testing manifest proxy...' };
    setTestResults([...results]);
    const start3 = performance.now();
    try {
      const res = await fetch('/api/stream/manifest?url=https%3A%2F%2Ftest-streams.mux.dev%2Fx36xhzz%2Fx36xhzz.m3u8&referer=https%3A%2F%2Fmegaplay.buzz%2F');
      const latency3 = Math.round(performance.now() - start3);
      if (res.ok) {
        results[2] = { name: 'HLS Stream Manifest Proxy (/api/stream/manifest)', status: 'pass', message: `200 OK - Manifest Proxy Working (${latency3}ms)`, latency: latency3 };
      } else {
        results[2] = { name: 'HLS Stream Manifest Proxy (/api/stream/manifest)', status: 'fail', message: `Proxy Error HTTP ${res.status}`, latency: latency3 };
      }
    } catch (err: any) {
      results[2] = { name: 'HLS Stream Manifest Proxy (/api/stream/manifest)', status: 'fail', message: err?.message || 'CORS / Proxy Error' };
    }
    setTestResults([...results]);

    // Test 4: Stream MAL Endpoint
    results[3] = { name: 'Direct Stream Endpoint (/api/anime/stream)', status: 'testing', message: 'Testing MAL stream resolver...' };
    setTestResults([...results]);
    const start4 = performance.now();
    try {
      const res = await fetch('/api/anime/stream/21/1');
      const latency4 = Math.round(performance.now() - start4);
      if (res.ok) {
        results[3] = { name: 'Direct Stream Endpoint (/api/anime/stream)', status: 'pass', message: `200 OK (${latency4}ms)`, latency: latency4 };
      } else {
        results[3] = { name: 'Direct Stream Endpoint (/api/anime/stream)', status: 'fail', message: `HTTP ${res.status}`, latency: latency4 };
      }
    } catch (err: any) {
      results[3] = { name: 'Direct Stream Endpoint (/api/anime/stream)', status: 'fail', message: err?.message || 'Network Error' };
    }
    setTestResults([...results]);
    setIsTesting(false);
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filterLevel === 'network' && log.level !== 'network') return false;
    if (filterLevel === 'errors' && log.level !== 'error' && !log.isError) return false;
    if (filterLevel === 'warn' && log.level !== 'warn' && log.level !== 'error') return false;
    if (filterLevel === 'slow' && (!log.durationMs || log.durationMs < 500)) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const msgMatch = log.message.toLowerCase().includes(query);
      const urlMatch = log.url?.toLowerCase().includes(query);
      const catMatch = log.category.toLowerCase().includes(query);
      return msgMatch || urlMatch || catMatch;
    }
    return true;
  });

  const errorCount = logs.filter(l => l.level === 'error' || l.isError).length;
  const networkCount = logs.filter(l => l.level === 'network').length;

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#282828] text-white border border-[#3e3e3e] rounded-full shadow-2xl transition-all cursor-pointer font-mono text-xs group"
        >
          <Terminal className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold">Dev Diagnostics</span>
          {errorCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-extrabold animate-pulse">
              {errorCount} err
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
              {networkCount} reqs
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[9999] w-[calc(100vw-24px)] sm:w-[560px] md:w-[640px] max-h-[580px] h-[520px] bg-[#121212] border border-[#333] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-200 select-none font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c1c1c] border-b border-[#2d2d2d] shrink-0">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs text-white tracking-wide">
            Developer Diagnostics & Network Terminal
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-[#2b2b2b] text-gray-400 border border-[#3a3a3a]">
            {typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ? 'VERCEL HOST' : 'DEV / CONTAINER'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyLogs}
            className="p-1.5 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Copy Logs JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => devLogger.clearLogs()}
            className="p-1.5 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Clear Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Minimize Panel"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-950/60 rounded text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Close Developer Mode"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center justify-between bg-[#181818] border-b border-[#282828] px-3 py-1.5 text-xs shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'diagnostics' ? 'bg-[#2a2a2a] text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Network Inspector</span>
            {networkCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#333] text-white font-mono">
                {networkCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'terminal' ? 'bg-[#2a2a2a] text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal Logs</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-red-600 text-white font-mono font-bold">
                {errorCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'system' ? 'bg-[#2a2a2a] text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Environment Test</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Diagnostics (Network Inspector) */}
      {activeTab === 'diagnostics' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0e0e0e]">
          {/* Sub-filter bar */}
          <div className="p-2 bg-[#151515] border-b border-[#252525] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilterLevel('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  filterLevel === 'all' ? 'bg-white text-black font-bold' : 'bg-[#222] text-gray-300 hover:bg-[#2d2d2d]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterLevel('network')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  filterLevel === 'network' ? 'bg-sky-500 text-white font-bold' : 'bg-[#222] text-gray-300 hover:bg-[#2d2d2d]'
                }`}
              >
                Network
              </button>
              <button
                onClick={() => setFilterLevel('errors')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  filterLevel === 'errors' ? 'bg-red-600 text-white font-bold' : 'bg-[#222] text-gray-300 hover:bg-[#2d2d2d]'
                }`}
              >
                Errors Only
              </button>
              <button
                onClick={() => setFilterLevel('slow')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  filterLevel === 'slow' ? 'bg-amber-600 text-white font-bold' : 'bg-[#222] text-gray-300 hover:bg-[#2d2d2d]'
                }`}
              >
                Slow ({'>'}500ms)
              </button>
            </div>

            <div className="relative w-36 sm:w-44">
              <Search className="w-3 h-3 absolute left-2 top-2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search URL / API..."
                className="w-full bg-[#1c1c1c] border border-[#333] rounded pl-7 pr-2 py-0.5 text-[11px] text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Network request list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11px] divide-y divide-[#1e1e1e]">
            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 p-8 text-center font-sans">
                <Activity className="w-8 h-8 opacity-40 text-gray-400" />
                <p className="text-xs">No network logs recorded yet.</p>
                <p className="text-[11px] text-gray-600">Make an API request or watch an episode to view background traffic.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const isErr = log.level === 'error' || log.isError;

                return (
                  <div key={log.id} className="pt-1.5 pb-1">
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isErr
                          ? 'bg-red-950/20 border border-red-900/40 hover:bg-red-950/40'
                          : 'bg-[#161616] border border-[#222] hover:bg-[#1e1e1e]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] text-gray-500 shrink-0">{log.timestamp}</span>
                        
                        {log.method && (
                          <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded uppercase shrink-0 ${
                            log.method === 'GET' ? 'bg-sky-950 text-sky-400 border border-sky-800/60' : 'bg-purple-950 text-purple-400'
                          }`}>
                            {log.method}
                          </span>
                        )}

                        <span className="truncate text-gray-200 text-[11px] font-medium" title={log.url || log.message}>
                          {log.url || log.message}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {log.status && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isErr ? 'bg-red-600 text-white' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                            {log.status}
                          </span>
                        )}

                        {log.durationMs !== undefined && (
                          <span className={`text-[10px] ${log.durationMs > 500 ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                            {log.durationMs}ms
                          </span>
                        )}

                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                      </div>
                    </div>

                    {/* Expanded payload details */}
                    {isExpanded && (
                      <div className="mt-1.5 p-3 bg-[#111111] border border-[#282828] rounded-lg text-[10px] text-gray-300 space-y-1.5">
                        <div className="flex justify-between items-center text-gray-400 border-b border-[#222] pb-1 font-sans font-semibold">
                          <span>Request Details & Diagnostics</span>
                          <span className="text-emerald-400">{log.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Full Target URL:</span>
                          <p className="text-sky-300 break-all select-all">{log.url || log.message}</p>
                        </div>
                        {log.details && (
                          <div>
                            <span className="text-gray-500">Response / Payload Context:</span>
                            <pre className="p-2 bg-[#080808] border border-[#222] rounded overflow-x-auto text-[10px] text-emerald-400 max-h-36">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        {isErr && (
                          <div className="p-2 bg-red-950/40 border border-red-800/60 rounded text-red-300 text-[10px] font-sans">
                            <p className="font-bold flex items-center gap-1 mb-0.5">
                              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                              Vercel Deployment Diagnostic Tip:
                            </p>
                            <p className="text-[10px] text-red-200">
                              If this API request returned 404 or HTML content on Vercel, check <code className="bg-black/60 px-1 rounded">vercel.json</code> rewrites to ensure the proxy route forwards directly to <code className="bg-black/60 px-1 rounded">https://anikotoapi.site</code> or serverless API endpoints.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Terminal Logs */}
      {activeTab === 'terminal' && (
        <div className="flex-1 bg-[#0a0a0a] p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="text-gray-600 italic">Console output is empty...</div>
          ) : (
            filteredLogs.map((log) => {
              let colorClass = 'text-gray-300';
              if (log.level === 'error' || log.isError) colorClass = 'text-red-400 font-semibold';
              else if (log.level === 'warn') colorClass = 'text-amber-300';
              else if (log.level === 'success') colorClass = 'text-emerald-400';
              else if (log.level === 'network') colorClass = 'text-sky-300';

              return (
                <div key={log.id} className="flex items-start gap-2 border-b border-[#181818] pb-1">
                  <span className="text-gray-600 text-[10px] shrink-0 font-sans">{log.timestamp}</span>
                  <span className={`px-1 py-0.1 text-[9px] rounded uppercase font-bold shrink-0 ${
                    log.level === 'error' ? 'bg-red-950 text-red-400' : 'bg-[#222] text-gray-400'
                  }`}>
                    {log.category}
                  </span>
                  <span className={`break-all ${colorClass}`}>
                    {log.message}
                    {log.details && typeof log.details === 'object' && (
                      <span className="text-gray-500 ml-2">
                        {JSON.stringify(log.details)}
                      </span>
                    )}
                  </span>
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Tab 3: System & Vercel Diagnostic Check */}
      {activeTab === 'system' && (
        <div className="flex-1 bg-[#0f0f0f] p-4 overflow-y-auto space-y-4 text-xs">
          {/* Environment Info Box */}
          <div className="p-3.5 bg-[#181818] border border-[#2d2d2d] rounded-xl space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm border-b border-[#2d2d2d] pb-1.5">
              <Server className="w-4 h-4 text-purple-400" />
              Runtime Environment Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300 font-mono text-[11px]">
              <div>
                <span className="text-gray-500 block">Current Origin:</span>
                <span className="text-sky-400">{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Host Environment:</span>
                <span className="text-emerald-400 font-bold">
                  {typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ? 'Vercel Deployment' : 'AI Studio Sandbox / Cloud Run'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">HLS Video Engine Support:</span>
                <span className="text-emerald-400">Supported (HLS.js / Native)</span>
              </div>
              <div>
                <span className="text-gray-500 block">Browser Agent:</span>
                <span className="text-gray-400 truncate block">{typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Automated API Health Test */}
          <div className="p-3.5 bg-[#181818] border border-[#2d2d2d] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                <Wifi className="w-4 h-4 text-emerald-400" />
                Vercel API & Stream Proxy Health Test
              </h4>
              <button
                onClick={runSystemDiagnostic}
                disabled={isTesting}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Testing...' : 'Run Connectivity Check'}
              </button>
            </div>

            <div className="space-y-2">
              {testResults.map((t, idx) => (
                <div key={idx} className="p-2.5 bg-[#121212] border border-[#282828] rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {t.status === 'idle' && <div className="w-3 h-3 rounded-full bg-gray-600 shrink-0" />}
                    {t.status === 'testing' && <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />}
                    {t.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {t.status === 'fail' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    
                    <span className="font-semibold text-white truncate">{t.name}</span>
                  </div>

                  <span className={`text-[11px] font-mono shrink-0 ml-2 ${
                    t.status === 'pass' ? 'text-emerald-400' : t.status === 'fail' ? 'text-red-400 font-bold' : 'text-gray-500'
                  }`}>
                    {t.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
