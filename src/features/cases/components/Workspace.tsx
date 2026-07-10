import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, FileText, Upload, Search, Smartphone, ShieldAlert,
  Database, Server, Compass, MapPin, LayoutDashboard, BarChart3,
  Layers, UserCheck, Globe, Clock, Sun, TrendingUp, Calendar, 
  Users, Pin, Unlock, Camera, Download, Printer, CheckCircle, Menu,
  Home, Radio, LineChart, Settings
} from 'lucide-react';
import { db, type Case, type CDRFile, type CDRRecord } from '../../../utils/db';
import { CaseOverview } from './CaseOverview';
import { UploadCDRModal } from './UploadCDRModal';
import { AdvancedCDRAnalysis } from './AdvancedCDRAnalysis';
import { ExecutiveDashboard } from './ExecutiveDashboard';

interface WorkspaceProps {
  activeCase: Case;
  onBack: () => void;
  onTriggerRefresh: () => void;
  onOpenEditModal: (c: Case) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ 
  activeCase, onBack, onTriggerRefresh, onOpenEditModal 
}) => {
  // Hash-based target file router
  const [activeTargetFileId, setActiveTargetFileId] = useState<number | null>(null);
  
  // Navigation active tabs (Overview sidebar vs Investigation Sidebar)
  const [activeCaseTab, setActiveCaseTab] = useState<'overview' | 'add-cdr' | 'search' | 'mfc' | 'imei'>('overview');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('dashboard');
  const [activeGroup, setActiveGroup] = useState<'overview' | 'database' | 'auth' | 'realtime' | 'observability'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [targetFile, setTargetFile] = useState<CDRFile | null>(null);
  const [targetRecords, setTargetRecords] = useState<CDRRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Sync hash routing for active target file
  useEffect(() => {
    const parseFileHash = () => {
      const hash = window.location.hash;
      const parts = hash.split('/');
      // Format: #/case/:caseId/file/:fileId
      if (parts[3] === 'file' && parts[4]) {
        const fileId = parseInt(parts[4], 10);
        if (!isNaN(fileId)) {
          setActiveTargetFileId(fileId);
          return;
        }
      }
      setActiveTargetFileId(null);
    };

    window.addEventListener('hashchange', parseFileHash);
    parseFileHash();
    return () => window.removeEventListener('hashchange', parseFileHash);
  }, []);

  // Fetch active file metadata and records
  useEffect(() => {
    if (activeTargetFileId) {
      setLoadingRecords(true);
      db.cdrFiles.get(activeTargetFileId).then(file => {
        if (file) {
          setTargetFile(file);
          db.cdrRecords.where('fileId').equals(activeTargetFileId).toArray().then(recs => {
            setTargetRecords(recs);
            setLoadingRecords(false);
          });
        } else {
          setTargetFile(null);
          setTargetRecords([]);
          setLoadingRecords(false);
        }
      }).catch(() => setLoadingRecords(false));
    } else {
      setTargetFile(null);
      setTargetRecords([]);
    }
  }, [activeTargetFileId]);

  // Sidebar Tabs for Case Overview shell
  const caseTabs = [
    { id: 'overview', name: 'Case overview', icon: FileText },
    { id: 'add-cdr', name: 'Add CDR', icon: Upload, action: () => setIsUploadOpen(true) },
    { id: 'search', name: 'Search CDR', icon: Search },
    { id: 'mfc', name: 'MFC / IMF', icon: Compass },
    { id: 'imei', name: 'IMEI summary', icon: Smartphone },
  ];

  // Sidebar Analysis Modules for Investigation Workspace shell (as in screenshots)
  const analysisModules = [
    { id: 'dashboard', name: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'advanced', name: 'Advanced CDR Analysis', icon: BarChart3 },
    { id: 'graph', name: 'Graph Analytics', icon: Compass },
    { id: 'raw', name: 'Raw CDR Data', icon: Database },
    { id: 'mfc_anal', name: 'MFC Analysis', icon: Compass },
    { id: 'network', name: 'Network Analysis', icon: Layers },
    { id: 'ownership', name: 'Ownership Intelligence', icon: UserCheck },
    { id: 'international', name: 'International Intelligence', icon: Globe },
    { id: 'service', name: 'Service & Company Numb...', icon: ShieldAlert },
    { id: 'imei_sum', name: 'IMEI Summary', icon: Smartphone },
    { id: 'imsi_sum', name: 'IMSI Summary', icon: Layers },
    { id: 'imei_pat', name: 'IMEI Patterns', icon: Smartphone },
    { id: 'imsi_pat', name: 'IMSI Patterns', icon: Layers },
    { id: 'first_last', name: 'First / Last Call', icon: Clock },
    { id: 'loc_sum', name: 'Location Summary', icon: MapPin },
    { id: 'loc_intel', name: 'Location Intelligence', icon: Compass },
    { id: 'day_locs', name: 'Day Locations', icon: Sun },
    { id: 'day_calls', name: 'Day Calls', icon: Sun },
    { id: 'night_locs', name: 'Night Locations', icon: Clock },
    { id: 'night_calls', name: 'Night Calls', icon: Clock },
    { id: 'movement', name: 'Movement Chart', icon: TrendingUp },
    { id: 'cell_changes', name: 'Cell ID Changes', icon: MapPin },
    { id: 'loc_changes', name: 'Location Changes', icon: MapPin },
    { id: 'missing_dates', name: 'Missing Dates', icon: Calendar },
    { id: 'timeline', name: 'Interactive Timeline', icon: Clock },
    { id: 'link_anal', name: 'Link Analysis', icon: Users },
    { id: 'geo_intel', name: 'Geo Intelligence', icon: Globe },
    { id: 'reports_dl', name: 'Reports & Downloads', icon: FileText }
  ];

  const activeAnalysisModules = useMemo(() => {
    if (activeGroup === 'overview') {
      return analysisModules.filter(m => ['dashboard', 'advanced', 'raw', 'reports_dl'].includes(m.id));
    }
    if (activeGroup === 'database') {
      return analysisModules.filter(m => ['loc_sum', 'loc_intel', 'day_locs', 'night_locs', 'cell_changes', 'loc_changes'].includes(m.id));
    }
    if (activeGroup === 'auth') {
      return analysisModules.filter(m => ['imei_sum', 'imsi_sum', 'imei_pat', 'imsi_pat'].includes(m.id));
    }
    if (activeGroup === 'realtime') {
      return analysisModules.filter(m => ['first_last', 'day_calls', 'night_calls', 'missing_dates', 'timeline', 'movement'].includes(m.id));
    }
    if (activeGroup === 'observability') {
      return analysisModules.filter(m => ['network', 'graph', 'ownership', 'international', 'service', 'link_anal', 'geo_intel'].includes(m.id));
    }
    return [];
  }, [activeGroup]);

  const handleGroupClick = (groupId: 'overview' | 'database' | 'auth' | 'realtime' | 'observability') => {
    setActiveGroup(groupId);
    if (groupId === 'overview') setActiveAnalysisTab('dashboard');
    else if (groupId === 'database') setActiveAnalysisTab('loc_sum');
    else if (groupId === 'auth') setActiveAnalysisTab('imei_sum');
    else if (groupId === 'realtime') setActiveAnalysisTab('first_last');
    else if (groupId === 'observability') setActiveAnalysisTab('network');
  };

  // Helper trigger to load target file
  const handleOpenTargetFile = (fileId: number) => {
    window.location.hash = `#/case/${activeCase.id}/file/${fileId}`;
  };

  const handleCloseTargetWorkspace = () => {
    window.location.hash = `#/case/${activeCase.id}`;
  };

  // If in Investigation Workspace Mode (target file is selected)
  if (activeTargetFileId && targetFile) {
    return (
      <div className="flex h-full w-full overflow-hidden bg-transparent">
        {/* 1. Investigation Workspace Sidebar (Single column, Supabase styled) */}
        <aside className={`transition-all duration-300 border-r border-[#2e2e2e] bg-[#171717] flex flex-col shrink-0 h-full ${isSidebarCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-56'}`}>
          <div className="flex flex-col h-full text-left">
            {/* Exit / Back trigger */}
            <button 
              onClick={handleCloseTargetWorkspace}
              className="flex items-center gap-2 px-4 py-3 border-b border-[#2e2e2e] text-gray-400 hover:text-gray-250 transition-colors font-medium text-xs uppercase tracking-wider text-left cursor-pointer bg-[#141414]/40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Exit Workspace</span>
            </button>

            {/* Case Details Header - Supabase Project Style */}
            <div className="p-4 border-b border-[#2e2e2e]">
              <span className="font-mono text-xs text-gray-500 uppercase tracking-wider block">
                {activeCase.caseIdString}
              </span>
              <h3 className="font-semibold text-gray-200 text-sm mt-0.5 truncate">
                {activeCase.title}
              </h3>
              <span className="text-[11px] text-[#3ecf8e] font-mono block mt-1 truncate max-w-full opacity-80 select-all">
                https://{activeCase.id || 'case'}.supabase.co
              </span>
            </div>

            {/* Sub modules list (Original elements list!) */}
            <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
              {analysisModules.map(module => {
                const Icon = module.icon;
                const isActive = activeAnalysisTab === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveAnalysisTab(module.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-left transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#2e2e2e] text-white'
                        : 'text-gray-400 hover:bg-[#1c1c1c]/50 hover:text-gray-200'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#3ecf8e]' : 'text-gray-500'}`} />
                    <span className="text-xs truncate">{module.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* 2. Right Workspace main viewport */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212]">
          
          {/* Main Top Header Details (Suspect Phone details) */}
          <div className="p-4 border-b border-[#2e2e2e] bg-[#171717] flex flex-col gap-3 shrink-0 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3 text-left">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-1.5 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-250 rounded-lg cursor-pointer transition-colors shrink-0"
                  title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>
                <div>
                  <span className="font-mono text-xs text-[#3ecf8e] tracking-wider uppercase block font-semibold">
                    Investigation Workspace
                  </span>
                  <h2 className="text-sm font-semibold text-gray-200 mt-0.5">
                    {targetFile.category} — {targetFile.phoneNumber}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-gray-400 font-semibold">
                    <span>{targetFile.phoneNumber}</span>
                    <span>·</span>
                    <span>{targetFile.recordsCount} rows</span>
                    <span>·</span>
                    <span className="text-[#3ecf8e]">
                      {analysisModules.find(m => m.id === activeAnalysisTab)?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons (Pin, Auto Hide, CSV, etc.) */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                <button className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 text-gray-400 hover:text-gray-250 rounded-lg transition-colors cursor-pointer">
                  <Pin className="h-3.5 w-3.5" />
                  <span>Pin</span>
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 text-gray-400 hover:text-gray-250 rounded-lg transition-colors cursor-pointer">
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Auto Hide</span>
                </button>
                <button className="p-1.5 bg-[#171717] border border-[#2e2e2e] hover:border-[#3ecf8e]/30 text-gray-400 hover:text-gray-250 rounded-lg cursor-pointer">
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <div className="h-4.5 w-px bg-[#2e2e2e]" />
                <button className="flex items-center gap-1 px-2.5 py-1.5 bg-[#046a38] border border-[#3ecf8e] text-white rounded-lg transition-colors cursor-pointer font-medium">
                  <Download className="h-3.5 w-3.5 text-white" />
                  <span>CSV</span>
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 bg-[#046a38] border border-[#3ecf8e] text-white rounded-lg transition-colors cursor-pointer font-medium">
                  <Download className="h-3.5 w-3.5 text-white" />
                  <span>Excel</span>
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 bg-[#046a38] border border-[#3ecf8e] text-white rounded-lg transition-colors cursor-pointer font-medium">
                  <Download className="h-3.5 w-3.5 text-white" />
                  <span>PDF Report</span>
                </button>
                <button 
                  onClick={handleCloseTargetWorkspace}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] border border-red-900/30 hover:border-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main workspace panels */}
          <main className="flex-1 overflow-hidden relative">
            {activeAnalysisTab === 'dashboard' ? (
              <ExecutiveDashboard 
                cdrFile={targetFile}
                records={targetRecords}
                onNavigateToTab={(tabId) => setActiveAnalysisTab(tabId)}
              />
            ) : activeAnalysisTab === 'advanced' ? (
              <AdvancedCDRAnalysis 
                cdrFile={targetFile}
                records={targetRecords}
              />
            ) : activeAnalysisTab === 'raw' ? (
              <div className="w-full h-full overflow-hidden flex flex-col p-6 text-left animate-in fade-in duration-300">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-255">Raw CDR Records Log</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Viewing raw spreadsheet logs for target A-Party phone
                  </p>
                </div>
                
                <div className="flex-1 min-h-0 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
                  <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar text-[12px]">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400 uppercase font-semibold tracking-wider text-[11px]">
                          <th className="py-2.5 px-4">Time</th>
                          <th className="py-2.5 px-4">B-Party (Contact)</th>
                          <th className="py-2.5 px-4">Duration</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4">IMEI</th>
                          <th className="py-2.5 px-4">IMSI</th>
                          <th className="py-2.5 px-4">Cell tower Address</th>
                          <th className="py-2.5 px-4">Carrier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2e2e2e]/50 font-mono">
                        {targetRecords.slice(0, 100).map((rec, idx) => (
                          <tr key={idx} className="hover:bg-[#171717]/30 transition-colors">
                            <td className="py-2.5 px-4 text-gray-300 truncate max-w-[120px]">{rec.timestamp}</td>
                            <td className="py-2.5 px-4 text-[#3ecf8e] font-semibold">{rec.otherParty}</td>
                            <td className="py-2.5 px-4 text-gray-300">{rec.duration}s</td>
                            <td className="py-2.5 px-4">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                rec.usageType.toLowerCase() === 'moc' ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20' :
                                rec.usageType.toLowerCase() === 'mtc' ? 'bg-orange-950/20 text-orange-400 border border-orange-800/20' :
                                'bg-emerald-950/20 text-emerald-400 border border-emerald-800/20'
                              }`}>
                                {rec.usageType}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-gray-300">{rec.imei || '—'}</td>
                            <td className="py-2.5 px-4 text-gray-300">{rec.imsi || '—'}</td>
                            <td className="py-2.5 px-4 text-gray-300 truncate max-w-[200px]">{rec.address || '—'}</td>
                            <td className="py-2.5 px-4 text-gray-300">{rec.provider || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {targetRecords.length > 100 && (
                      <div className="p-3 text-center bg-[#171717]/40 text-gray-400 border-t border-[#2e2e2e]">
                        Showing first 100 logs. Use exports to view full dataset.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Placeholder module view
              <div className="w-full h-full overflow-y-auto p-5 md:p-6 custom-scrollbar flex items-center justify-center">
                <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-8 text-center max-w-md mx-auto space-y-3.5">
                  <Database className="h-8 w-8 text-[#3ecf8e] mx-auto" />
                  <h3 className="font-bold text-gray-300">
                    {analysisModules.find(m => m.id === activeAnalysisTab)?.name}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    The "{analysisModules.find(m => m.id === activeAnalysisTab)?.name}" module workspace for phone target <strong className="text-[#3ecf8e] font-mono">{targetFile.phoneNumber}</strong> is configured. Detail views will activate in upcoming steps.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Else, in Case Overview Mode
  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      {/* 1. Case Overview Sidebar (Single column, Supabase styled) */}
      <aside className={`transition-all duration-300 border-r border-[#2e2e2e] bg-[#171717] flex flex-col justify-between shrink-0 h-full ${isSidebarCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-56'}`}>
        <div className="flex flex-col h-full text-left">
          {/* Back trigger */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-3 border-b border-[#2e2e2e] text-gray-400 hover:text-gray-250 transition-colors font-medium text-xs uppercase tracking-wider text-left cursor-pointer bg-[#141414]/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Cases</span>
          </button>

          {/* Active Case Header - Supabase Project Style */}
          <div className="p-4 border-b border-[#2e2e2e]">
            <span className="font-mono text-xs text-gray-500 uppercase tracking-wider block">
              {activeCase.caseIdString}
            </span>
            <h3 className="font-semibold text-gray-200 text-sm mt-0.5 truncate">
              {activeCase.title}
            </h3>
            <span className="text-[11px] text-[#3ecf8e] font-mono block mt-1 truncate max-w-full opacity-80 select-all">
              https://{activeCase.id || 'case'}.supabase.co
            </span>
          </div>

          {/* Sub menu list (Original elements list!) */}
          <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
            {caseTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeCaseTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.action) {
                      tab.action();
                    } else {
                      setActiveCaseTab(tab.id as any);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#2e2e2e] text-white'
                      : 'text-gray-450 hover:bg-[#1c1c1c]/50 hover:text-gray-200'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#3ecf8e]' : 'text-gray-500'}`} />
                  <span className="text-xs">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* 2. Main content area switcher */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212] text-left">
        {/* Case Overview header bar to house the sidebar toggle */}
        <div className="p-4 border-b border-[#2e2e2e] bg-[#171717] flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-250 rounded-lg cursor-pointer transition-colors shrink-0"
            title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-200">
              Case Workspace — {activeCase.title}
            </h2>
          </div>
        </div>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {activeCaseTab === 'overview' ? (
            <CaseOverview 
              activeCase={activeCase}
              onTriggerRefresh={onTriggerRefresh}
              onOpenEditModal={() => onOpenEditModal(activeCase)}
              onOpenTargetFileId={handleOpenTargetFile}
            />
          ) : activeCaseTab === 'search' ? (
            <div className="space-y-6 text-left animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-semibold text-gray-150">Search CDR Logs</h2>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider block mt-1">
                  Filter and query Call Detail Records dynamically
                </p>
              </div>
              
              <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-6 text-center max-w-md mx-auto space-y-3">
                <Search className="h-8 w-8 text-[#3ecf8e] mx-auto" />
                <h3 className="font-bold text-gray-300">Advanced Log Search</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  You can search dialer patterns, tower addresses, and durations. Upload a CDR sheet in the overview tab to begin searching case records.
                </p>
              </div>
            </div>
          ) : activeCaseTab === 'mfc' ? (
            <div className="space-y-6 text-left animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-semibold text-gray-150">MFC / IMF Cell Tower Mapping</h2>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider block mt-1">
                  Most Frequent Cell & Tower locations analysis
                </p>
              </div>

              <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-6 text-center max-w-md mx-auto space-y-3">
                <MapPin className="h-8 w-8 text-[#3ecf8e] mx-auto" />
                <h3 className="font-bold text-gray-300">Tower Coverage Profiler</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Profile towers by transit frequency to pinpoint candidate suspect hideouts, residence nodes, or workplace addresses dynamically.
                </p>
              </div>
            </div>
          ) : activeCaseTab === 'imei' ? (
            <div className="space-y-6 text-left animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-semibold text-gray-150">IMEI & IMSI Summary</h2>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider block mt-1">
                  Handset swaps and SIM exchange timeline profiles
                </p>
              </div>

              <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-6 text-center max-w-md mx-auto space-y-3">
                <Smartphone className="h-8 w-8 text-[#3ecf8e] mx-auto" />
                <h3 className="font-bold text-gray-300">Device Swap Tracker</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Identifies hardware transitions when multiple IMSI SIMs are used in a single IMEI device handset.
                </p>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Upload modal triggers */}
      {activeCase.id && (
        <UploadCDRModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          caseId={activeCase.id}
          onUploadSuccess={onTriggerRefresh}
        />
      )}
    </div>
  );
};
