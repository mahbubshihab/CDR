import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Printer, LayoutGrid, List, Search,
  Edit2, ExternalLink, Upload, Trash2, FolderOpen
} from 'lucide-react';
import { db, type Case } from '../../../utils/db';

interface CaseListProps {
  onOpenCase: (c: Case) => void;
  onEditCase: (c: Case) => void;
  onUploadCDR: (c: Case) => void;
  refreshKey: number;
  onTriggerRefresh: () => void;
}

export const CaseList: React.FC<CaseListProps> = ({ 
  onOpenCase, onEditCase, onUploadCDR, refreshKey, onTriggerRefresh 
}) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Last Updated');
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list');

  // Load cases from IndexedDB
  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await db.cases.toArray();
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [refreshKey]);

  // Handle case deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this case? This action will permanently remove all associated records.')) return;
    try {
      await db.cases.delete(id);
      // Clean up records and files associated with this case
      await db.cdrRecords.where('caseId').equals(id).delete();
      await db.cdrFiles.where('caseId').equals(id).delete();
      onTriggerRefresh();
      fetchCases();
    } catch (err) {
      console.error('Failed to delete case:', err);
    }
  };

  // Filter and sort cases dynamically
  const processedCases = useMemo(() => {
    let result = [...cases];

    // 1. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.caseIdString.toLowerCase().includes(q) ||
        c.policeStation.toLowerCase().includes(q) ||
        c.investigatorName.toLowerCase().includes(q)
      );
    }

    // 2. Filter by status
    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter);
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortBy === 'Case ID') {
        return a.caseIdString.localeCompare(b.caseIdString);
      }
      if (sortBy === 'Title') {
        return a.title.localeCompare(b.title);
      }
      // Default: Last Updated / Created
      return b.createdAt - a.createdAt;
    });

    return result;
  }, [cases, searchQuery, statusFilter, sortBy]);

  // Export to CSV helper
  const handleExportCSV = () => {
    if (processedCases.length === 0) return;
    const headers = ['Case ID', 'Title', 'Case Type', 'Police Station', 'Investigator', 'Status', 'Created Date'];
    const rows = processedCases.map(c => [
      c.caseIdString,
      c.title,
      c.caseType,
      c.policeStation,
      c.investigatorName,
      c.status,
      new Date(c.createdAt).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `case_list_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-150">View Cases</h2>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-wider block mt-1">
            {processedCases.length} case(s), table or card view
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0e24]/40 border border-[#2e2e2e] hover:border-[#2e2e2e] rounded-lg font-semibold text-gray-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>CSV</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0e24]/40 border border-[#2e2e2e] hover:border-[#2e2e2e] rounded-lg font-semibold text-gray-300 transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
          <div className="h-6 w-px bg-blue-500/8 mx-1" />
          
          <div className="flex border border-[#2e2e2e] rounded-lg overflow-hidden bg-[#121212]/30">
            <button 
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 transition-colors cursor-pointer ${layoutMode === 'list' ? 'bg-[#3ecf8e] text-gray-950 font-semibold text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <List className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 transition-colors cursor-pointer ${layoutMode === 'grid' ? 'bg-[#3ecf8e] text-gray-950 font-semibold text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0a1026]/40 p-3 rounded-xl border border-[#2e2e2e] backdrop-blur-xl">
        <div className="flex items-center bg-[#121212] border border-[#2e2e2e] rounded-lg px-2.5 py-1.5">
          <Search className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, case ID, IO, status..."
            className="w-full bg-transparent text-sm text-gray-250 placeholder-gray-650 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-sm text-gray-250 focus:outline-none focus:border-[#3ecf8e]"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-sm text-gray-250 focus:outline-none focus:border-[#3ecf8e]"
        >
          <option value="Last Updated">Sort: Last Updated</option>
          <option value="Case ID">Sort: Case ID</option>
          <option value="Title">Sort: Title</option>
        </select>
      </div>

      {/* Grid or Table layout list */}
      {layoutMode === 'list' ? (
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2e2e2e] text-gray-500 font-bold uppercase tracking-wider font-mono text-sm bg-[#121212]/30">
                  <th className="py-3 px-5">Case ID</th>
                  <th className="py-3 px-5">Title</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">CDRs</th>
                  <th className="py-3 px-5">IO</th>
                  <th className="py-3 px-5">Updated</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/5">
                {processedCases.map((c) => (
                  <tr key={c.id} className="hover:bg-[#171717]/30 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-[#3ecf8e] select-all">
                      <button 
                        onClick={() => onOpenCase(c)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {c.caseIdString}
                      </button>
                    </td>
                    <td className="py-3 px-5 font-semibold text-gray-200">
                      {c.title}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-sm font-bold font-mono ${
                        c.status === 'Completed' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' :
                        c.status === 'Active' ? 'bg-blue-950/30 text-blue-400 border border-blue-800/20' :
                        'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono text-gray-300">
                      0
                    </td>
                    <td className="py-3 px-5 text-gray-300">
                      {c.investigatorName || '-'}
                    </td>
                    <td className="py-3 px-5 font-mono text-gray-450">
                      {new Date(c.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).replace(',', '')}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => onEditCase(c)}
                          title="Edit details"
                          className="p-1 hover:bg-[#1e1e1e] text-gray-450 hover:text-gray-200 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => onOpenCase(c)}
                          title="Open workspace"
                          className="p-1 hover:bg-[#1e1e1e] text-gray-450 hover:text-gray-255 rounded transition-colors cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => onUploadCDR(c)}
                          title="Upload CDR file"
                          className="p-1 hover:bg-[#1e1e1e] text-gray-450 hover:text-gray-255 rounded transition-colors cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => c.id && handleDelete(c.id)}
                          title="Delete case"
                          className="p-1 hover:bg-red-500/15 text-gray-450 hover:text-red-400 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {processedCases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No investigation cases found. Add a new case to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {processedCases.map((c) => (
            <div 
              key={c.id} 
              className="bg-[#171717]/40 border border-[#2e2e2e] hover:border-[#2e2e2e] rounded-2xl p-5 space-y-4 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-sm font-bold tracking-widest text-[#3ecf8e] uppercase">
                    {c.caseIdString}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-sm font-bold font-mono ${
                    c.status === 'Completed' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/20' :
                    c.status === 'Active' ? 'bg-blue-950/30 text-blue-400 border border-blue-800/20' :
                    'bg-amber-950/30 text-amber-400 border border-amber-800/20'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <h4 className="font-bold text-gray-200 text-sm hover:underline cursor-pointer" onClick={() => onOpenCase(c)}>
                  {c.title}
                </h4>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {c.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1e1e1e] flex items-center justify-between">
                <div className="text-sm font-mono text-gray-500">
                  Updated: {new Date(c.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onEditCase(c)}
                    className="p-1 hover:bg-[#1e1e1e] text-gray-450 hover:text-gray-200 rounded cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => onOpenCase(c)}
                    className="p-1 hover:bg-[#1e1e1e] text-gray-450 hover:text-gray-200 rounded cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => c.id && handleDelete(c.id)}
                    className="p-1 hover:bg-red-500/15 text-gray-450 hover:text-red-400 rounded cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {processedCases.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              No investigation cases found. Add a new case to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
