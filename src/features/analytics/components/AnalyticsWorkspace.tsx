import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Download, Menu, Database, LayoutDashboard, 
  ShieldAlert, BarChart3, Server, Compass, UserCheck, 
  Globe, Smartphone, Radio, MapPin, User, Printer, Shield, Map, FileSpreadsheet, FileText,
  Phone, Cpu, Wifi, ChevronLeft, ChevronRight, PhoneCall, Sun, Moon
} from 'lucide-react';
import { db, type CDRFile, type CDRRecord } from '../../../utils/db';
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
import { ServiceNumbers } from '../subfeatures/service-numbers/ServiceNumbers';
import { ImeiPatterns } from '../subfeatures/imei-patterns/ImeiPatterns';
import { ImsiPatterns } from '../subfeatures/imsi-patterns/ImsiPatterns';
import { FirstLastCall } from '../subfeatures/first-last-call/FirstLastCall';
import { TimeCallsIntelligence } from '../subfeatures/time-based-intelligence/TimeCallsIntelligence';
import { TimeLocationsIntelligence } from '../subfeatures/time-based-intelligence/TimeLocationsIntelligence';
interface AnalyticsWorkspaceProps {
  targetFileId: number;
  onBack: () => void;
}

export const AnalyticsWorkspace: React.FC<AnalyticsWorkspaceProps> = ({ targetFileId, onBack }) => {
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [targetFile, setTargetFile] = useState<CDRFile | null>(null);
  const [targetRecords, setTargetRecords] = useState<CDRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync route data from Dexie db
  useEffect(() => {
    const fetchTargetData = async () => {
      setLoading(true);
      try {
        const fileRecord = await db.cdrFiles.get(targetFileId);
        if (fileRecord) {
          setTargetFile(fileRecord);
          const recs = await db.cdrRecords.where('fileId').equals(targetFileId).toArray();
          recs.sort((a, b) => a.timestamp - b.timestamp);
          setTargetRecords(recs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTargetData();
  }, [targetFileId]);

  const analysisModules = [
    { id: 'dashboard', name: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'advanced', name: 'Advanced CDR Analysis', icon: ShieldAlert },
    { id: 'graph', name: 'Graph Analytics', icon: BarChart3 },
    { id: 'raw', name: 'Raw CDR Data', icon: Database },
    { id: 'mfc', name: 'MFC Analysis', icon: Server },
    { id: 'network', name: 'Network Analysis', icon: Compass },
    { id: 'ownership', name: 'Ownership Intelligence', icon: UserCheck },
    { id: 'international', name: 'International Intelligence', icon: Globe },
    { id: 'service_numbers', name: 'Service & Company Numbers', icon: Phone },
    { id: 'imei', name: 'IMEI Summary', icon: Smartphone },
    { id: 'imsi', name: 'IMSI Summary', icon: Radio },
    { id: 'imei_patterns', name: 'IMEI Patterns', icon: Cpu },
    { id: 'imsi_patterns', name: 'IMSI Patterns', icon: Wifi },
    { id: 'first_last_call', name: 'First / Last Call', icon: PhoneCall },
    { id: 'locations', name: 'Location Summary', icon: MapPin },
    { id: 'loc_intel', name: 'Location Intelligence', icon: Map },
    { id: 'day_locations', name: 'Day Locations', icon: Sun },
    { id: 'day_calls', name: 'Day Calls', icon: Sun },
    { id: 'night_locations', name: 'Night Locations', icon: Moon },
    { id: 'night_calls', name: 'Night Calls', icon: Moon }
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#3ecf8e] border-r-2 border-transparent mb-4"></div>
        <span className="text-xs font-semibold font-mono uppercase tracking-wider">Syncing Case Records...</span>
      </div>
    );
  }

  if (!targetFile) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] text-gray-500 text-xs font-mono">
        Failed to load target file details.
      </div>
    );
  }

  const handleExportAllRecords = (format: 'csv' | 'excel') => {
    if (targetRecords.length === 0) return;
    const headers = ['Timestamp', 'Usage Type', 'Calling Number', 'Other Party', 'IMEI', 'IMSI', 'Call Duration', 'Cell Address', 'LAC', 'Cell ID'];
    const rows = targetRecords.map(r => [
      new Date(r.timestamp).toISOString(),
      r.usageType,
      r.aparty || '',
      r.otherParty || '',
      r.imei || '',
      r.imsi || '',
      r.duration || '',
      r.address || '',
      r.lac || '',
      r.cellId || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CDR_Export_All_${targetFile.phoneNumber}.${format === 'excel' ? 'csv' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      {/* 1. Sidebar Navigation */}
      <aside className={`transition-all duration-300 border-r border-[#2e2e2e] bg-[#171717] flex flex-col justify-between shrink-0 h-full ${isSidebarCollapsed ? 'w-16' : 'w-56'}`}>
        <div className="flex flex-col h-full text-left overflow-hidden">
          {/* Active Target Header */}
          <div className={`p-4 border-b border-[#2e2e2e] bg-[#141414]/30 ${isSidebarCollapsed ? 'flex justify-center items-center h-[76px]' : ''}`}>
            {!isSidebarCollapsed ? (
              <>
                <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">
                  Target A-Party Number
                </span>
                <h3 className="font-semibold text-gray-200 text-sm mt-0.5 font-mono select-all">
                  {targetFile.phoneNumber}
                </h3>
                <span className="text-[11px] text-gray-400 font-mono block mt-1 truncate max-w-full font-bold">
                  {targetFile.operator} · {targetFile.category}
                </span>
              </>
            ) : (
              <User className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Menu Items */}
          <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
            {analysisModules.map(module => {
              const Icon = module.icon;
              const isActive = activeAnalysisTab === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveAnalysisTab(module.id)}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-lg font-medium text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#2e2e2e] text-white'
                      : 'text-gray-450 hover:bg-[#1c1c1c]/50 hover:text-gray-200'
                  }`}
                  title={isSidebarCollapsed ? module.name : undefined}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#3ecf8e]' : 'text-gray-500'}`} />
                  {!isSidebarCollapsed && <span className="text-xs whitespace-nowrap">{module.name}</span>}
                </button>
              );
            })}
          </nav>

          {/* Toggle Button at the bottom */}
          <div className="p-2 border-t border-[#2e2e2e]">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-end'} p-2 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-200 rounded-lg transition-colors cursor-pointer`}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212] text-left">
        {/* Top Header toolbar */}
        <div className="p-4 border-b border-[#2e2e2e] bg-[#171717] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shrink-0 font-mono">
          <div className="flex items-center gap-3">
            <div className="space-y-0.5 text-left">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
                INVESTIGATION WORKSPACE
              </span>
              <h2 className="text-sm font-bold text-white select-all">
                {targetFile.category} - {targetFile.phoneNumber}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span>{targetFile.phoneNumber}</span>
                <span>·</span>
                <span>{targetFile.recordsCount.toLocaleString()} rows</span>
                <span>·</span>
                <span className="text-[#3ecf8e] font-semibold">
                  • {activeAnalysisTab === 'dashboard' ? 'Executive Dashboard' : 'Advanced CDR Analysis'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick exports & Back actions matching layout in image copy.png */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
            <button 
              onClick={() => handleExportAllRecords('csv')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] hover:border-gray-500 text-gray-350 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV (All)</span>
            </button>
            <button 
              onClick={() => handleExportAllRecords('excel')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0b1c15] border border-emerald-950/40 hover:border-emerald-600/35 text-emerald-450 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
              <span>Excel</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1c0f0f] border border-red-950/40 hover:border-red-600/35 text-red-450 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-red-500" />
              <span>PDF Report</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0f151c] border border-blue-950/40 hover:border-blue-600/35 text-blue-450 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-blue-500" />
              <span>Print</span>
            </button>
            <button 
              onClick={() => alert('Generating KML map layer...')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] text-gray-400 hover:text-white rounded-lg cursor-pointer transition-colors"
            >
              <Map className="h-3.5 w-3.5 text-gray-500" />
              <span>KML</span>
            </button>
            <button 
              onClick={() => alert('Generating KMZ map package...')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] text-gray-400 hover:text-white rounded-lg cursor-pointer transition-colors"
            >
              <Map className="h-3.5 w-3.5 text-gray-500" />
              <span>KMZ</span>
            </button>
            <button 
              onClick={() => alert('Exporting forensic evidence package...')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1c170f] border border-amber-950/40 hover:border-amber-600/35 text-amber-450 rounded-lg transition-colors cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5 text-amber-500" />
              <span>Evidence</span>
            </button>
            <button 
              onClick={onBack}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] hover:border-gray-500 text-gray-350 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Tab Panel switcher */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
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
              onNavigateToTab={(tabId) => setActiveAnalysisTab(tabId)}
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
            <MfcAnalysis cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'network' ? (
            <NetworkAnalysis cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'ownership' ? (
            <OwnershipIntelligence cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'international' ? (
            <InternationalIntelligence cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'service_numbers' ? (
            <ServiceNumbers cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'imei' ? (
            <ImeiSummary cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'imsi' ? (
            <ImsiSummary cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'imei_patterns' ? (
            <ImeiPatterns cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'imsi_patterns' ? (
            <ImsiPatterns cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'first_last_call' ? (
            <FirstLastCall cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'locations' ? (
            <LocationSummary cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'loc_intel' ? (
            <LocationIntelligence cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'day_calls' ? (
            <TimeCallsIntelligence records={targetRecords} mode="day" />
          ) : activeAnalysisTab === 'night_calls' ? (
            <TimeCallsIntelligence records={targetRecords} mode="night" />
          ) : activeAnalysisTab === 'day_locations' ? (
            <TimeLocationsIntelligence records={targetRecords} mode="day" />
          ) : activeAnalysisTab === 'night_locations' ? (
            <TimeLocationsIntelligence records={targetRecords} mode="night" />
          ) : null}
        </main>
      </div>
    </div>
  );
};
