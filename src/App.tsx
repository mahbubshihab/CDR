import React, { useState, useEffect } from 'react';
import { 
  Database, LayoutDashboard, PlusCircle, FolderOpen, 
  Smartphone, Search, UserCheck, ShieldAlert, 
  HelpCircle, Settings, Link2, Sun, Bell, MoreVertical,
  BookOpen
} from 'lucide-react';
import { GlobalDashboard } from './features/dashboard/components/GlobalDashboard';
import { AddCaseModal } from './features/add-case/components/AddCaseModal';
import { CaseList } from './features/view-cases/components/CaseList';
import { EditCaseModal } from './features/view-cases/components/EditCaseModal';
import { Workspace } from './features/workspace/components/Workspace';
import { ImeiInfo } from './features/imei-info/ImeiInfo';
import { NumberLookup } from './features/number-lookup/NumberLookup';
import { OwnershipFinder } from './features/ownership-finder/OwnershipFinder';
import { Reports } from './features/reports/Reports';
import { Watchlist } from './features/watchlist/Watchlist';
import { CommonReport } from './features/common-report/CommonReport';
import { IntelligenceDatabase } from './features/intelligence-database/IntelligenceDatabase';
import { UsefulLinks } from './features/useful-links/UsefulLinks';
import { Settings as SettingsTab } from './features/settings/Settings';
import { About } from './features/about/About';
import { db, seedMockDataIfEmpty, type Case } from './utils/db';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeCaseForEdit, setActiveCaseForEdit] = useState<Case | null>(null);
  const [activeWorkspaceCase, setActiveWorkspaceCase] = useState<Case | null>(null);
  const [timeString, setTimeString] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-case', name: 'Add New Case', icon: PlusCircle, action: () => setIsAddOpen(true) },
    { id: 'view-cases', name: 'View Cases', icon: FolderOpen },
    { id: 'imei', name: 'IMEI Info', icon: Smartphone },
    { id: 'lookup', name: 'Number Lookup', icon: Search },
    { id: 'ownership', name: 'Ownership Finder', icon: UserCheck },
    { id: 'reports', name: 'Reports', icon: FileTextIcon },
    { id: 'watchlist', name: 'Watchlist', icon: ShieldAlert },
    { id: 'common', name: 'Common Report', icon: BookOpen },
    { id: 'intelligence', name: 'Add Intelligence Datab...', icon: Database },
    { id: 'links', name: 'Useful Links', icon: Link2 },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'about', name: 'About & Support', icon: HelpCircle }
  ];

  // Auto-seed mock data on mount
  useEffect(() => {
    const initDb = async () => {
      await seedMockDataIfEmpty();
      handleCaseSaved();
    };
    initDb();
  }, []);

  // Hash Routing Synchronizer Hook
  useEffect(() => {
    const parseHashRoute = async () => {
      const hash = window.location.hash || '#/dashboard';
      
      if (hash.startsWith('#/case/')) {
        const parts = hash.split('/');
        const caseId = parseInt(parts[2], 10);
        if (!isNaN(caseId)) {
          const caseRecord = await db.cases.get(caseId);
          if (caseRecord) {
            setActiveWorkspaceCase(caseRecord);
            return;
          }
        }
      } else if (hash.startsWith('#/file/')) {
        const fileId = parseInt(hash.replace('#/file/', ''), 10);
        if (!isNaN(fileId)) {
          const fileRecord = await db.cdrFiles.get(fileId);
          if (fileRecord) {
            const caseRecord = await db.cases.get(fileRecord.caseId);
            if (caseRecord) {
              setActiveWorkspaceCase(caseRecord);
              return;
            }
          }
        }
      }
      
      const menuId = hash.replace('#/', '');
      const menuExists = menuItems.some(m => m.id === menuId);
      if (menuExists) {
        setActiveMenu(menuId);
      } else {
        setActiveMenu('dashboard');
      }
      setActiveWorkspaceCase(null);
    };

    window.addEventListener('hashchange', parseHashRoute);
    // Trigger on mount
    parseHashRoute();

    return () => window.removeEventListener('hashchange', parseHashRoute);
  }, [refreshKey]);

  // Time formatter
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTimeString(
        date.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCaseSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  // If case workspace is active, let it take over the entire view
  if (activeWorkspaceCase) {
    return (
      <div className="h-screen w-screen bg-transparent text-gray-200 animate-in fade-in duration-200">
        <Workspace 
          activeCase={activeWorkspaceCase}
          onBack={() => {
            window.location.hash = '#/view-cases';
          }}
          onTriggerRefresh={handleCaseSaved}
          onOpenEditModal={(c) => {
            setActiveCaseForEdit(c);
            setIsEditOpen(true);
          }}
        />

        {/* Edit Case Modal overlay inside workspace */}
        <EditCaseModal 
          isOpen={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          caseData={activeCaseForEdit} 
          onSave={() => {
            handleCaseSaved();
            // Refresh workspace active case reference dynamically from Dexie
            if (activeWorkspaceCase.id) {
              db.cases.get(activeWorkspaceCase.id).then(updated => {
                if (updated) setActiveWorkspaceCase(updated);
              });
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent text-gray-200 text-sm animate-in fade-in duration-200">
      {/* 1. Left Sidebar */}
      <aside className="w-64 border-r border-[#2e2e2e] bg-[#171717] flex flex-col justify-between shrink-0 h-full">
        <div>
          {/* Header branding */}
          <div className="h-16 px-5 border-b border-[#2e2e2e] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 rounded-lg flex items-center justify-center">
                <Database className="h-4.5 w-4.5 text-[#3ecf8e]" />
              </div>
              <div className="text-left">
                <h1 className="text-xs font-semibold tracking-wider text-gray-200 uppercase">CDR Forensic</h1>
                <span className="text-[10px] font-medium text-gray-500 block -mt-0.5 font-mono">Forensic Edition</span>
              </div>
            </div>
            <button className="text-gray-500 hover:text-gray-300">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      window.location.hash = '#/' + item.id;
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-left transition-all duration-150 cursor-pointer text-xs ${
                    isActive
                      ? 'bg-[#2e2e2e] text-white'
                      : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#3ecf8e]' : 'text-gray-500'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#2e2e2e] text-[10px] text-gray-550 font-mono text-center">
          Created by Sajawal Khan
        </div>
      </aside>

      {/* 2. Right Workspace area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[#2e2e2e] bg-[#171717] flex items-center justify-between px-6 shrink-0 z-10">
          {/* Top Search bar */}
          <div className="w-96 flex items-center bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl px-3 py-1.5 focus-within:border-[#3ecf8e]/50 transition-colors">
            <Search className="h-4 w-4 text-gray-500 mr-2.5 shrink-0" />
            <input 
              type="text" 
              placeholder="Search number, IMEI, IMSI, CNIC, case ID, location..."
              className="w-full bg-transparent text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
            />
          </div>

          {/* Right Header metrics */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-gray-450 font-medium font-mono text-[11px]">
              <Sun className="h-4.5 w-4.5 text-gray-500" />
              <span>{timeString}</span>
            </div>

            <div className="h-7 w-px bg-[#2e2e2e]" />

            {/* Notification bell */}
            <button className="relative p-1.5 text-gray-500 hover:text-gray-300">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="h-7 w-px bg-[#2e2e2e]" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5">
              <div className="h-8.5 w-8.5 rounded-full bg-[#1e1e1e] border border-[#2e2e2e] flex items-center justify-center font-bold text-xs text-[#3ecf8e] font-mono">
                IN
              </div>
              <div className="text-left leading-tight hidden md:block">
                <span className="text-xs font-semibold text-gray-200 block">Investigator</span>
                <span className="text-[10px] text-gray-500 font-semibold font-mono block -mt-0.5">IO / Analyst</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {activeMenu === 'dashboard' ? (
            <GlobalDashboard 
              key={refreshKey}
              onAddNewCase={() => setIsAddOpen(true)}
              onViewCases={() => {
                window.location.hash = '#/view-cases';
              }}
              onOpenCase={(c) => {
                window.location.hash = '#/case/' + c.id;
              }}
            />
          ) : activeMenu === 'view-cases' ? (
            <CaseList 
              onOpenCase={(c) => {
                window.location.hash = '#/case/' + c.id;
              }}
              onEditCase={(c) => {
                setActiveCaseForEdit(c);
                setIsEditOpen(true);
              }}
              onUploadCDR={(c) => {
                window.location.hash = '#/case/' + c.id;
              }}
              refreshKey={refreshKey}
              onTriggerRefresh={handleCaseSaved}
            />
          ) : activeMenu === 'imei' ? (
            <ImeiInfo />
          ) : activeMenu === 'lookup' ? (
            <NumberLookup />
          ) : activeMenu === 'ownership' ? (
            <OwnershipFinder />
          ) : activeMenu === 'reports' ? (
            <Reports />
          ) : activeMenu === 'watchlist' ? (
            <Watchlist />
          ) : activeMenu === 'common' ? (
            <CommonReport />
          ) : activeMenu === 'intelligence' ? (
            <IntelligenceDatabase />
          ) : activeMenu === 'links' ? (
            <UsefulLinks />
          ) : activeMenu === 'settings' ? (
            <SettingsTab />
          ) : activeMenu === 'about' ? (
            <About />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <Database className="h-8 w-8 text-gray-500 mb-3" />
              <h3 className="font-bold text-gray-300">Module Workspace</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                The "{menuItems.find(m => m.id === activeMenu)?.name}" workspace is loaded. We will activate its sub-components in the next screenshot step.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* 3. Add Case Modal overlay */}
      <AddCaseModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSave={handleCaseSaved}
      />

      {/* 4. Edit Case Modal overlay */}
      <EditCaseModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        caseData={activeCaseForEdit} 
        onSave={handleCaseSaved}
      />
    </div>
  );
}

// Simple placeholder icon
function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

export default App;
