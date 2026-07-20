import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc,
  updateDoc, 
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Users, UserCheck, UserX, Clock, Calendar, ShieldAlert,
  Trash2, Check, Edit2, X, Search, Loader2, AlertTriangle, FileText, Briefcase
} from 'lucide-react';
import { DateTimePickerModal } from '../../components/ui/DateTimePickerModal';

interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: 'owner' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt?: Timestamp;
  approvedAt?: Timestamp;
  validUntil?: Timestamp | null;
  lastLogin?: Timestamp;
}

type Tab = 'pending' | 'active' | 'expired' | 'rejected';

export const UserManagement: React.FC = () => {
  const { role } = useAuth();
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time collections map for limits and stats
  const [limitsMap, setLimitsMap] = useState<Record<string, { maxCases: number; maxFiles: number }>>({});
  const [statsMap, setStatsMap] = useState<Record<string, { createdCasesCount: number; uploadedFilesCount: number }>>({});
  
  // Custom Configuration Modal States
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configUserId, setConfigUserId] = useState<string | null>(null);
  const [configUserName, setConfigUserName] = useState('');
  const [configUserEmail, setConfigUserEmail] = useState('');
  const [configMode, setConfigMode] = useState<'approve' | 'edit' | 'reapprove'>('approve');
  const [configExpiryDate, setConfigExpiryDate] = useState('');
  const [configMaxCases, setConfigMaxCases] = useState(10);
  const [configMaxFiles, setConfigMaxFiles] = useState(20);
  const [savingConfig, setSavingConfig] = useState(false);

  // Custom Date Picker Modal States (Triggered from config modal)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Default approval validity date (30 days from now)
  const getThirtyDaysFromNow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (role !== 'owner') return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: FirestoreUser[] = [];
      snapshot.forEach((doc) => {
        usersList.push(doc.data() as FirestoreUser);
      });
      setUsers(usersList);
      setLoading(false);
    }, (err) => {
      console.error("Error loading users:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  useEffect(() => {
    if (role !== 'owner') return;

    // Real-time listener for limits collection
    const limitsQuery = query(collection(db, 'limits'));
    const unsubscribeLimits = onSnapshot(limitsQuery, (snapshot) => {
      const map: Record<string, { maxCases: number; maxFiles: number }> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        map[doc.id] = {
          maxCases: data.maxCases || 0,
          maxFiles: data.maxFiles || 0
        };
      });
      setLimitsMap(map);
    }, (err) => {
      console.error("Error loading limits map:", err);
    });

    // Real-time listener for user stats collection
    const statsQuery = query(collection(db, 'userStats'));
    const unsubscribeStats = onSnapshot(statsQuery, (snapshot) => {
      const map: Record<string, { createdCasesCount: number; uploadedFilesCount: number }> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        map[doc.id] = {
          createdCasesCount: data.createdCasesCount || 0,
          uploadedFilesCount: data.uploadedFilesCount || 0
        };
      });
      setStatsMap(map);
    }, (err) => {
      console.error("Error loading stats map:", err);
    });

    return () => {
      unsubscribeLimits();
      unsubscribeStats();
    };
  }, [role]);

  if (role !== 'owner') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0f0f11]">
        <div className="max-w-md bg-[#141416] border border-red-500/20 rounded-2xl p-8 space-y-4">
          <ShieldAlert className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-150">Unauthorized Access</h2>
          <p className="text-xs text-gray-450 font-sans leading-relaxed">
            Sorry, this page is restricted to system Owners. You do not have permission to view this panel.
          </p>
        </div>
      </div>
    );
  }

  // Open the configuration modal and load limits if exist
  const openConfigModal = async (userId: string, name: string, email: string, mode: 'approve' | 'edit' | 'reapprove') => {
    setConfigUserId(userId);
    setConfigUserName(name);
    setConfigUserEmail(email);
    setConfigMode(mode);
    setSavingConfig(false);
    
    // Fetch existing limits if editing or reapproving
    if (mode === 'edit' || mode === 'reapprove') {
      try {
        const docRef = doc(db, 'limits', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfigExpiryDate(data.validUntil ? new Date(data.validUntil.seconds * 1000).toISOString().split('T')[0] : getThirtyDaysFromNow());
          setConfigMaxCases(data.maxCases || 10);
          setConfigMaxFiles(data.maxFiles || 20);
        } else {
          setConfigExpiryDate(getThirtyDaysFromNow());
          setConfigMaxCases(10);
          setConfigMaxFiles(20);
        }
      } catch (err) {
        console.error("Error fetching user limits:", err);
        setConfigExpiryDate(getThirtyDaysFromNow());
        setConfigMaxCases(10);
        setConfigMaxFiles(20);
      }
    } else {
      setConfigExpiryDate(getThirtyDaysFromNow());
      setConfigMaxCases(10);
      setConfigMaxFiles(20);
    }
    setIsConfigModalOpen(true);
  };

  // Handle Save limits configuration
  const handleSaveConfig = async () => {
    if (!configUserId) return;
    setSavingConfig(true);
    
    try {
      const userDocRef = doc(db, 'users', configUserId);
      const limitDocRef = doc(db, 'limits', configUserId);
      
      const expiryTimestamp = Timestamp.fromDate(new Date(configExpiryDate));
      
      if (configMode === 'approve' || configMode === 'reapprove') {
        // Update user status in main profiles
        await updateDoc(userDocRef, {
          status: 'approved',
          approvedAt: serverTimestamp(),
          validUntil: expiryTimestamp
        });
      } else {
        // If editing active user expiry date
        await updateDoc(userDocRef, {
          validUntil: expiryTimestamp
        });
      }
      
      // Update limits in limits collection (Owner Only write)
      await setDoc(limitDocRef, {
        validUntil: expiryTimestamp,
        maxCases: Number(configMaxCases) || 10,
        maxFiles: Number(configMaxFiles) || 20
      });

      // Create user notification inside subcollection
      const userNotificationRef = doc(collection(db, 'users', configUserId, 'notifications'));
      let notifTitle = 'Account Approved';
      let notifMsg = `Your account access has been approved until ${new Date(configExpiryDate).toLocaleDateString()}. Limits: ${configMaxCases} Cases, ${configMaxFiles} Files.`;
      let notifType: 'approval' | 'expiry_update' = 'approval';

      if (configMode === 'edit') {
        notifTitle = 'Limits & Expiry Updated';
        notifMsg = `Your account limits and expiry have been adjusted. New limits: ${configMaxCases} Cases, ${configMaxFiles} Files. Expiry: ${new Date(configExpiryDate).toLocaleDateString()}.`;
        notifType = 'expiry_update';
      }

      await setDoc(userNotificationRef, {
        title: notifTitle,
        message: notifMsg,
        createdAt: serverTimestamp(),
        read: false,
        type: notifType
      });
      
      setIsConfigModalOpen(false);
      setConfigUserId(null);
    } catch (err) {
      console.error("Error saving user configuration limits:", err);
    } finally {
      setSavingConfig(false);
    }
  };

  // Handle Reject user
  const handleReject = async (userId: string) => {
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        status: 'rejected',
        validUntil: null
      });

      // Write rejection notification inside user subcollection
      const userNotificationRef = doc(collection(db, 'users', userId, 'notifications'));
      await setDoc(userNotificationRef, {
        title: 'Account Access Declined',
        message: 'Your request for access has been reviewed and declined by the administrator.',
        createdAt: serverTimestamp(),
        read: false,
        type: 'rejection'
      });
    } catch (err) {
      console.error("Error rejecting user:", err);
    }
  };

  // Handle Delete user profile
  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user profile?")) return;
    const userDocRef = doc(db, 'users', userId);
    try {
      await deleteDoc(userDocRef);
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Format timestamps to readable strings
  const formatDateString = (ts?: Timestamp | null) => {
    if (!ts) return 'N/A';
    return new Date(ts.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Check if a user access is expired
  const isExpiredUser = (user: FirestoreUser) => {
    return user.status === 'approved' && user.validUntil && (new Date() > new Date(user.validUntil.seconds * 1000));
  };

  // Filter users based on tab and search query
  const filteredUsers = users.filter(user => {
    const isExpired = isExpiredUser(user);
    
    if (activeTab === 'pending') {
      if (user.status !== 'pending') return false;
    } else if (activeTab === 'active') {
      if (user.status !== 'approved' || user.role === 'owner' || isExpired) return false;
    } else if (activeTab === 'expired') {
      if (user.status !== 'approved' || user.role === 'owner' || !isExpired) return false;
    } else if (activeTab === 'rejected') {
      if (user.status !== 'rejected') return false;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower);
      
    return matchesSearch;
  });

  // Count helper functions
  const getPendingCount = () => users.filter(u => u.status === 'pending').length;
  const getActiveCount = () => users.filter(u => u.status === 'approved' && u.role !== 'owner' && !isExpiredUser(u)).length;
  const getExpiredCount = () => users.filter(u => u.status === 'approved' && u.role !== 'owner' && isExpiredUser(u)).length;
  const getRejectedCount = () => users.filter(u => u.status === 'rejected').length;

  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#0f0f11] animate-in fade-in duration-300 overflow-y-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#232326] pb-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Users className="h-5.5 w-5.5 text-[#3ecf8e]" />
            User Management
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1.5 font-sans">
            Manage platform user access requests, validity durations, and profile permissions.
          </p>
        </div>

        {/* Global search */}
        <div className="relative w-full sm:max-w-xs bg-[#171719] border border-[#27272a] rounded-xl px-3 py-1.5 focus-within:border-[#3ecf8e]/50 transition-colors">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search user by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 bg-transparent text-xs text-gray-200 placeholder-gray-655 focus:outline-none font-sans"
          />
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-[#232326]/60 pb-4 mb-6">
        {/* Pending Requests */}
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 cursor-pointer transition-all duration-150 ${
            activeTab === 'pending'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
              : 'bg-transparent border-[#232326] text-gray-450 hover:bg-[#1c1c1e] hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pending ({getPendingCount()})</span>
        </button>

        {/* Active Access */}
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 cursor-pointer transition-all duration-150 ${
            activeTab === 'active'
              ? 'bg-[#3ecf8e]/10 border-[#3ecf8e]/30 text-[#3ecf8e]'
              : 'bg-transparent border-[#232326] text-gray-450 hover:bg-[#1c1c1e] hover:text-white'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Active Access ({getActiveCount()})</span>
        </button>

        {/* Expired Access */}
        <button
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 cursor-pointer transition-all duration-150 ${
            activeTab === 'expired'
              ? 'bg-red-500/10 border-red-500/30 text-red-500'
              : 'bg-transparent border-[#232326] text-gray-450 hover:bg-[#1c1c1e] hover:text-white'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Expired ({getExpiredCount()})</span>
        </button>

        {/* Rejected Requests */}
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 cursor-pointer transition-all duration-150 ${
            activeTab === 'rejected'
              ? 'bg-[#27272a] border-[#3f3f46] text-gray-300'
              : 'bg-transparent border-[#232326] text-gray-450 hover:bg-[#1c1c1e] hover:text-white'
          }`}
        >
          <UserX className="h-4 w-4" />
          <span>Rejected ({getRejectedCount()})</span>
        </button>
      </div>

      {/* Main Grid/List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-8 w-8 text-[#3ecf8e] animate-spin mb-3" />
          <p className="text-xs">Loading...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-10 text-center text-gray-500 font-sans text-xs">
          No users found in this section.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map(user => {
            const isOwner = user.role === 'owner';
            const isExpired = isExpiredUser(user);

            return (
              <div 
                key={user.uid} 
                className={`bg-[#141416] border rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 transition-all hover:bg-[#18181b]/70 ${
                  isExpired ? 'border-red-500/25 shadow-lg shadow-red-500/2' : 'border-[#27272a]'
                }`}
              >
                {/* 1. User Identity */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.name} 
                      className="h-12 w-12 rounded-full border border-gray-700 object-cover shrink-0" 
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 text-sm font-semibold uppercase shrink-0">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-200 truncate">{user.name}</h4>
                      {isOwner && (
                        <span className="px-1.5 py-0.5 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] text-[8px] font-bold font-mono rounded uppercase tracking-wider">Owner</span>
                      )}
                      {isExpired && (
                        <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold font-mono rounded uppercase tracking-wider animate-pulse">Expired</span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate mt-0.5 font-mono">{user.email}</p>
                  </div>
                </div>

                {/* 2. User Stats & Validity (Middle Section) */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start lg:items-center text-xs text-gray-400 border-t border-b sm:border-0 border-[#232326] py-3 sm:py-0 font-sans">
                  {/* Last Active Timestamp */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-550 uppercase tracking-wide font-bold block">Last Active</span>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span className="font-mono">{formatDateString(user.lastLogin)}</span>
                    </div>
                  </div>

                  {/* Expiration Date Display */}
                  {(activeTab === 'active' || activeTab === 'expired') && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-550 uppercase tracking-wide font-bold block">Access Expiry</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className={`h-3.5 w-3.5 shrink-0 ${isExpired ? 'text-red-400' : 'text-[#3ecf8e]'}`} />
                        <span className={`font-semibold font-mono ${isExpired ? 'text-red-400' : 'text-gray-300'}`}>
                          {formatDateString(user.validUntil)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Resource Usage & Limits Display */}
                  {(activeTab === 'active' || activeTab === 'expired') && (
                    <div className="flex gap-4 sm:gap-6 sm:border-l sm:border-[#232326] sm:pl-6">
                      {/* Case limits */}
                      <div className="space-y-1 min-w-[70px]">
                        <span className="text-[10px] text-gray-550 uppercase tracking-wide font-bold block">Cases</span>
                        <div className="text-gray-350 font-mono font-semibold flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span>
                            {statsMap[user.uid]?.createdCasesCount || 0} <span className="text-gray-500">/</span> {limitsMap[user.uid]?.maxCases || 0}
                          </span>
                        </div>
                      </div>

                      {/* File limits */}
                      <div className="space-y-1 min-w-[70px]">
                        <span className="text-[10px] text-gray-550 uppercase tracking-wide font-bold block">Files</span>
                        <div className="text-gray-350 font-mono font-semibold flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span>
                            {statsMap[user.uid]?.uploadedFilesCount || 0} <span className="text-gray-500">/</span> {limitsMap[user.uid]?.maxFiles || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Action Controls */}
                <div className="flex flex-wrap items-center gap-3 self-start lg:self-center font-sans shrink-0">
                  
                  {/* PENDING TAB ACTIONS */}
                  {activeTab === 'pending' && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => openConfigModal(user.uid, user.name, user.email, 'approve')}
                        className="px-4 py-1.5 bg-[#3ecf8e] hover:bg-[#32b279] text-black text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Configure & Approve
                      </button>
                      <button
                        onClick={() => handleReject(user.uid)}
                        className="px-3.5 py-1.5 bg-transparent hover:bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}

                  {/* ACTIVE & EXPIRED TAB ACTIONS */}
                  {(activeTab === 'active' || activeTab === 'expired') && (
                    <div className="flex items-center gap-3">
                      {/* Adjust limits & expiry */}
                      <button
                        onClick={() => openConfigModal(user.uid, user.name, user.email, 'edit')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b1b1e] border border-[#2b2b30] hover:border-[#3ecf8e]/40 hover:bg-[#202024] rounded-xl text-xs text-gray-300 hover:text-[#3ecf8e] transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        <span>Adjust Limits & Expiry</span>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(user.uid)}
                        className="p-2 bg-[#27272a] text-red-400 hover:bg-red-500/10 hover:text-red-500 border border-red-500/20 rounded-xl cursor-pointer transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* REJECTED TAB ACTIONS */}
                  {activeTab === 'rejected' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openConfigModal(user.uid, user.name, user.email, 'reapprove')}
                        className="px-3.5 py-1.5 bg-[#3ecf8e] hover:bg-[#32b279] text-black text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Re-Approve
                      </button>
                      <button
                        onClick={() => handleDelete(user.uid)}
                        className="p-2 bg-[#27272a] text-red-400 hover:bg-red-500/10 hover:text-red-500 border border-red-500/20 rounded-xl cursor-pointer transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Access Limits Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 bg-[#1c1c1e] hover:bg-[#27272a] border border-[#2b2b30] hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#3ecf8e]" />
                Configure User Access
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-mono">
                Name: {configUserName}<br/>
                Email: {configUserEmail}
              </p>
            </div>

            <div className="space-y-4">
              {/* Expiry Date Choice */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Expiration Expiry Date</label>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className="w-full px-3 py-2.5 bg-[#1c1c1e] border border-[#2b2b30] text-left text-xs text-gray-300 rounded-xl hover:bg-[#222225] transition-all flex items-center justify-between cursor-pointer font-mono"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#3ecf8e]" />
                    {configExpiryDate}
                  </span>
                  <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                </button>
              </div>

              {/* Case Creation Limit */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                  Max Case Creation Limit
                </label>
                <input
                  type="number"
                  min={1}
                  value={configMaxCases}
                  onChange={(e) => setConfigMaxCases(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2.5 bg-[#1c1c1e] border border-[#2b2b30] focus:border-[#3ecf8e]/50 text-xs text-gray-200 rounded-xl focus:outline-none transition-all font-mono"
                  placeholder="e.g. 10"
                />
              </div>

              {/* File Upload Limit */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-gray-500" />
                  Max File Upload Limit
                </label>
                <input
                  type="number"
                  min={1}
                  value={configMaxFiles}
                  onChange={(e) => setConfigMaxFiles(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2.5 bg-[#1c1c1e] border border-[#2b2b30] focus:border-[#3ecf8e]/50 text-xs text-gray-200 rounded-xl focus:outline-none transition-all font-mono"
                  placeholder="e.g. 20"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="flex-1 py-2.5 bg-transparent hover:bg-gray-800 border border-[#2b2b30] text-xs font-semibold text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="flex-1 py-2.5 bg-[#3ecf8e] hover:bg-[#32b279] disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3ecf8e]/10"
              >
                {savingConfig ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-4.5 w-4.5" />
                    Save & Approve
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Date Picker Triggered from within Config Modal */}
      <DateTimePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={(dateStr) => {
          setConfigExpiryDate(dateStr);
          setIsDatePickerOpen(false);
        }}
        initialValue={configExpiryDate || getThirtyDaysFromNow()}
        mode="date"
      />
    </div>
  );
};
