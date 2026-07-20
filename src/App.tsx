import React, { useState, useEffect } from 'react';
import { db as dbFirestore } from './firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { 
  Database, LayoutDashboard, PlusCircle, FolderOpen, 
  Smartphone, Search, UserCheck, ShieldAlert, 
  HelpCircle, Settings, Link2, Sun, Bell, MoreVertical,
  BookOpen, Menu, X, PanelLeft, Users, LogOut, Loader2
} from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useParams, NavLink } from 'react-router-dom';
import { GlobalDashboard } from './features/dashboard/components/GlobalDashboard';
import { AddCaseModal } from './features/add-case/components/AddCaseModal';
import { CaseList } from './features/view-cases/components/CaseList';
import { EditCaseModal } from './features/view-cases/components/EditCaseModal';
import { Workspace } from './features/workspace/components/Workspace';
import { AnalyticsWorkspace } from './features/analytics/components/AnalyticsWorkspace';
import { ImeiInfo } from './features/imei-info/ImeiInfo';
import { NumberLookup } from './features/number-lookup/NumberLookup';
import { OwnershipFinder } from './features/ownership-finder/OwnershipFinder';
import { Settings as SettingsTab } from './features/settings/Settings';
import { About } from './features/about/About';
import { UserManagement } from './features/user-management/UserManagement';
import { Login } from './features/auth/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db, type Case } from './utils/db';

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'add-case', name: 'Add New Case', icon: PlusCircle },
  { id: 'view-cases', name: 'View Cases', icon: FolderOpen, path: '/view-cases' },
  { id: 'imei', name: 'IMEI Info', icon: Smartphone, path: '/imei' },
  { id: 'lookup', name: 'Number Lookup', icon: Search, path: '/lookup' },
  { id: 'ownership', name: 'Ownership Finder', icon: UserCheck, path: '/ownership' },
  { id: 'settings', name: 'Settings', icon: Settings, path: '/settings' },
  { id: 'about', name: 'Guide & Support', icon: HelpCircle, path: '/about' }
];

function WorkspaceRoute({ isEditOpen, setIsEditOpen, activeCaseForEdit, setActiveCaseForEdit, refreshKey, handleCaseSaved }: any) {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [activeCase, setActiveCase] = useState<Case | null>(null);

  useEffect(() => {
    if (caseId) {
      db.cases.get(parseInt(caseId)).then(record => {
        if (record) setActiveCase(record);
      });
    }
  }, [caseId, refreshKey]);

  if (!activeCase) return null;

  return (
    <div className="h-screen w-screen bg-transparent text-gray-200 animate-in fade-in duration-200">
      <Workspace 
        activeCase={activeCase}
        onBack={() => {
          navigate('/view-cases');
        }}
        onTriggerRefresh={handleCaseSaved}
        onOpenEditModal={(c) => {
          setActiveCaseForEdit(c);
          setIsEditOpen(true);
        }}
        onOpenTargetFileId={(fileId) => {
          navigate(`/file/${fileId}`);
        }}
      />
      <EditCaseModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        caseData={activeCaseForEdit} 
        onSave={() => {
          handleCaseSaved();
          if (activeCase.id) {
            db.cases.get(activeCase.id).then(updated => {
              if (updated) setActiveCase(updated);
            });
          }
        }}
      />
    </div>
  );
}

