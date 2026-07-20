import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Printer, Upload, BarChart2, ExternalLink, 
  Edit2, Trash2, Search, CheckCircle, FileText
} from 'lucide-react';
import { db, type Case, type CDRFile } from '../../../../utils/db';
import { UploadCDRModal } from '../../components/UploadCDRModal';
import { DateTimeInput } from '../../../../components/ui/DateTimeInput';
import { CustomConfirm } from '../../../../components/ui/CustomModal';
import { useAuth } from '../../../../contexts/AuthContext';
import { db as dbFirestore } from '../../../../firebase';
import { doc, setDoc, increment } from 'firebase/firestore';


interface CaseOverviewProps {
  activeCase: Case;
  onTriggerRefresh: () => void;
  onOpenEditModal: () => void;
  onOpenTargetFileId: (id: number) => void;
}

export const CaseOverview: React.FC<CaseOverviewProps> = ({ 
  activeCase, onTriggerRefresh, onOpenEditModal, onOpenTargetFileId
}) => {
  const { currentUser, role } = useAuth();
  const [cdrFiles, setCdrFiles] = useState<CDRFile[]>([]);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteFileId, setPendingDeleteFileId] = useState<number | null>(null);

  // Table selections
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch case statistics & files list
  const fetchWorkspaceData = async () => {
    if (!activeCase.id) return;
    setLoading(true);
    try {
      const files = await db.cdrFiles.where('caseId').equals(activeCase.id).toArray();
      setCdrFiles(files);

      // Compute total records
      const total = files.reduce((sum, f) => sum + (f.recordsCount || 0), 0);
      setTotalRecordsCount(total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [activeCase, isUploadOpen]);

  // Mark case completed handler
  const handleMarkCompleted = async () => {
    if (!activeCase.id) return;
    try {
      await db.cases.update(activeCase.id, { status: 'Completed' });
      onTriggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete file handler
  const handleDeleteFile = (fileId: number) => {
    setPendingDeleteFileId(fileId);
  };

  const confirmDeleteFile = async () => {
    if (pendingDeleteFileId === null) return;
    try {
      await db.cdrFiles.delete(pendingDeleteFileId);
      // Clean up records
      await db.cdrRecords.where('fileId').equals(pendingDeleteFileId).delete();

      // Decrement uploadedFilesCount in Firestore stats
      if (currentUser && role !== 'owner') {
        const statsDocRef = doc(dbFirestore, 'userStats', currentUser.uid);
        await setDoc(statsDocRef, {
          uploadedFilesCount: increment(-1)
        }, { merge: true });
      }

      fetchWorkspaceData();
    } catch (err) {
      console.error(err);
    } finally {
      setPendingDeleteFileId(null);
    }
  };

  // Filtered files list
  const filteredFiles = useMemo(() => {
    let result = [...cdrFiles];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(f => 
        f.fileName.toLowerCase().includes(q) ||
        f.phoneNumber.toLowerCase().includes(q) ||
        f.ownerName.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }

    if (operatorFilter !== 'All') {
      result = result.filter(f => f.operator === operatorFilter);
    }

    if (statusFilter !== 'All') {
      result = result.filter(f => f.status === statusFilter);
    }

    return result;
  }, [cdrFiles, searchQuery, operatorFilter, statusFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFileIds(filteredFiles.map(f => f.id).filter((id): id is number => id !== undefined));
    } else {
      setSelectedFileIds([]);
    }
  };

  const handleSelectRow = (fileId: number, checked: boolean) => {
    if (checked) {
      setSelectedFileIds(prev => [...prev, fileId]);
    } else {
      setSelectedFileIds(prev => prev.filter(id => id !== fileId));
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header with case info */}
      <div className="flex items-center justify-between">
        <div>
          <span className={`px-2 py-0.5 rounded-full text-sm font-bold font-mono ${
            activeCase.status === 'Completed' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' :
            activeCase.status === 'Active' ? 'bg-blue-950/30 text-blue-400 border border-blue-800/20' :
            'bg-amber-950/30 text-amber-400 border border-amber-800/20'
          }`}>
            {activeCase.status}
          </span>
          <h2 className="text-xl font-semibold text-gray-150 mt-1">{activeCase.title}</h2>
          <span className="font-mono text-sm font-bold text-[#3ecf8e] block tracking-wider mt-0.5">
            {activeCase.caseIdString}
          </span>
        </div>

        <button 
          onClick={onOpenEditModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1e1e1e] hover:bg-[#3ecf8e] text-gray-950 font-semibold/15 border border-[#2e2e2e] hover:border-brand-blue text-gray-250 hover:text-white rounded-xl transition-all cursor-pointer text-sm"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit case
        </button>
      </div>

      {/* 2. Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Case Type', value: activeCase.caseType },
          { label: 'Police Station', value: activeCase.policeStation || '-' },
          { label: 'Investigator', value: activeCase.investigatorName || '-' },
          { label: 'Created', value: new Date(activeCase.createdAt).toLocaleString().split(',')[0] },
          { label: 'Last Updated', value: new Date(activeCase.createdAt).toLocaleString().split(',')[0] },
          { label: 'Total CDRs', value: cdrFiles.length },
          { label: 'Total Records', value: totalRecordsCount.toLocaleString() },
          { label: 'Status', value: activeCase.status }
        ].map((item, idx) => (
          <div key={idx} className="bg-[#171717]/40 border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider font-mono">
              {item.label}
            </span>
            <span className="text-sm font-bold text-gray-200 mt-1.5">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Quick Actions */}
      <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl p-5 space-y-4">
        <h4 className="text-sm text-gray-400 font-bold uppercase tracking-wider font-mono">
          Quick Actions
        </h4>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#046a38] text-white font-medium border border-[#3ecf8e] hover:bg-[#00522c] rounded-xl transition-colors cursor-pointer text-sm"
          >
            <Upload className="h-4 w-4" />
            Upload new CDR
          </button>
          
          <button 
            disabled={selectedFileIds.length === 0}
            onClick={() => selectedFileIds[0] !== undefined && onOpenTargetFileId(selectedFileIds[0])}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] hover:bg-[#1e1e1e] border border-[#2e2e2e] disabled:opacity-40 text-gray-300 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
          >
            <BarChart2 className="h-4 w-4 text-[#3ecf8e]" />
            Analyze selected CDR
          </button>

          <button 
            disabled={selectedFileIds.length < 2}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] hover:bg-[#1e1e1e] border border-[#2e2e2e] disabled:opacity-40 text-gray-300 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
          >
            <ExternalLink className="h-4 w-4 text-[#3ecf8e]" />
            Multi-CDR analysis
          </button>

          <button 
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] hover:bg-[#1e1e1e] border border-[#2e2e2e] text-gray-300 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
          >
            <FileText className="h-4 w-4 text-[#3ecf8e]" />
            Generate report
          </button>

          <button 
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] hover:bg-[#1e1e1e] border border-[#2e2e2e] text-gray-300 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#3ecf8e]" />
            Export Excel
          </button>

          <button 
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] hover:bg-[#1e1e1e] border border-[#2e2e2e] text-gray-300 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
          >
            <Printer className="h-4 w-4 text-[#3ecf8e]" />
            Export PDF
          </button>

          {activeCase.status !== 'Completed' && (
            <button 
              onClick={handleMarkCompleted}
              className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-[#2e2e2e] hover:bg-emerald-500/10 text-emerald-400 rounded-xl font-bold transition-all cursor-pointer text-sm ml-auto"
            >
              <CheckCircle className="h-4 w-4" />
              Mark case completed
            </button>
          )}
        </div>
      </div>

      {/* 4. CDR Files list table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-200">
          CDR files ({filteredFiles.length})
        </h3>

        {/* File search & filter bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-[#0a1026]/40 p-3 rounded-xl border border-[#2e2e2e] backdrop-blur-xl">
          <div className="md:col-span-2 flex items-center bg-[#121212] border border-[#2e2e2e] rounded-lg px-2.5 py-1.5">
            <Search className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search category, phone, owner, file..."
              className="w-full bg-transparent text-sm text-gray-255 placeholder-gray-650 focus:outline-none"
            />
          </div>

          <select
            value={operatorFilter}
            onChange={e => setOperatorFilter(e.target.value)}
            className="bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-sm text-gray-250 focus:outline-none"
          >
            <option value="All">All operators</option>
            {['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'].map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-sm text-gray-250 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Partial">Partial</option>
            <option value="Completed">Completed</option>
          </select>

          <div className="flex gap-2">
            <div className="w-1/2">
              <DateTimeInput 
                mode="date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Start Date"
                className="w-full"
              />
            </div>
            <div className="w-1/2">
              <DateTimeInput 
                mode="date"
                value={endDate}
                onChange={setEndDate}
                placeholder="End Date"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Files Table */}
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-[12px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2e2e2e] text-gray-500 font-bold uppercase tracking-wider font-mono text-[10px] bg-[#121212]/30">
                  <th className="py-3 px-5 w-8">
                    <input 
                      type="checkbox" 
                      onChange={e => handleSelectAll(e.target.checked)}
                      checked={filteredFiles.length > 0 && selectedFileIds.length === filteredFiles.length}
                      className="rounded border-[#2e2e2e] text-[#3ecf8e] bg-[#121212] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-5">CDR ID</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Phone number</th>
                  <th className="py-3 px-5">Operator</th>
                  <th className="py-3 px-5">File name</th>
                  <th className="py-3 px-5">Upload date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/5">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#171717]/30 transition-colors">
                    <td className="py-3 px-5">
                      <input 
                        type="checkbox"
                        checked={file.id !== undefined && selectedFileIds.includes(file.id)}
                        onChange={e => file.id !== undefined && handleSelectRow(file.id, e.target.checked)}
                        className="rounded border-[#2e2e2e] text-[#3ecf8e] bg-[#121212] focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-5 font-mono text-gray-400">
                      #{file.id}
                    </td>
                    <td className="py-3 px-5">
                      {file.category !== '-' ? (
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 bg-red-950/20 text-red-400 border border-red-800/15 rounded text-sm font-bold tracking-wide">
                            {file.category}
                          </span>
                          <span className="text-sm text-gray-500 block font-mono">
                            {file.ownerName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-[#3ecf8e] select-all">
                      {file.phoneNumber}
                    </td>
                    <td className="py-3 px-5 text-gray-250">
                      {file.operator}
                    </td>
                    <td className="py-3 px-5 text-gray-300 font-mono">
                      {file.fileName}
                    </td>
                    <td className="py-3 px-5 font-mono text-gray-450">
                      {new Date(file.uploadDate).toLocaleString().replace(',', '')}
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 bg-amber-950/20 text-amber-400 border border-amber-800/15 rounded-full text-sm font-mono font-bold">
                        {file.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => file.id !== undefined && onOpenTargetFileId(file.id)}
                          title="Analyze CDR"
                          className="p-1 hover:bg-[#1e1e1e] text-gray-450 hover:text-gray-200 rounded cursor-pointer"
                        >
                          <BarChart2 className="h-3.5 w-3.5 text-[#3ecf8e]" />
                        </button>
                        <button 
                          title="Edit metadata"
                          className="p-1 hover:bg-[#1e1e1e] text-gray-450 hover:text-gray-200 rounded cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => file.id && handleDeleteFile(file.id)}
                          title="Delete file"
                          className="p-1 hover:bg-red-500/15 text-gray-450 hover:text-red-400 rounded cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFiles.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      No CDR spreadsheets uploaded for this case. Click Upload to import record logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload modal */}
      {activeCase.id && (
        <UploadCDRModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          caseId={activeCase.id}
          onUploadSuccess={fetchWorkspaceData}
        />
      )}

      <CustomConfirm
        isOpen={pendingDeleteFileId !== null}
        title="Delete CDR File"
        message="Are you sure you want to delete this CDR file and all its associated records? This action cannot be undone."
        confirmText="Confirm Delete"
        onConfirm={confirmDeleteFile}
        onCancel={() => setPendingDeleteFileId(null)}
      />
    </div>
  );
};
