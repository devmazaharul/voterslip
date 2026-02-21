// app/dev/page.tsx
'use client';

import axios from 'axios';
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent,
  ChangeEvent,
} from 'react';
import {
  Search, User, MapPin, Calendar, Loader2, AlertCircle,
  Sparkles, Shield, Heart, Fingerprint, Building2, Clock,
  BadgeCheck, ChevronDown, Globe, CheckCircle2, X,
  ArrowRight, Copy, Check, Database, Wifi,
  Play, Pause, Square, SkipForward, RotateCcw,
  Terminal, Zap, Settings, TrendingUp, Activity,
  ChevronUp, Trash2, Download, Eye, EyeOff,
  Timer, Hash, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { VillageOption, VILLAGES_NEW } from '@/app/api/newvoter/utils';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
interface VoterInfo {
  _id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  serialNumber: number;
  voterNumber: string;
  village: string;
  motherName: string;
  fatherOrHusbandName: string;
  pollingCenter: string;
  addedBy: 'system' | 'self';
}

interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: VoterInfo[];
  source: 'database' | 'api' | 'api_error' | null;
  timestamp?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  dob: string;
  ward: string;
  status: 'success' | 'error' | 'empty';
  source: string | null;
  resultCount: number;
  message: string;
  duration: number;
  voters: VoterInfo[];
}

type IncrementField = 'day' | 'month' | 'year';
type AutoState = 'idle' | 'running' | 'paused';

const API_URL = '/api/newvoter';

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
const bangDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBanglaDigits = (v: string): string =>
  v.replace(/[0-9]/g, (d) => bangDigits[Number(d)]);

const formatDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
};

const convertToBanglaDOB = (dob: string): string => toBanglaDigits(dob);

const formatDisplayDate = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const parseDob = (dob: string): { day: number; month: number; year: number } | null => {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return { day: parseInt(m[1]), month: parseInt(m[2]), year: parseInt(m[3]) };
};

const incrementDate = (dob: string, field: IncrementField): string => {
  const parsed = parseDob(dob);
  if (!parsed) return dob;
  let { day, month, year } = parsed;

  if (field === 'day') {
    day++;
    const maxDay = new Date(year, month, 0).getDate();
    if (day > maxDay) { day = 1; month++; }
    if (month > 12) { month = 1; year++; }
  } else if (field === 'month') {
    month++;
    if (month > 12) { month = 1; year++; }
    const maxDay = new Date(year, month, 0).getDate();
    if (day > maxDay) day = maxDay;
  } else {
    year++;
  }

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

const decrementDate = (dob: string, field: IncrementField): string => {
  const parsed = parseDob(dob);
  if (!parsed) return dob;
  let { day, month, year } = parsed;

  if (field === 'day') {
    day--;
    if (day < 1) { month--; if (month < 1) { month = 12; year--; } day = new Date(year, month, 0).getDate(); }
  } else if (field === 'month') {
    month--;
    if (month < 1) { month = 12; year--; }
    const maxDay = new Date(year, month, 0).getDate();
    if (day > maxDay) day = maxDay;
  } else {
    year--;
  }

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

const useCopy = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
};

/* ═══════════════════════════════════════════
   CUSTOM SELECT
   ═══════════════════════════════════════════ */
const CustomSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: VillageOption[];
}> = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 pl-4 pr-4 py-3 bg-white/[0.03] border rounded-xl text-left transition-all duration-300 cursor-pointer group ${
          open ? 'border-purple-500/30 ring-2 ring-purple-500/15' : value ? 'border-purple-500/15' : 'border-white/[0.06] hover:border-white/[0.12]'
        }`}
      >
        <Globe className={`w-4 h-4 transition-colors ${value ? 'text-purple-400' : 'text-gray-500'}`} />
        <div className="flex-1 min-w-0">
          {selected ? (
            <p className="text-sm font-bold text-white truncate">{selected.name}</p>
          ) : (
            <p className="text-sm text-gray-600">গ্রাম নির্বাচন...</p>
          )}
        </div>
        {value && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); }} className="p-1 rounded hover:bg-red-500/10 cursor-pointer">
            <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
          </button>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-all ${open ? 'text-purple-400 rotate-180' : 'text-gray-500'}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-[#12121c] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
            <div className="max-h-56 overflow-y-auto py-1 px-1.5">
              {options.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onChange(opt.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer mb-0.5 ${
                    opt.id === value ? 'bg-purple-500/10 text-purple-300' : 'text-gray-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${
                    opt.id === value ? 'bg-purple-500 text-white' : 'bg-white/[0.05] text-gray-500'
                  }`}>
                    {opt.id === value ? <Check className="w-3 h-3" /> : toBanglaDigits((i + 1).toString())}
                  </div>
                  <span className="text-sm font-semibold truncate">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   LOG ENTRY ROW
   ═══════════════════════════════════════════ */
