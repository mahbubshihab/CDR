import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, FileText, Upload, Search, Smartphone, ShieldAlert,
  Database, Server, Compass, MapPin, LayoutDashboard, BarChart3,
  Layers, UserCheck, Globe, Clock, Sun, TrendingUp, Calendar, 
  Users, Pin, Unlock, Camera, Download, Printer, CheckCircle, Menu,
  Home, Radio, LineChart, Settings
} from 'lucide-react';
import { db, type Case, type CDRFile, type CDRRecord } from '../../../utils/db';
import { CaseOverview } from '../subfeatures/case-overview/CaseOverview';
import { UploadCDRModal } from './UploadCDRModal';
import { ExecutiveDashboard } from '../subfeatures/executive-dashboard/ExecutiveDashboard';
import { AdvancedCDRAnalysis } from '../subfeatures/advanced-analysis/AdvancedCDRAnalysis';
import { GraphAnalytics } from '../subfeatures/graph-analytics/GraphAnalytics';
import { RawCDRLogs } from '../subfeatures/raw-logs/RawCDRLogs';
import { MfcAnalysis } from '../subfeatures/mfc-analysis/MfcAnalysis';
import { NetworkAnalysis } from '../subfeatures/network-analysis/NetworkAnalysis';
import { OwnershipIntelligence } from '../subfeatures/ownership-intelligence/OwnershipIntelligence';
import { InternationalIntelligence } from '../subfeatures/international-intelligence/InternationalIntelligence';
import { ImeiSummary } from '../subfeatures/imei-summary/ImeiSummary';
import { ImsiSummary } from '../subfeatures/imsi-summary/ImsiSummary';
import { LocationSummary } from '../subfeatures/location-summary/LocationSummary';
import { LocationIntelligence } from '../subfeatures/location-intelligence/LocationIntelligence';
import { SearchCDRLogs } from '../subfeatures/search-cdr-logs/SearchCDRLogs';
import { MfcCellTowerMapping } from '../subfeatures/mfc-cell-tower/MfcCellTowerMapping';
import { ImeiImsiSummary } from '../subfeatures/imei-imsi-summary/ImeiImsiSummary';

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
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/file/')) {
        const fileId = parseInt(hash.replace('#/file/', ''), 10);
        if (!isNaN(fileId)) {
          setActiveTargetFileId(fileId);
          setLoadingRecords(true);
          try {
            const f = await db.cdrFiles.get(fileId);
            if (f) {
              setTargetFile(f);
              const recs = await db.cdrRecords.where('fileId').equals(fileId).toArray();
              // Sort records chronologically
              recs.sort((a, b) => a.timestamp - b.timestamp);
              setTargetRecords(recs);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setLoadingRecords(false);
          }
        }
      } else {
        setActiveTargetFileId(null);
        setTargetFile(null);
        setTargetRecords([]);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigation handlers
  const handleOpenTargetFile = (fileId: number) => {
    window.location.hash = `#/file/${fileId}`;
  };

  const handleCloseTargetWorkspace = () => {
    window.location.hash = '';
  };

  // Case Overview Sidebar elements list (Restore original!)
  const caseTabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'add-cdr', name: 'Add CDR Spreadsheet', icon: Upload, action: () => setIsUploadOpen(true) },
    { id: 'search', name: 'Search CDR Logs', icon: Search },
    { id: 'mfc', name: 'MFC Cell Tower Mapping', icon: MapPin },
    { id: 'imei', name: 'IMEI / IMSI Summary', icon: Smartphone }
  ];

  // Investigation Workspace Sidebar Navigation tabs (Grouped list exactly matching Pakistani site)
  const analysisModules = [
    { id: 'dashboard', name: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'advanced', name: 'Advanced CDR Analysis', icon: ShieldAlert },
    { id: 'graph', name: 'Graph Analytics', icon: BarChart3 },
    { id: 'raw', name: 'Raw CDR Data', icon: Database },
    { id: 'mfc', name: 'MFC Analysis', icon: Server },
    { id: 'network', name: 'Network Analysis', icon: Compass },
    { id: 'ownership', name: 'Ownership Intelligence', icon: UserCheck },
    { id: 'international', name: 'International Intelligence', icon: Globe },
    { id: 'imei', name: 'IMEI Summary', icon: Smartphone },
    { id: 'imsi', name: 'IMSI Summary', icon: Radio },
    { id: 'locations', name: 'Location Summary', icon: MapPin },
    { id: 'loc_intel', name: 'Location Intelligence', icon: MapPin }
  ];

  // Render Investigation Workspace when a target phone/file is active
  if (activeTargetFileId && targetFile) {
    if (loadingRecords) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#3ecf8e] border-r-2 border-transparent mb-4"></div>
          <span className="text-xs font-semibold font-mono uppercase tracking-wider">Syncing Case Records...</span>
        </div>
      );
    }

    return (
      <div className="flex h-full w-full overflow-hidden bg-transparent">
        {/* 1. Sidebar Nav (Single column, Supabase styled) */}
        <aside className={`transition-all duration-300 border-r border-[#2e2e2e] bg-[#171717] flex flex-col justify-between shrink-0 h-full ${isSidebarCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-56'}`}>
          <div className="flex flex-col h-full text-left">
            {/* Active Phone Target Header - Supabase Project Style */}
            <div className="p-4 border-b border-[#2e2e2e] bg-[#141414]/30">
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">
                Target A-Party Number
              </span>
              <h3 className="font-semibold text-gray-200 text-sm mt-0.5 font-mono select-all">
                {targetFile.phoneNumber}
              </h3>
              <span className="text-[11px] text-gray-400 font-mono block mt-1 truncate max-w-full font-bold">
                {targetFile.operator} · {targetFile.category}
              </span>
            </div>

            {/* Scrollable list of analysis options */}
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
                        : 'text-gray-450 hover:bg-[#1c1c1c]/50 hover:text-gray-200'
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#3ecf8e]' : 'text-gray-500'}`} />
                    <span className="text-xs">{module.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* 2. Main content area switcher */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212] text-left">
          {/* Top toolbar */}
          <div className="p-4 border-b border-[#2e2e2e] bg-[#171717] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-250 rounded-lg cursor-pointer transition-colors"
                title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
              <div>
                <h2 className="text-sm font-semibold text-gray-200">
                  Forensic Intelligence Workspace
                </h2>
              </div>
            </div>

            {/* Dashboard top Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg p-1">
                <button className="p-1.5 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-200 rounded text-xs font-mono font-semibold cursor-pointer">CSV</button>
                <button className="p-1.5 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-200 rounded text-xs font-mono font-semibold cursor-pointer">Excel</button>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
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
            ) : activeAnalysisTab === 'graph' ? (
              <GraphAnalytics 
                cdrFile={targetFile}
                records={targetRecords}
              />
            ) : activeAnalysisTab === 'raw' ? (
              <RawCDRLogs 
                cdrFile={targetFile}
                records={targetRecords}
              />
            ) : activeAnalysisTab === 'mfc' ? (
              <MfcAnalysis cdrFile={targetFile} />
            ) : activeAnalysisTab === 'network' ? (
              <NetworkAnalysis cdrFile={targetFile} />
            ) : activeAnalysisTab === 'ownership' ? (
              <OwnershipIntelligence cdrFile={targetFile} />
            ) : activeAnalysisTab === 'international' ? (
              <InternationalIntelligence cdrFile={targetFile} />
            ) : activeAnalysisTab === 'imei' ? (
              <ImeiSummary cdrFile={targetFile} />
            ) : activeAnalysisTab === 'imsi' ? (
              <ImsiSummary cdrFile={targetFile} />
            ) : activeAnalysisTab === 'locations' ? (
              <LocationSummary cdrFile={targetFile} />
            ) : activeAnalysisTab === 'loc_intel' ? (
              <LocationIntelligence cdrFile={targetFile} />
            ) : (
              // General Fallback
              <div className="w-full h-full overflow-y-auto p-5 md:p-6 custom-scrollbar flex items-center justify-center bg-[#121212]">
                <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-8 text-center max-w-md mx-auto space-y-3.5">
                  <Database className="h-8 w-8 text-[#3ecf8e] mx-auto" />
                  <h3 className="font-bold text-gray-300">
                    {analysisModules.find(m => m.id === activeAnalysisTab)?.name}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
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
      {/* 1. Case Overview Sidebar */}
      <aside className={`transition-all duration-300 border-r border-[#2e2e2e] bg-[#171717] flex flex-col justify-between shrink-0 h-full ${isSidebarCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-56'}`}>
        <div className="flex flex-col h-full text-left">
          {/* Back trigger */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-3 border-b border-[#2e2e2e] text-gray-400 hover:text-gray-250 transition-colors font-medium text-xs uppercase tracking-wider text-left cursor-pointer bg-[#141414]/45"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Cases</span>
          </button>

          {/* Active Case Header */}
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

          {/* Sub menu list */}
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
            <SearchCDRLogs activeCase={activeCase} />
          ) : activeCaseTab === 'mfc' ? (
            <MfcCellTowerMapping activeCase={activeCase} />
          ) : activeCaseTab === 'imei' ? (
            <ImeiImsiSummary activeCase={activeCase} />
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
