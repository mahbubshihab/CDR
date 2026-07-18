import React, { useState } from 'react';
import { 
  ArrowLeft, Upload, Search, Smartphone, MapPin, 
  LayoutDashboard, Menu, ArrowRightLeft
} from 'lucide-react';
import { type Case } from '../../../utils/db';
import { CaseOverview } from '../subfeatures/case-overview/CaseOverview';
import { UploadCDRModal } from './UploadCDRModal';
import { SearchCDRLogs } from '../subfeatures/search-cdr-logs/SearchCDRLogs';
import { MfcCellTowerMapping } from '../subfeatures/mfc-cell-tower/MfcCellTowerMapping';
import { ImeiImsiSummary } from '../subfeatures/imei-imsi-summary/ImeiImsiSummary';
import { CellIdChanges } from '../subfeatures/cell-id-changes/CellIdChanges';

interface WorkspaceProps {
  activeCase: Case;
  onBack: () => void;
  onTriggerRefresh: () => void;
  onOpenEditModal: (c: Case) => void;
  onOpenTargetFileId: (fileId: number) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ 
  activeCase, onBack, onTriggerRefresh, onOpenEditModal, onOpenTargetFileId 
}) => {
  const [activeCaseTab, setActiveCaseTab] = useState<'overview' | 'add-cdr' | 'search' | 'mfc' | 'imei' | 'cell-id'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Case Overview Sidebar elements list
  const caseTabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'add-cdr', name: 'Add CDR Spreadsheet', icon: Upload, action: () => setIsUploadOpen(true) },
    { id: 'search', name: 'Search CDR Logs', icon: Search },
    { id: 'mfc', name: 'MFC Cell Tower Mapping', icon: MapPin },
    { id: 'cell-id', name: 'Cell ID Changes', icon: ArrowRightLeft },
    { id: 'imei', name: 'IMEI / IMSI Summary', icon: Smartphone }
  ];

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      {/* 1. Case Overview Sidebar (Screenshot 2 Sidebar) */}
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
              onOpenTargetFileId={onOpenTargetFileId}
            />
          ) : activeCaseTab === 'search' ? (
            <SearchCDRLogs activeCase={activeCase} />
          ) : activeCaseTab === 'mfc' ? (
            <MfcCellTowerMapping activeCase={activeCase} />
          ) : activeCaseTab === 'cell-id' ? (
            <CellIdChanges activeCase={activeCase} />
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