const LogRow: React.FC<{
  log: LogEntry;
  expanded: boolean;
  onToggle: () => void;
}> = ({ log, expanded, onToggle }) => {
  const statusColors = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    error: 'text-red-400 bg-red-500/10 border-red-500/20',
    empty: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  const statusIcons = {
    success: <CheckCircle className="w-3 h-3" />,
    error: <AlertTriangle className="w-3 h-3" />,
    empty: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      expanded ? 'border-white/[0.12] bg-white/[0.03]' : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02]'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer"
      >
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${statusColors[log.status]}`}>
          {statusIcons[log.status]}
        </div>
        <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
          {log.dob}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">{log.ward}</span>
        <div className="flex-1" />
        <span className="text-[10px] font-bold text-gray-500">{log.duration}ms</span>
        {log.resultCount > 0 && (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
            {log.resultCount} জন
          </span>
        )}
        {log.source && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
            log.source === 'database' ? 'text-cyan-400 bg-cyan-500/10' : 'text-orange-400 bg-orange-500/10'
          }`}>
            {log.source === 'database' ? 'DB' : 'API'}
          </span>
        )}
        <span className="text-[9px] text-gray-600 font-mono">
          {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && log.voters.length > 0 && (
        <div className="px-3 pb-3 border-t border-white/[0.05]">
          <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto">
            {log.voters.map((v, i) => (
              <div key={v._id || i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-[10px] font-bold text-purple-400">
                  {v.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{v.name}</p>
                  <p className="text-[9px] text-gray-500 font-mono">{v.voterNumber}</p>
                </div>
                <p className="text-[9px] text-gray-500 shrink-0">{v.village}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && log.status === 'error' && (
        <div className="px-3 pb-3 border-t border-white/[0.05]">
          <p className="mt-2 text-[11px] text-red-400 bg-red-500/5 rounded-lg px-3 py-2 border border-red-500/10">
            {log.message}
          </p>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MINI VOTER CARD (for selected result view)
   ═══════════════════════════════════════════ */
const MiniVoterCard: React.FC<{ voter: VoterInfo }> = ({ voter }) => {
  const { copied, copy } = useCopy();
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all p-4">
      <div className="h-[2px] w-full bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500 rounded-full -mt-4 mb-3 -mx-4" style={{ width: 'calc(100% + 2rem)' }} />
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/15 flex items-center justify-center text-lg font-bold text-purple-300 shrink-0">
          {voter.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{voter.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-mono text-gray-500">#{toBanglaDigits(voter.serialNumber.toString())}</span>
            <div className="w-px h-3 bg-white/[0.06]" />
            <button
              onClick={() => copy(voter.voterNumber, `mini-${voter._id}`)}
              className="text-[9px] font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-purple-500/20 transition-colors"
            >
              <Fingerprint className="w-2.5 h-2.5" />
              {voter.voterNumber}
              {copied === `mini-${voter._id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 opacity-50" />}
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-3">
        {[
          { l: 'পিতা/স্বামী', v: voter.fatherOrHusbandName, c: 'text-sky-400' },
          { l: 'মাতা', v: voter.motherName, c: 'text-rose-400' },
          { l: 'জন্ম তারিখ', v: formatDisplayDate(voter.dateOfBirth), c: 'text-amber-400' },
          { l: 'এলাকা', v: voter.village, c: 'text-emerald-400' },
        ].map(item => (
          <div key={item.l} className="px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[7px] font-bold text-gray-600 uppercase tracking-wider">{item.l}</p>
            <p className={`text-[10px] font-bold ${item.c} mt-0.5 truncate`}>{item.v || '—'}</p>
          </div>
        ))}
      </div>
      {voter.pollingCenter && (
        <div className="mt-2 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <p className="text-[10px] font-bold text-emerald-400 truncate">{voter.pollingCenter}</p>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN DEV PAGE
   ═══════════════════════════════════════════ */
export default function DevPage() {
  // ── Form State ──
  const [wardId, setWardId] = useState('');
  const [dob, setDob] = useState('01/01/2000');
  const [loading, setLoading] = useState(false);

  // ── Automation State ──
  const [autoState, setAutoState] = useState<AutoState>('idle');
  const [incrementField, setIncrementField] = useState<IncrementField>('day');
  const [intervalMs, setIntervalMs] = useState(2000);
  const [autoCallCount, setAutoCallCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);
  const dobRef = useRef(dob);
  const wardRef = useRef(wardId);

  // ── Logs ──
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'empty'>('all');
  const logEndRef = useRef<HTMLDivElement>(null);

  // ── Stats ──
  const [stats, setStats] = useState({
    total: 0, success: 0, error: 0, empty: 0, totalVoters: 0, avgDuration: 0
  });

  // ── Selected Log Result ──
  const [selectedVoters, setSelectedVoters] = useState<VoterInfo[]>([]);
  const [selectedDob, setSelectedDob] = useState('');

  // ── Dev Panel Toggle ──
  const [showDevPanel, setShowDevPanel] = useState(true);

  // Keep refs updated
  useEffect(() => { dobRef.current = dob; }, [dob]);
  useEffect(() => { wardRef.current = wardId; }, [wardId]);

  const isDobValid = /^\d{2}\/\d{2}\/\d{4}$/.test(dob);

  // ── API CALL ──
  const callApi = useCallback(async (searchDob: string, searchWard: string): Promise<LogEntry> => {
    const start = Date.now();
    const logId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
      const banglaDOB = convertToBanglaDOB(searchDob);
      const { data } = await axios.post<ApiResponse>(API_URL, {
        DOB: banglaDOB,
        Ward: searchWard,
      });

      const duration = Date.now() - start;
      const voters = data.data || [];
      const status: LogEntry['status'] = data.success && voters.length > 0 ? 'success' : data.success ? 'empty' : 'error';

      return {
        id: logId,
        timestamp: new Date(),
        dob: searchDob,
        ward: searchWard,
        status,
        source: data.source,
        resultCount: voters.length,
        message: data.message,
        duration,
        voters,
      };
    } catch (err: unknown) {
      const duration = Date.now() - start;
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Unknown error';

      return {
        id: logId,
        timestamp: new Date(),
        dob: searchDob,
        ward: searchWard,
        status: 'error',
        source: null,
        resultCount: 0,
        message,
        duration,
        voters: [],
      };
    }
  }, []);

  // ── UPDATE STATS ──
  const updateStats = useCallback((allLogs: LogEntry[]) => {
    const total = allLogs.length;
    const success = allLogs.filter(l => l.status === 'success').length;
    const error = allLogs.filter(l => l.status === 'error').length;
    const empty = allLogs.filter(l => l.status === 'empty').length;
    const totalVoters = allLogs.reduce((s, l) => s + l.resultCount, 0);
    const avgDuration = total > 0 ? Math.round(allLogs.reduce((s, l) => s + l.duration, 0) / total) : 0;
    setStats({ total, success, error, empty, totalVoters, avgDuration });
  }, []);

  // ── SINGLE MANUAL CALL ──
  const handleManualCall = async () => {
    if (!wardId || !isDobValid || loading) return;
    setLoading(true);
    const log = await callApi(dob, wardId);
    setLogs(prev => {
      const updated = [log, ...prev];
      updateStats(updated);
      return updated;
    });
    if (log.voters.length > 0) {
      setSelectedVoters(log.voters);
      setSelectedDob(log.dob);
    }
    setLoading(false);
  };

  // ── AUTOMATION LOOP ──
  const runAutomation = useCallback(async () => {
    if (!isRunningRef.current) return;

    const currentDob = dobRef.current;
    const currentWard = wardRef.current;

    if (!currentWard || !/^\d{2}\/\d{2}\/\d{4}$/.test(currentDob)) {
      isRunningRef.current = false;
      setAutoState('idle');
      return;
    }

    setLoading(true);
    const log = await callApi(currentDob, currentWard);

    setLogs(prev => {
      const updated = [log, ...prev];
      updateStats(updated);
      return updated;
    });
    setAutoCallCount(prev => prev + 1);

    if (log.voters.length > 0) {
      setSelectedVoters(log.voters);
      setSelectedDob(log.dob);
    }

    setLoading(false);

    // Increment date for next call
    if (isRunningRef.current) {
      const nextDob = incrementDate(currentDob, incrementField);
      setDob(nextDob);
      dobRef.current = nextDob;
    }
  }, [callApi, incrementField, updateStats]);

  // ── START / STOP / PAUSE ──
  const startAutomation = useCallback(() => {
    if (!wardId || !isDobValid) return;
    isRunningRef.current = true;
    setAutoState('running');
    setAutoCallCount(0);

    // Run immediately first
    runAutomation();

    timerRef.current = setInterval(() => {
      if (isRunningRef.current) {
        runAutomation();
      }
    }, intervalMs);
  }, [wardId, isDobValid, intervalMs, runAutomation]);

  const pauseAutomation = useCallback(() => {
    isRunningRef.current = false;
    setAutoState('paused');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resumeAutomation = useCallback(() => {
    isRunningRef.current = true;
    setAutoState('running');
    runAutomation();
    timerRef.current = setInterval(() => {
      if (isRunningRef.current) runAutomation();
    }, intervalMs);
  }, [intervalMs, runAutomation]);

  const stopAutomation = useCallback(() => {
    isRunningRef.current = false;
    setAutoState('idle');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Manual DOB controls ──
  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) => setDob(formatDateInput(e.target.value));
  const stepUp = () => { if (isDobValid) setDob(incrementDate(dob, incrementField)); };
  const stepDown = () => { if (isDobValid) setDob(decrementDate(dob, incrementField)); };

  // ── Clear logs ──
  const clearLogs = () => {
    setLogs([]);
    setStats({ total: 0, success: 0, error: 0, empty: 0, totalVoters: 0, avgDuration: 0 });
    setAutoCallCount(0);
  };

  // ── Export logs ──
  const exportLogs = () => {
    const data = logs.map(l => ({
      time: l.timestamp.toISOString(),
      dob: l.dob,
      ward: l.ward,
      status: l.status,
      source: l.source,
      count: l.resultCount,
      duration: l.duration,
      message: l.message,
      voters: l.voters.map(v => ({ name: v.name, nid: v.voterNumber, father: v.fatherOrHusbandName })),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voter-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filtered logs ──
  const filteredLogs = filterStatus === 'all' ? logs : logs.filter(l => l.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#06060a] text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/[0.07] rounded-full blur-[180px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-[180px]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* ═══ TOP BAR ═══ */}
        <div className="sticky top-0 z-50 bg-[#06060a]/90 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/15 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white flex items-center gap-2">
                  DEV ENVIRONMENT
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                    autoState === 'running'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-pulse'
                      : autoState === 'paused'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        : 'text-gray-500 bg-white/[0.03] border-white/[0.06]'
                  }`}>
                    {autoState === 'running' ? '● RUNNING' : autoState === 'paused' ? '◉ PAUSED' : '○ IDLE'}
                  </span>
                </h1>
                <p className="text-[10px] text-gray-600">Voter API Automation Tool</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-2">
                {[
                  { label: 'Calls', value: stats.total, color: 'text-purple-400' },
                  { label: 'Found', value: stats.totalVoters, color: 'text-emerald-400' },
                  { label: 'Avg', value: `${stats.avgDuration}ms`, color: 'text-cyan-400' },
                ].map(s => (
                  <div key={s.label} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-[8px] text-gray-600 font-bold uppercase">{s.label}</p>
                    <p className={`text-[11px] font-black font-mono ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowDevPanel(!showDevPanel)}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer transition-colors"
              >
                <Settings className={`w-4 h-4 text-gray-400 transition-transform ${showDevPanel ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* ═══ LEFT: Controls ═══ */}
            <div className="lg:col-span-4 space-y-4">
              {/* ── Config Panel ── */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  <h2 className="text-xs font-bold text-white">কনফিগারেশন</h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Village Select */}
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      গ্রাম (Ward)
                    </label>
                    <CustomSelect value={wardId} onChange={setWardId} options={VILLAGES_NEW} />
                  </div>

                  {/* DOB Input + Controls */}
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      জন্ম তারিখ (DD/MM/YYYY)
                    </label>
                    <div className="flex items-center gap-2">
                      <button onClick={stepDown} disabled={!isDobValid || autoState === 'running'}
                        className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer transition-colors">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={dob}
                        onChange={handleDobChange}
                        disabled={autoState === 'running'}
                        placeholder="01/01/2000"
                        className="flex-1 px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm font-bold font-mono text-white text-center placeholder:text-gray-600 focus:outline-none focus:border-purple-500/30 disabled:opacity-50"
                      />
                      <button onClick={stepUp} disabled={!isDobValid || autoState === 'running'}
                        className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer transition-colors">
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    {isDobValid && (
                      <p className="mt-1.5 text-[9px] text-gray-600 text-center">
                        বাংলা: <span className="text-purple-400 font-bold font-mono">{convertToBanglaDOB(dob)}</span>
                      </p>
                    )}
                  </div>

                  {/* Increment Field */}
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      ইনক্রিমেন্ট ফিল্ড
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['day', 'month', 'year'] as IncrementField[]).map(f => (
                        <button
                          key={f}
                          onClick={() => setIncrementField(f)}
                          disabled={autoState === 'running'}
                          className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                            incrementField === f
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                              : 'bg-white/[0.03] text-gray-500 border-white/[0.05] hover:bg-white/[0.06]'
                          } disabled:opacity-50`}
                        >
                          {f === 'day' ? 'দিন' : f === 'month' ? 'মাস' : 'বছর'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interval */}
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>ইন্টারভাল</span>
                      <span className="text-purple-400 font-mono">{intervalMs / 1000}s</span>
                    </label>
                    <input
                      type="range"
                      min={500}
                      max={10000}
                      step={500}
                      value={intervalMs}
                      onChange={e => setIntervalMs(Number(e.target.value))}
                      disabled={autoState === 'running'}
                      className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[8px] text-gray-700">0.5s</span>
                      <span className="text-[8px] text-gray-700">10s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Action Buttons ── */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  কন্ট্রোল
                </h3>

                {/* Manual Call */}
                <button
                  onClick={handleManualCall}
                  disabled={!wardId || !isDobValid || loading || autoState === 'running'}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer transition-all"
                >
                  {loading && autoState === 'idle' ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> কল হচ্ছে...</>
                  ) : (
                    <><Search className="w-3.5 h-3.5 text-purple-400" /> ম্যানুয়াল কল</>
                  )}
                </button>

                {/* Auto Controls */}
                <div className="grid grid-cols-2 gap-2">
                  {autoState === 'idle' && (
                    <button
                      onClick={startAutomation}
                      disabled={!wardId || !isDobValid}
                      className="col-span-2 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-30 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4" /> অটো শুরু করুন
                    </button>
                  )}

                  {autoState === 'running' && (
                    <>
                      <button
                        onClick={pauseAutomation}
                        className="py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-amber-500/15 text-amber-400 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-all"
                      >
                        <Pause className="w-4 h-4" /> পজ
                      </button>
                      <button
                        onClick={stopAutomation}
                        className="py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-red-500/15 text-red-400 border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-all"
                      >
                        <Square className="w-4 h-4" /> স্টপ
                      </button>
                    </>
                  )}

                  {autoState === 'paused' && (
                    <>
                      <button
                        onClick={resumeAutomation}
                        className="py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-all"
                      >
                        <Play className="w-4 h-4" /> চালু
                      </button>
                      <button
                        onClick={stopAutomation}
                        className="py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-red-500/15 text-red-400 border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-all"
                      >
                        <Square className="w-4 h-4" /> স্টপ
                      </button>
                    </>
                  )}
                </div>

                {/* Auto Info */}
                {autoState !== 'idle' && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-500">কল সংখ্যা</span>
                      <span className="text-[11px] font-black font-mono text-purple-400">{autoCallCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-500">বর্তমান তারিখ</span>
                      <span className="text-[11px] font-bold font-mono text-white">{dob}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-500">ইনক্রিমেন্ট</span>
                      <span className="text-[10px] font-bold text-amber-400">
                        {incrementField === 'day' ? '+১ দিন' : incrementField === 'month' ? '+১ মাস' : '+১ বছর'}
                      </span>
                    </div>
                    {loading && (
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        API কল চলছে...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Stats Card ── */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3 h-3 text-cyan-400" />
                  পরিসংখ্যান
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: 'মোট কল', v: stats.total, c: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { l: 'সফল', v: stats.success, c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { l: 'খালি', v: stats.empty, c: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { l: 'ত্রুটি', v: stats.error, c: 'text-red-400', bg: 'bg-red-500/10' },
                    { l: 'মোট ভোটার', v: stats.totalVoters, c: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                    { l: 'গড় সময়', v: `${stats.avgDuration}ms`, c: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                  ].map(s => (
                    <div key={s.l} className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-[8px] text-gray-600 font-bold uppercase">{s.l}</p>
                      <p className={`text-sm font-black font-mono ${s.c} mt-0.5`}>{s.v}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                {stats.total > 0 && (
                  <div className="mt-3">
                    <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.03]">
                      {stats.success > 0 && (
                        <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.success / stats.total) * 100}%` }} />
                      )}
                      {stats.empty > 0 && (
                        <div className="bg-amber-500 transition-all" style={{ width: `${(stats.empty / stats.total) * 100}%` }} />
                      )}
                      {stats.error > 0 && (
                        <div className="bg-red-500 transition-all" style={{ width: `${(stats.error / stats.total) * 100}%` }} />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[8px] text-emerald-400 font-bold">{Math.round((stats.success / stats.total) * 100)}% সফল</span>
                      <span className="text-[8px] text-gray-600">{stats.total} কল</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ MIDDLE: Logs ═══ */}
            <div className="lg:col-span-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden h-full flex flex-col">
                {/* Log Header */}
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-xs font-bold text-white">লগ</h2>
                    <span className="text-[9px] font-bold text-gray-600 bg-white/[0.03] px-1.5 py-0.5 rounded font-mono">
                      {filteredLogs.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={exportLogs} disabled={logs.length === 0}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer disabled:opacity-30 transition-colors" title="Export">
                      <Download className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button onClick={clearLogs} disabled={logs.length === 0}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer disabled:opacity-30 transition-colors" title="Clear">
                      <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-3 py-2 border-b border-white/[0.04] flex items-center gap-1 shrink-0 overflow-x-auto">
                  {[
                    { key: 'all' as const, label: 'সব', count: logs.length },
                    { key: 'success' as const, label: 'সফল', count: stats.success },
                    { key: 'empty' as const, label: 'খালি', count: stats.empty },
                    { key: 'error' as const, label: 'ত্রুটি', count: stats.error },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFilterStatus(tab.key)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        filterStatus === tab.key
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                          : 'text-gray-600 hover:text-gray-400 border border-transparent'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {/* Log List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[300px] max-h-[calc(100vh-280px)]">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-16">
                      <Terminal className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                      <p className="text-[11px] text-gray-600 font-bold">কোনো লগ নেই</p>
                      <p className="text-[9px] text-gray-700 mt-1">API কল করলে এখানে দেখাবে</p>
                    </div>
                  ) : (
                    filteredLogs.map(log => (
                      <LogRow
                        key={log.id}
                        log={log}
                        expanded={expandedLog === log.id}
                        onToggle={() => {
                          setExpandedLog(expandedLog === log.id ? null : log.id);
                          if (log.voters.length > 0) {
                            setSelectedVoters(log.voters);
                            setSelectedDob(log.dob);
                          }
                        }}
                      />
                    ))
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>

            {/* ═══ RIGHT: Result Viewer ═══ */}
            <div className="lg:col-span-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden h-full flex flex-col">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-xs font-bold text-white">ফলাফল দেখুন</h2>
                    {selectedVoters.length > 0 && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                        {selectedVoters.length} জন
                      </span>
                    )}
                  </div>
                  {selectedDob && (
                    <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      {selectedDob}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[calc(100vh-280px)]">
                  {selectedVoters.length === 0 ? (
                    <div className="text-center py-16">
                      <Eye className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                      <p className="text-[11px] text-gray-600 font-bold">কোনো ফলাফল নেই</p>
                      <p className="text-[9px] text-gray-700 mt-1">লগে ক্লিক করলে ভোটার দেখাবে</p>
                    </div>
                  ) : (
                    selectedVoters.map((voter, i) => (
                      <MiniVoterCard key={voter._id || i} voter={voter} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ FLOATING LIVE INDICATOR ═══ */}
        {autoState === 'running' && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_0.3s_ease]">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#12121c]/95 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-black/50">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
              </div>
              <span className="text-xs font-bold text-white">অটো চলছে</span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{dob}</span>
              <span className="text-[10px] font-mono text-gray-500">#{autoCallCount}</span>
              <button
                onClick={stopAutomation}
                className="ml-2 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/20 cursor-pointer hover:bg-red-500/25 transition-colors"
              >
                স্টপ
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}