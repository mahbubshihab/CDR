import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Download, Menu, Database, LayoutDashboard, 
  ShieldAlert, BarChart3, Server, Compass, UserCheck, 
  Globe, Smartphone, Radio, MapPin
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
    { id: 'imei', name: 'IMEI Summary', icon: Smartphone },
    { id: 'imsi', name: 'IMSI Summary', icon: Radio },
    { id: 'locations', name: 'Location Summary', icon: MapPin },
    { id: 'loc_intel', name: 'Location Intelligence', icon: MapPin }
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

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      {/* 1. Sidebar Navigation */}
      <aside className={`transition-all duration-300 border-r border-[#2e2e2e] bg-[#171717] flex flex-col justify-between shrink-0 h-full ${isSidebarCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-56'}`}>
        <div className="flex flex-col h-full text-left">
          {/* Active Target Header */}
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

          {/* Menu Items */}
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

      {/* 2. Main Content Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212] text-left">
        {/* Top Header toolbar */}
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

          {/* Quick exports & Back actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg p-1">
              <button className="p-1.5 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-200 rounded text-xs font-mono font-semibold cursor-pointer">CSV</button>
              <button className="p-1.5 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-200 rounded text-xs font-mono font-semibold cursor-pointer">Excel</button>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#046a38] border border-[#3ecf8e] text-white rounded-lg transition-colors cursor-pointer font-medium"
              >
                <Download className="h-3.5 w-3.5 text-white" />
                <span>PDF Report</span>
              </button>
              <button 
                onClick={onBack}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] border border-red-900/30 hover:border-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Panel switcher */}
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
          ) : activeAnalysisTab === 'imei' ? (
            <ImeiSummary cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'imsi' ? (
            <ImsiSummary cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'locations' ? (
            <LocationSummary cdrFile={targetFile} records={targetRecords} />
          ) : activeAnalysisTab === 'loc_intel' ? (
            <LocationIntelligence cdrFile={targetFile} records={targetRecords} />
          ) : null}
        </main>
      </div>
    </div>
  );
};
