import React, { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Search, Smartphone, MapPin, 
  LayoutDashboard, Menu, PanelLeft
} from 'lucide-react';
import { type Case } from '../../../utils/db';
import { CaseOverview } from '../subfeatures/case-overview/CaseOverview';
import { UploadCDRModal } from './UploadCDRModal';
import { SearchCDRLogs } from '../subfeatures/search-cdr-logs/SearchCDRLogs';
import { MfcCellTowerMapping } from '../subfeatures/mfc-cell-tower/MfcCellTowerMapping';
import { ImeiImsiSummary } from '../subfeatures/imei-imsi-summary/ImeiImsiSummary';

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
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Case Overview Sidebar elements list
  const caseTabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'add-cdr', name: 'Add CDR Spreadsheet', icon: Upload, action: () => setIsUploadOpen(true) },
    { id: 'search', name: 'Search CDR Logs', icon: Search },
    { id: 'mfc', name: 'MFC Cell Tower Mapping', icon: MapPin },
    { id: 'imei', name: 'IMEI / IMSI Summary', icon: Smartphone }
  ];

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      {/* 1. Case Overview Sidebar */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 transition-all duration-300 border-r border-[#2e2e2e] bg-[#171717] flex flex-col justify-between shrink-0 h-full ${
        isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64'
      }`}>
        <div className="flex flex-col h-full text-left overflow-hidden">
          {/* Back trigger */}
          <button 
            onClick={onBack}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-2 px-4'} py-3 border-b border-[#2e2e2e] text-gray-400 hover:text-gray-250 transition-colors font-medium text-xs uppercase tracking-wider text-left cursor-pointer bg-[#141414]/45`}
            title={isSidebarCollapsed ? "Back to Cases" : undefined}
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            {!isSidebarCollapsed && <span>Back to Cases</span>}
          </button>
 
          {/* Active Case Header */}
          <div className={`p-4 border-b border-[#2e2e2e] ${isSidebarCollapsed ? 'flex flex-col gap-3 justify-center items-center h-[90px]' : 'flex items-center justify-between'}`}>
            {!isSidebarCollapsed ? (
              <>
                <div className="min-w-0">
                  <span className="font-mono text-xs text-gray-500 uppercase tracking-wider block">
                    {activeCase.caseIdString}
                  </span>
                  <h3 className="font-semibold text-gray-200 text-sm mt-0.5 truncate">
                    {activeCase.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-200 rounded-lg cursor-pointer transition-colors shrink-0 hidden md:block"
                  title="Collapse sidebar"
                >
                  <PanelLeft className="h-4.5 w-4.5" />
                </button>
              </>
            ) : (
              <>
                <div className="h-8 w-8 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="h-4.5 w-4.5 text-[#3ecf8e]" />
                </div>
                <button 
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-1 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-200 rounded-lg cursor-pointer transition-colors shrink-0 hidden md:block"
                  title="Expand sidebar"
                >
                  <PanelLeft className="h-4.5 w-4.5" />
                </button>
              </>
            )}
          </div>
 
          {/* Sub menu list */}
          <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
            {caseTabs.map(tab => {
              const Icon = tab.icon;
              const showName = !isSidebarCollapsed;
              
              if (tab.action) {
                return (
                  <button
                    key={tab.id}
                    onClick={tab.action}
                    className={`w-full flex items-center ${showName ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-lg font-medium text-left transition-all duration-150 cursor-pointer text-gray-450 hover:bg-[#1c1c1c]/50 hover:text-gray-200`}
                    title={!showName ? tab.name : undefined}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0 text-gray-500" />
                    {showName && <span className="text-xs">{tab.name}</span>}
                  </button>
                );
              }
 
              return (
                <NavLink
                  key={tab.id}
                  to={`/case/${activeCase.id}/${tab.id}`}
                  className={({ isActive }) => `w-full flex items-center ${showName ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-lg font-medium text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#2e2e2e] text-white'
                      : 'text-gray-450 hover:bg-[#1c1c1c]/50 hover:text-gray-200'
                  }`}
                  title={!showName ? tab.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#3ecf8e]' : 'text-gray-500'}`} />
                      {showName && <span className="text-xs">{tab.name}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-[#2e2e2e] bg-[#121212]/30 flex flex-col items-center gap-3 shrink-0">
          {isSidebarCollapsed ? (
            <>
              <a 
                href="https://mahbubshihab.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-85 transition-opacity cursor-pointer"
                title="Mahbub Shihab"
              >
                <img 
                  src="/developer.png" 
                  alt="Mahbub Shihab" 
                  className="h-6 w-6 rounded-full border border-gray-700 object-cover" 
                />
              </a>
              <a 
                href="https://wa.me/8801521798452" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1 text-[#25D366] hover:text-[#1ebd5d] hover:bg-[#25D366]/10 rounded-md transition-all cursor-pointer"
                title="WhatsApp Support"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-4.5 w-4.5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.182 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.638 1.971 14.161.947 11.517.947c-5.44 0-9.866 4.372-9.87 9.802 0 1.672.43 3.302 1.247 4.75L1.874 20.2l4.773-1.046zM18.006 14.75c-.328-.164-1.942-.958-2.242-1.068-.3-.11-.518-.164-.737.164-.219.328-.847 1.068-1.039 1.287-.192.219-.383.246-.711.082-.328-.164-1.385-.51-2.637-1.627-.975-.87-1.633-1.946-1.824-2.274-.192-.328-.02-.505.143-.668.146-.146.328-.383.492-.575.164-.192.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.737-1.779-1.01-2.436-.266-.641-.532-.553-.73-.563-.189-.01-.406-.01-.622-.01-.216 0-.568.082-.865.411-.297.328-1.137 1.11-1.137 2.709 0 1.599 1.164 3.142 1.326 3.36.162.219 2.292 3.5 5.552 4.908.775.335 1.38.535 1.852.686.779.248 1.488.213 2.048.13.624-.092 1.942-.795 2.216-1.56.274-.767.274-1.423.192-1.56-.082-.137-.3-.219-.628-.383z"/>
                </svg>
              </a>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Created by</span>
                <a 
                  href="https://mahbubshihab.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
                >
                  <img 
                    src="/developer.png" 
                    alt="Mahbub Shihab" 
                    className="h-6 w-6 rounded-full border border-gray-700 group-hover:border-[#3ecf8e] transition-all object-cover" 
                  />
                  <span className="text-xs font-semibold text-gray-300 group-hover:text-[#3ecf8e] transition-colors">
                    Mahbub Shihab
                  </span>
                </a>
              </div>
              <a 
                href="https://wa.me/8801521798452" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1 text-[#25D366] hover:text-[#1ebd5d] hover:bg-[#25D366]/10 rounded-md transition-all cursor-pointer"
                title="WhatsApp Support"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-4.5 w-4.5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.182 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.638 1.971 14.161.947 11.517.947c-5.44 0-9.866 4.372-9.87 9.802 0 1.672.43 3.302 1.247 4.75L1.874 20.2l4.773-1.046zM18.006 14.75c-.328-.164-1.942-.958-2.242-1.068-.3-.11-.518-.164-.737.164-.219.328-.847 1.068-1.039 1.287-.192.219-.383.246-.711.082-.328-.164-1.385-.51-2.637-1.627-.975-.87-1.633-1.946-1.824-2.274-.192-.328-.02-.505.143-.668.146-.146.328-.383.492-.575.164-.192.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.737-1.779-1.01-2.436-.266-.641-.532-.553-.73-.563-.189-.01-.406-.01-.622-.01-.216 0-.568.082-.865.411-.297.328-1.137 1.11-1.137 2.709 0 1.599 1.164 3.142 1.326 3.36.162.219 2.292 3.5 5.552 4.908.775.335 1.38.535 1.852.686.779.248 1.488.213 2.048.13.624-.092 1.942-.795 2.216-1.56.274-.767.274-1.423.192-1.56-.082-.137-.3-.219-.628-.383z"/>
                </svg>
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main content area switcher */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212] text-left">
        {/* Case Overview header bar to house the sidebar toggle */}
        <div className="p-4 border-b border-[#2e2e2e] bg-[#171717] flex items-center gap-3 shrink-0">
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-1.5 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-250 rounded-lg cursor-pointer transition-colors shrink-0 md:hidden"
              title="Show sidebar"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
          )}
          <div>
            <h2 className="text-sm font-semibold text-gray-200">
              Case Workspace — {activeCase.title}
            </h2>
          </div>
        </div>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<Navigate to="overview" replace />} />
            <Route path="overview" element={
              <CaseOverview 
                activeCase={activeCase}
                onTriggerRefresh={onTriggerRefresh}
                onOpenEditModal={() => onOpenEditModal(activeCase)}
                onOpenTargetFileId={onOpenTargetFileId}
              />
            } />
            <Route path="search" element={<SearchCDRLogs activeCase={activeCase} />} />
            <Route path="mfc" element={<MfcCellTowerMapping activeCase={activeCase} />} />
            <Route path="imei" element={<ImeiImsiSummary activeCase={activeCase} />} />
          </Routes>
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
