import React, { useEffect, useState, useMemo } from 'react';
import { 
  Folder, Clock, CheckCircle2, ShieldAlert, FileText, 
  Phone, Users, MapPin, Smartphone, PlusCircle, ArrowRight 
} from 'lucide-react';
import { db, type Case } from '../../../utils/db';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';

interface GlobalDashboardProps {
  onAddNewCase: () => void;
  onViewCases: () => void;
  onOpenCase: (c: Case) => void;
}

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ 
  onAddNewCase, onViewCases, onOpenCase 
}) => {
  const { role, maxCases, maxFiles, createdCasesCount, uploadedFilesCount, validUntil } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [analyzedNumbersCount, setAnalyzedNumbersCount] = useState(0);
  const [commonNumbersCount, setCommonNumbersCount] = useState(0);
  const [locationsCount, setLocationsCount] = useState(0);
  const [frequentLocations, setFrequentLocations] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<{ date: string; volume: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; volume: number }[]>([]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const casesData = await db.cases.toArray();
      setCases(casesData);

      const filesCount = await db.cdrFiles.count();
      setTotalFilesCount(filesCount);

      const records = await db.cdrRecords.toArray();

      // Unique phone numbers
      const uniqueParties = new Set(records.map(r => r.otherParty).filter(Boolean));
      setAnalyzedNumbersCount(uniqueParties.size);

      // Common numbers: connected across multiple cases
      const numberToCaseMap: { [num: string]: Set<number> } = {};
      records.forEach(r => {
        if (!r.otherParty) return;
        if (!numberToCaseMap[r.otherParty]) {
          numberToCaseMap[r.otherParty] = new Set();
        }
        numberToCaseMap[r.otherParty].add(r.caseId);
      });
      const commonCount = Object.values(numberToCaseMap).filter(casesSet => casesSet.size > 1).length;
      setCommonNumbersCount(commonCount);

      // Locations count
      const uniqueLocations = new Set(records.map(r => r.address).filter(Boolean));
      setLocationsCount(uniqueLocations.size);

      // Top frequent locations
      const locCountsMap: { [addr: string]: number } = {};
      records.forEach(r => {
        if (r.address) {
          locCountsMap[r.address] = (locCountsMap[r.address] || 0) + 1;
        }
      });
      const sortedLocs = Object.entries(locCountsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name, count }));
      setFrequentLocations(sortedLocs);


      // Calculate Daily and Hourly stats from records
      const dailyMap: { [dateStr: string]: number } = {};
      const hourlyMap: { [hour: string]: number } = {};

      const now = new Date();
      // Initialize dailyMap for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
        dailyMap[d.toISOString().split('T')[0]] = 0;
      }
      // Initialize hourlyMap for 0-23
      for (let i = 0; i < 24; i++) {
        hourlyMap[i.toString().padStart(2, '0') + ':00'] = 0;
      }

      records.forEach(r => {
        const date = new Date(r.timestamp);
        const dateStr = date.toISOString().split('T')[0];
        const hourStr = date.getHours().toString().padStart(2, '0') + ':00';
        
        if (dailyMap[dateStr] !== undefined) {
          dailyMap[dateStr]++;
        }
        if (hourlyMap[hourStr] !== undefined) {
          hourlyMap[hourStr]++;
        }
      });

      setDailyData(Object.entries(dailyMap).map(([date, volume]) => ({ date, volume })));
      setHourlyData(Object.entries(hourlyMap).map(([hour, volume]) => ({ hour, volume })));

    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Compute status metrics
  const totalCases = cases.length;
  const pendingCases = cases.filter(c => c.status === 'Pending').length;
  const activeCases = cases.filter(c => c.status === 'Active').length;
  const completedCases = cases.filter(c => c.status === 'Completed').length;

  const pendingPct = totalCases > 0 ? Math.round((pendingCases / totalCases) * 100) : 0;
  const activePct = totalCases > 0 ? Math.round((activeCases / totalCases) * 100) : 0;
  const completedPct = totalCases > 0 ? 100 - pendingPct - activePct : 0;

  // Max location count for bar chart scaling
  const maxLocCount = useMemo(() => {
    if (frequentLocations.length === 0) return 1;
    return Math.max(...frequentLocations.map(l => l.count));
  }, [frequentLocations]);

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Title Header Section */}
      <div className="space-y-1">
        <span className="text-sm font-bold tracking-widest text-[#3ecf8e] uppercase">
          CDR ANALYZER V5.2.0
        </span>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-100 tracking-tight">
          Investigation Command Center
        </h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Professional forensic intelligence dashboard, real-time case & CDR analytics
        </p>
      </div>

      {/* Account Resource Limits Banner */}
      {role === 'user' && (
        <div className="bg-[#1e1e21] border border-[#2b2b30] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans text-xs">
          <div className="space-y-1">
            <h4 className="font-semibold text-gray-200">Account Resources & Limits</h4>
            <p className="text-gray-500 font-mono text-[11px]">
              Access Valid Until: <span className="text-gray-300 font-bold">{validUntil ? new Date(validUntil.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
            </p>
          </div>
          <div className="flex gap-6 items-center w-full sm:w-auto">
            {/* Case limit */}
            <div className="space-y-1 flex-1 sm:flex-none sm:w-40">
              <div className="flex justify-between text-gray-400 font-mono text-[11px] mb-1">
                <span>Cases Created</span>
                <span className="font-bold text-gray-300">{createdCasesCount} / {maxCases}</span>
              </div>
              <div className="w-full bg-[#141416] rounded-full h-1.5 overflow-hidden border border-[#27272a]">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    createdCasesCount >= maxCases ? 'bg-red-500' : 'bg-[#3ecf8e]'
                  }`} 
                  style={{ width: `${Math.min(100, (createdCasesCount / Math.max(1, maxCases)) * 100)}%` }} 
                />
              </div>
            </div>
            {/* File limit */}
            <div className="space-y-1 flex-1 sm:flex-none sm:w-40">
              <div className="flex justify-between text-gray-400 font-mono text-[11px] mb-1">
                <span>Files Uploaded</span>
                <span className="font-bold text-gray-300">{uploadedFilesCount} / {maxFiles}</span>
              </div>
              <div className="w-full bg-[#141416] rounded-full h-1.5 overflow-hidden border border-[#27272a]">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    uploadedFilesCount >= maxFiles ? 'bg-red-500' : 'bg-[#3ecf8e]'
                  }`} 
                  style={{ width: `${Math.min(100, (uploadedFilesCount / Math.max(1, maxFiles)) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8 Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Total Cases */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 rounded-xl p-4 transition-all duration-150">
          <div className="flex justify-between items-start">
            <h3 className="text-3xl font-semibold text-gray-150 font-mono tracking-tight">
              {totalCases}
            </h3>
            <div className="h-7 w-7 rounded-lg bg-[#1e1e1e] flex items-center justify-center border border-[#2e2e2e]">
              <Folder className="h-4 w-4 text-[#3ecf8e]" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mt-2">
            Total Cases
          </span>
        </div>

        {/* Metric 2: Pending Cases */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 rounded-xl p-4 transition-all duration-150">
          <div className="flex justify-between items-start">
            <h3 className="text-3xl font-semibold text-gray-150 font-mono tracking-tight">
              {pendingCases}
            </h3>
            <div className="h-7 w-7 rounded-lg bg-[#3ecf8e]/10 flex items-center justify-center border border-amber-500/15">
              <Clock className="h-4 w-4 text-amber-455" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mt-2">
            Pending Cases
          </span>
        </div>

        {/* Metric 3: Completed Cases */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 rounded-xl p-4 transition-all duration-150">
          <div className="flex justify-between items-start">
            <h3 className="text-3xl font-semibold text-gray-150 font-mono tracking-tight">
              {completedCases}
            </h3>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/15">
              <CheckCircle2 className="h-4 w-4 text-brand-emerald" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mt-2">
            Completed Cases
          </span>
        </div>

        {/* Metric 4: Active Investigations */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 rounded-xl p-4 transition-all duration-150">
          <div className="flex justify-between items-start">
            <h3 className="text-3xl font-semibold text-gray-150 font-mono tracking-tight">
              {activeCases}
            </h3>
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/15">
              <ShieldAlert className="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mt-2">
            Active Investigations
          </span>
        </div>

        {/* Metric 5: Total Uploaded CDRs */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 rounded-xl p-4 transition-all duration-150">
          <div className="flex justify-between items-start">
            <h3 className="text-3xl font-semibold text-gray-150 font-mono tracking-tight">
              {totalFilesCount}
            </h3>
            <div className="h-7 w-7 rounded-lg bg-[#1e1e1e] flex items-center justify-center border border-[#2e2e2e]">
              <FileText className="h-4 w-4 text-[#3ecf8e]" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mt-2">
            Total Uploaded CDRs
          </span>
        </div>

        {/* Metric 6: Analyzed Numbers */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 rounded-xl p-4 transition-all duration-150">
          <div className="flex justify-between items-start">
            <h3 className="text-3xl font-semibold text-gray-150 font-mono tracking-tight">
              {analyzedNumbersCount.toLocaleString()}
            </h3>
            <div className="h-7 w-7 rounded-lg bg-[#1e1e1e] flex items-center justify-center border border-[#2e2e2e]">
              <Phone className="h-4 w-4 text-[#3ecf8e]" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mt-2">
            Analyzed Numbers
          </span>
        </div>

        {/* Metric 7: Common Numbers */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 rounded-xl p-4 transition-all duration-150">
          <div className="flex justify-between items-start">
            <h3 className="text-3xl font-semibold text-gray-150 font-mono tracking-tight">
              {commonNumbersCount}
            </h3>
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/15">
              <Users className="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mt-2">
            Common Numbers
          </span>
        </div>

        {/* Metric 8: Locations Tracked */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 rounded-xl p-4 transition-all duration-150">
          <div className="flex justify-between items-start">
            <h3 className="text-3xl font-semibold text-gray-150 font-mono tracking-tight">
              {locationsCount.toLocaleString()}
            </h3>
            <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/15">
              <MapPin className="h-4 w-4 text-teal-400" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mt-2">
            Locations Tracked
          </span>
        </div>
      </div>

      {/* Action Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Action 1: IMEI Info */}
        <div className="bg-[#0a0e24]/40 hover:bg-[#0a0e24]/60 border border-[#2e2e2e] hover:border-[#2e2e2e] rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 group relative">
          <div className="h-10 w-10 bg-purple-500/15 border border-purple-500/25 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0">
            <Smartphone className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0 pr-6 text-left">
            <h4 className="font-bold text-gray-200">IMEI Info</h4>
            <p className="text-sm text-gray-500 mt-1 truncate">
              Look up device details from TAC database
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-655 group-hover:text-purple-400 absolute right-5 group-hover:translate-x-1 transition-all duration-200" />
        </div>

        {/* Action 2: Add New Case */}
        <div 
          onClick={onAddNewCase}
          className="bg-[#0a0e24]/40 hover:bg-[#0a0e24]/60 border border-[#2e2e2e] hover:border-[#2e2e2e] rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 group relative cursor-pointer"
        >
          <div className="h-10 w-10 bg-[#3ecf8e]/15 border border-[#3ecf8e]/25 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0">
            <PlusCircle className="h-5 w-5 text-[#3ecf8e]" />
          </div>
          <div className="flex-1 min-w-0 pr-6 text-left">
            <h4 className="font-bold text-gray-200">Add New Case</h4>
            <p className="text-sm text-gray-500 mt-1 truncate">
              Register FIR, assign IO, start investigation
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-655 group-hover:text-[#3ecf8e] absolute right-5 group-hover:translate-x-1 transition-all duration-200" />
        </div>

        {/* Action 3: View All Cases */}
        <div 
          onClick={onViewCases}
          className="bg-[#0a0e24]/40 hover:bg-[#0a0e24]/60 border border-[#2e2e2e] hover:border-[#2e2e2e] rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 group relative cursor-pointer"
        >
          <div className="h-10 w-10 bg-[#3ecf8e]/15 border border-[#3ecf8e]/25 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0">
            <Folder className="h-5 w-5 text-[#3ecf8e]" />
          </div>
          <div className="flex-1 min-w-0 pr-6 text-left">
            <h4 className="font-bold text-gray-200">View All Cases</h4>
            <p className="text-sm text-gray-500 mt-1 truncate">
              Search, filter & open case workspaces
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-655 group-hover:text-[#3ecf8e] absolute right-5 group-hover:translate-x-1 transition-all duration-200" />
        </div>
      </div>

      {/* Middle Row: Progress and Locations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Investigation Progress */}
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl p-5 backdrop-blur-xl">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-4">
            Investigation Progress
          </h4>
          <div className="flex flex-col items-center justify-center">
            {/* SVG Donut */}
            <div className="relative h-32 w-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1d2238" strokeWidth="2.5" />
                {totalCases > 0 ? (
                  <>
                    {/* Pending Pct - Blue */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3" 
                      strokeDasharray={`${pendingPct} ${100 - pendingPct}`} 
                      strokeDashoffset="0" 
                    />
                    {/* Active Pct - Green */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3" 
                      strokeDasharray={`${activePct} ${100 - activePct}`} 
                      strokeDashoffset={`-${pendingPct}`} 
                    />
                    {/* Completed Pct - Yellow */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3" 
                      strokeDasharray={`${completedPct} ${100 - completedPct}`} 
                      strokeDashoffset={`-${pendingPct + activePct}`} 
                    />
                  </>
                ) : null}
              </svg>
              {/* Inner Label */}
              <div className="absolute text-center">
                <span className="text-sm text-gray-500 uppercase tracking-wider block">Completed</span>
                <span className="text-md font-semibold text-gray-250 font-mono">{completedPct}%</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 mt-5 text-sm font-bold text-gray-400 font-mono text-center border-t border-[#1e1e1e] pt-3">
              <div>
                <span className="block text-[#3ecf8e]">Pending</span>
                <span className="text-gray-300 block mt-0.5">{pendingPct}%</span>
              </div>
              <div className="border-x border-[#1e1e1e]">
                <span className="block text-brand-emerald">Active</span>
                <span className="text-gray-300 block mt-0.5">{activePct}%</span>
              </div>
              <div>
                <span className="block text-amber-500">Completed</span>
                <span className="text-gray-300 block mt-0.5">{completedPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Most Active Cases */}
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl p-5 backdrop-blur-xl">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-4">
            Most Active Cases
          </h4>
          <div className="space-y-2.5">
            {cases.slice(0, 4).map((c, idx) => (
              <div 
                key={idx}
                onClick={() => onOpenCase(c)}
                className="p-3 bg-[#0a0e24]/40 border border-[#1e1e1e] hover:border-[#2e2e2e] rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-gray-200 group-hover:text-[#3ecf8e] truncate">{c.title}</h5>
                  <span className="text-sm text-gray-500 font-medium font-mono block mt-0.5">{c.caseIdString}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-sm font-bold font-mono ${
                  c.status === 'Completed' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' :
                  c.status === 'Active' ? 'bg-blue-950/30 text-blue-400 border border-blue-800/20' :
                  'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
            {cases.length === 0 && (
              <div className="py-8 text-center text-gray-500 text-sm">
                No cases registered yet.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Frequent Locations */}
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl p-5 backdrop-blur-xl">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-4">
            Frequent Locations
          </h4>
          <div className="h-32 flex items-end justify-between gap-2.5 pt-3">
            {frequentLocations.length > 0 ? (
              frequentLocations.map((loc, idx) => {
                const heightPct = Math.max(10, Math.round((loc.count / maxLocCount) * 90));
                return (
                  <div key={idx} title={`${loc.name}: ${loc.count}`} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div 
                      className="w-full bg-brand-emerald/20 border-t border-brand-emerald rounded-t-sm transition-all duration-300 group-hover:bg-brand-emerald/35"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-sm text-gray-400 font-bold font-mono truncate max-w-full">
                      {loc.name.split(',')[0]}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-medium pb-8">No location data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Software Usage and Active Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Software Usage (Daily) */}
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl p-5 backdrop-blur-xl text-left">
                              <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest block">
              CDR Activity (Hourly)
            </h4>
            <p className="text-sm text-gray-400 block mt-0.5">
              Aggregated call frequency by hour of day
            </p>
          </div>

          <div className="h-36 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorPurple)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