function MainLayout({ timeString, setIsAddOpen, refreshKey, handleCaseSaved, setIsEditOpen, setActiveCaseForEdit }: any) {
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { currentUser, role, signOutUser } = useAuth();

  interface UserNotification {
    id: string;
    title: string;
    message: string;
    createdAt: any;
    read: boolean;
    type: 'request' | 'approval' | 'rejection' | 'expiry_update';
  }

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const q = query(
      collection(dbFirestore, 'users', currentUser.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: UserNotification[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as UserNotification);
      });
      setNotifications(list);
    }, (err) => {
      console.error("Error loading notifications:", err);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    const handleClose = () => setIsNotificationsOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isNotificationsOpen]);

  const markAllNotificationsAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    try {
      const batch = writeBatch(dbFirestore);
      notifications.forEach((notif) => {
        if (!notif.read) {
          const docRef = doc(dbFirestore, 'users', currentUser.uid, 'notifications', notif.id);
          batch.update(docRef, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!currentUser) return;
    try {
      const docRef = doc(dbFirestore, 'users', currentUser.uid, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleBellClick = () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);
    if (nextState && unreadCount > 0) {
      markAllNotificationsAsRead();
    }
  };

  const showName = !isSidebarCollapsed || isMobileSidebarOpen;

  const activeMenuItems = [...menuItems];
  if (role === 'owner') {
    activeMenuItems.push({
      id: 'users',
      name: 'User Management',
      icon: Users,
      path: '/users'
    });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent text-gray-200 text-sm animate-in fade-in duration-200">
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 border-r border-[#2e2e2e] bg-[#171717] flex flex-col justify-between shrink-0 h-full z-50 transition-all duration-300 ${
        isMobileSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${isSidebarCollapsed ? 'md:w-16' : 'md:w-64'}`}>
        <div>
          <div className={`h-16 px-5 border-b border-[#2e2e2e] flex items-center justify-between shrink-0 ${isSidebarCollapsed ? 'md:px-0 md:justify-center' : ''}`}>
            {showName ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 rounded-lg flex items-center justify-center">
                    <Database className="h-4.5 w-4.5 text-[#3ecf8e]" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-xs font-semibold tracking-wider text-gray-200 uppercase">CDR Analyzer</h1>
                    <span className="text-[10px] font-medium text-gray-500 block -mt-0.5 font-mono">Analyzer Edition</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    className="text-gray-500 hover:text-gray-300 hidden md:block p-1 hover:bg-[#1e1e1e] rounded-md transition-colors cursor-pointer"
                    onClick={() => setIsSidebarCollapsed(true)}
                    title="Collapse sidebar"
                  >
                    <PanelLeft className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    className="text-gray-500 hover:text-gray-300 md:hidden cursor-pointer p-1"
                    onClick={() => setIsMobileSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <button 
                className="text-gray-500 hover:text-gray-300 p-2 hover:bg-[#1e1e1e] rounded-md transition-colors cursor-pointer flex items-center justify-center"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Expand sidebar"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            )}
          </div>
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
            {activeMenuItems.map(item => {
              const Icon = item.icon;
              
              if (item.id === 'add-case') {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsAddOpen(true);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center ${showName ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-lg font-medium text-left transition-all duration-150 cursor-pointer text-xs text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200`}
                    title={!showName ? item.name : undefined}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0 text-gray-500" />
                    {showName && <span>{item.name}</span>}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.id}
                  to={item.path!}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={({ isActive }) => `w-full flex items-center ${showName ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-lg font-medium text-left transition-all duration-150 cursor-pointer text-xs ${
                    isActive
                      ? 'bg-[#2e2e2e] text-white'
                      : 'text-gray-450 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                  }`}
                  title={!showName ? item.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#3ecf8e]' : 'text-gray-500'}`} />
                      {showName && <span>{item.name}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-[#2e2e2e] bg-[#121212]/30 flex flex-col items-center gap-3 shrink-0">
          {showName ? (
            <div className="w-full flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-550 uppercase font-bold tracking-wider">Created by</span>
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
          ) : (
            <a 
              href="https://wa.me/8801521798452" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-[#25D366] hover:text-[#1ebd5d] hover:bg-[#25D366]/10 rounded-xl transition-all cursor-pointer flex items-center justify-center animate-in fade-in duration-200"
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
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-[#2e2e2e] bg-[#171717] flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="text-gray-400 hover:text-gray-200 md:hidden cursor-pointer"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="w-full max-w-xs sm:max-w-md flex items-center bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl px-3 py-1.5 focus-within:border-[#3ecf8e]/50 transition-colors">
              <Search className="h-4 w-4 text-gray-500 mr-2.5 shrink-0" />
              <input 
                type="text" 
                placeholder="Search number, IMEI, CNIC..."
                className="w-full bg-transparent text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-5">
            <div className="hidden sm:flex items-center gap-2 text-gray-450 font-medium font-mono text-[11px]">
              <Sun className="h-4.5 w-4.5 text-gray-500" />
              <span>{timeString}</span>
            </div>
            <div className="hidden sm:block h-7 w-px bg-[#2e2e2e]" />
            
            {/* Notifications Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={handleBellClick}
                className="relative p-1.5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-[#171717] scale-90">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden z-50 text-left animate-in fade-in slide-in-from-top-3 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-[#1c1c1f]">
                    <h3 className="text-xs font-bold text-gray-200 tracking-wide">Notifications</h3>
                    {notifications.some(n => !n.read) && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] font-semibold text-[#3ecf8e] hover:text-[#3ecf8e]/80 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-[#27272a] custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center flex flex-col items-center justify-center gap-2">
                        <Bell className="h-8 w-8 text-gray-700" />
                        <p className="text-xs font-semibold text-gray-500">No notifications yet</p>
                        <p className="text-[10px] text-gray-600 max-w-[200px] leading-relaxed">
                          We will notify you about system requests and access details here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        let dotColor = 'bg-blue-500';
                        if (notif.type === 'request') dotColor = 'bg-amber-500';
                        if (notif.type === 'approval') dotColor = 'bg-emerald-500';
                        if (notif.type === 'rejection') dotColor = 'bg-red-500';
                        if (notif.type === 'expiry_update') dotColor = 'bg-indigo-500';

                        return (
                          <div 
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                              notif.read ? 'hover:bg-zinc-850/40 bg-transparent' : 'bg-emerald-500/5 hover:bg-emerald-500/10'
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${dotColor} ${!notif.read ? 'ring-4 ring-emerald-500/10' : ''}`} />
                            
                            <div className="flex-1 space-y-0.5 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className={`text-xs font-bold ${notif.read ? 'text-gray-300' : 'text-gray-150'} truncate`}>{notif.title}</h4>
                                <span className="text-[9px] text-gray-600 font-medium font-mono shrink-0">
                                  {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Just now'}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 leading-relaxed font-sans">{notif.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2.5 relative group">
              <img 
                src={currentUser?.photoURL || "/developer.png"} 
                alt={currentUser?.displayName || "Investigator"} 
                className="h-8.5 w-8.5 rounded-full border border-[#2e2e2e] object-cover cursor-pointer" 
              />
              <div className="text-left leading-tight hidden md:block select-none">
                <span className="text-xs font-semibold text-gray-200 block">
                  {currentUser?.displayName || "Investigator"}
                </span>
                <span className="text-[10px] text-[#3ecf8e] font-semibold font-mono block -mt-0.5 uppercase">
                  {role === 'owner' ? 'Owner / Admin' : 'IO / Analyst'}
                </span>
              </div>
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] border border-[#27272a] rounded-xl shadow-xl py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="px-4 py-2 border-b border-[#27272a] text-left">
                  <p className="text-xs font-semibold text-gray-200 truncate">{currentUser?.displayName}</p>
                  <p className="text-[10px] text-gray-500 font-mono truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={() => signOutUser()}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<GlobalDashboard 
              key={refreshKey}
              onAddNewCase={() => setIsAddOpen(true)}
              onViewCases={() => navigate('/view-cases')}
              onOpenCase={(c) => navigate(`/case/${c.id}`)}
            />} />
            <Route path="/view-cases" element={<CaseList 
              onOpenCase={(c) => navigate(`/case/${c.id}`)}
              onEditCase={(c) => { setActiveCaseForEdit(c); setIsEditOpen(true); }}
              onUploadCDR={(c) => navigate(`/case/${c.id}`)}
              refreshKey={refreshKey}
              onTriggerRefresh={handleCaseSaved}
            />} />
            <Route path="/imei" element={<ImeiInfo />} />
            <Route path="/lookup" element={<NumberLookup />} />
            <Route path="/ownership" element={<OwnershipFinder />} />
            <Route path="/settings" element={<SettingsTab />} />
            <Route path="/about" element={<About />} />
            {role === 'owner' && <Route path="/users" element={<UserManagement />} />}
            <Route path="*" element={
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <Database className="h-8 w-8 text-gray-500 mb-3" />
                <h3 className="font-bold text-gray-300">Module Not Found</h3>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AnalyticsWorkspaceRoute() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  if (!fileId) return null;

  return (
    <div className="h-screen w-screen bg-transparent text-gray-200 animate-in fade-in duration-200">
      <AnalyticsWorkspace 
        targetFileId={parseInt(fileId)}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}

function AppContent() {
  const { currentUser, status, validUntil, loading } = useAuth();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeCaseForEdit, setActiveCaseForEdit] = useState<Case | null>(null);
  const [timeString, setTimeString] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTimeString(
        date.toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
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

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0c] text-gray-200">
        <Loader2 className="h-10 w-10 text-[#3ecf8e] animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide text-gray-400 font-sans">Connecting to system secure gateway...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const isUserExpired = status === 'approved' && validUntil && (new Date() > new Date(validUntil.seconds * 1000));

  if (status !== 'approved' || isUserExpired) {
    return <Login />;
  }

  return (
    <>
      <Routes>
        <Route path="/file/:fileId/*" element={<AnalyticsWorkspaceRoute />} />
        <Route path="/case/:caseId/*" element={<WorkspaceRoute 
            isEditOpen={isEditOpen} 
            setIsEditOpen={setIsEditOpen} 
            activeCaseForEdit={activeCaseForEdit} 
            setActiveCaseForEdit={setActiveCaseForEdit} 
            refreshKey={refreshKey} 
            handleCaseSaved={handleCaseSaved} 
        />} />
        <Route path="/*" element={
          <MainLayout 
            timeString={timeString} 
            setIsAddOpen={setIsAddOpen}
            refreshKey={refreshKey}
            handleCaseSaved={handleCaseSaved}
            setIsEditOpen={setIsEditOpen}
            setActiveCaseForEdit={setActiveCaseForEdit}
          />
        } />
      </Routes>

      <AddCaseModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSave={handleCaseSaved}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

export default App;
