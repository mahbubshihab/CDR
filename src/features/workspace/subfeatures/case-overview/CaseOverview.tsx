import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Printer, Upload, BarChart2, ExternalLink, 
  Edit2, Trash2, Search, CheckCircle, FileText, X
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
  const [showDeleteMultipleConfirm, setShowDeleteMultipleConfirm] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState<{
    topContacts: { number: string; count: number }[];
    topLocations: { address: string; count: number }[];
    caseDetails: any;
    cdrSummary: any[];
  } | null>(null);

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

      fetchWorkspaceData();
    } catch (err) {
      console.error(err);
    } finally {
      setPendingDeleteFileId(null);
    }
  };

  const confirmDeleteMultiple = async () => {
    if (selectedFileIds.length === 0) return;
    try {
      await Promise.all(selectedFileIds.map(id => db.cdrFiles.delete(id)));
      await Promise.all(selectedFileIds.map(id => db.cdrRecords.where('fileId').equals(id).delete()));
      setSelectedFileIds([]);
      fetchWorkspaceData();
    } catch (err) {
      console.error(err);
    } finally {
      setShowDeleteMultipleConfirm(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!activeCase.id) return;
    try {
      const records = await db.cdrRecords.where('caseId').equals(activeCase.id).toArray();
      if (records.length === 0) {
        alert("No CDR records available in this case to generate report.");
        return;
      }

      const contactMap: Record<string, number> = {};
      const locMap: Record<string, number> = {};
      
      records.forEach(r => {
        if (r.otherParty) contactMap[r.otherParty] = (contactMap[r.otherParty] || 0) + 1;
        if (r.address) locMap[r.address] = (locMap[r.address] || 0) + 1;
      });

      const topC = Object.entries(contactMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([number, count]) => ({ number, count }));

      const topL = Object.entries(locMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([address, count]) => ({ address, count }));

      setReportData({
        topContacts: topC,
        topLocations: topL,
        caseDetails: activeCase,
        cdrSummary: cdrFiles
      });
      setIsReportOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to generate report.");
    }
  };

  const handleExportExcel = async () => {
    if (!activeCase.id) return;
    try {
      const records = await db.cdrRecords.where('caseId').equals(activeCase.id).toArray();
      if (records.length === 0) {
        alert("No CDR records available in this case to export.");
        return;
      }
      
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const overviewData = [
        ['Parameter', 'Value'],
        ['Case ID', activeCase.caseIdString],
        ['Case Title', activeCase.title],
        ['Case Type', activeCase.caseType],
        ['Police Station', activeCase.policeStation || 'N/A'],
        ['Investigator', activeCase.investigatorName || 'N/A'],
        ['Total CDR Files', cdrFiles.length],
        ['Total Records Count', records.length],
        ['Export Date', new Date().toLocaleString()]
      ];
      const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');

      const contactMap: Record<string, { number: string; count: number; duration: number }> = {};
      records.forEach(r => {
        if (!r.otherParty) return;
        if (!contactMap[r.otherParty]) {
          contactMap[r.otherParty] = { number: r.otherParty, count: 0, duration: 0 };
        }
        contactMap[r.otherParty].count++;
        contactMap[r.otherParty].duration += r.duration || 0;
      });
      const topContacts = Object.values(contactMap).sort((a, b) => b.count - a.count).slice(0, 50);
      const contactsHeaders = ['Contact Number', 'Call/SMS count', 'Total Duration (min)'];
      const contactsRows = topContacts.map(c => [c.number, c.count, Math.round(c.duration / 60)]);
      const contactsWs = XLSX.utils.aoa_to_sheet([contactsHeaders, ...contactsRows]);
      XLSX.utils.book_append_sheet(wb, contactsWs, 'Top Contacts');

      const rawHeaders = ['Timestamp', 'Usage Type', 'Calling Number', 'Other Party', 'IMEI', 'IMSI', 'Call Duration (sec)', 'Cell Address', 'LAC', 'Cell ID'];
      const rawRows = records.slice(0, 10000).map(r => [
        new Date(r.timestamp).toISOString().replace('T', ' ').substring(0, 19),
        r.usageType,
        r.aparty || '',
        r.otherParty || '',
        r.imei || '',
        r.imsi || '',
        r.duration || 0,
        r.address || '',
        r.lac || '',
        r.cellId || ''
      ]);
      const rawWs = XLSX.utils.aoa_to_sheet([rawHeaders, ...rawRows]);
      XLSX.utils.book_append_sheet(wb, rawWs, 'Raw Records');

      XLSX.writeFile(wb, `Case_CDR_Report_${activeCase.caseIdString}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Failed to export Excel report.");
    }
  };

  const handleExportPdf = async () => {
    if (!activeCase.id) return;
    try {
      const records = await db.cdrRecords.where('caseId').equals(activeCase.id).toArray();
      if (records.length === 0) {
        alert("No CDR records available in this case to export.");
        return;
      }

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Timestamps info
      const timestamps = records.map(r => r.timestamp).filter(t => !isNaN(t));
      const minTime = timestamps.length > 0 ? Math.min(...timestamps) : null;
      const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : null;
      const firstContact = minTime ? new Date(minTime).toLocaleString() : 'N/A';
      const lastContact = maxTime ? new Date(maxTime).toLocaleString() : 'N/A';

      // Top 30 communicating partners
      const contactMap: Record<string, { number: string; count: number; calls: number; sms: number; duration: number }> = {};
      records.forEach(r => {
        const party = r.otherParty;
        if (!party) return;
        if (!contactMap[party]) {
          contactMap[party] = { number: party, count: 0, calls: 0, sms: 0, duration: 0 };
        }
        const item = contactMap[party];
        item.count++;
        if (r.usageType?.includes('SMS')) {
          item.sms++;
        } else {
          item.calls++;
        }
        item.duration += r.duration || 0;
      });
      const topContacts = Object.values(contactMap).sort((a, b) => b.count - a.count).slice(0, 30);

      // Top 30 locations
      const locMap: Record<string, number> = {};
      records.forEach(r => {
        if (r.address) {
          locMap[r.address] = (locMap[r.address] || 0) + 1;
        }
      });
      const topLocations = Object.entries(locMap).sort((a, b) => b[1] - a[1]).slice(0, 30);

      // Operator count
      const operatorMap: Record<string, number> = {};
      cdrFiles.forEach(f => {
        if (f.operator) {
          operatorMap[f.operator] = (operatorMap[f.operator] || 0) + 1;
        }
      });
      const operatorsStr = Object.entries(operatorMap).map(([op, cnt]) => `${op} (${cnt})`).join(', ') || 'N/A';

      // PAGE 1: COVER PAGE (White background)
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("CDR FORENSIC ANALYSIS SUMMARY REPORT", 20, 45);

      doc.setDrawColor(16, 185, 129); // emerald green divider
      doc.setLineWidth(1.5);
      doc.line(20, 52, 190, 52);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("LAWMOR FORENSICS WORKSPACE | CONFIDENTIAL FORENSIC DOSSIER", 20, 59);

      // Section: Case Metadata
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("CASE METADATA", 20, 78);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(20, 81, 190, 81);

      let yPos = 90;
      doc.setFontSize(10);
      const caseDetails = [
        ['Case ID:', activeCase.caseIdString],
        ['Case Title:', activeCase.title],
        ['Case Type:', activeCase.caseType],
        ['Police Station:', activeCase.policeStation || 'N/A'],
        ['Investigator:', activeCase.investigatorName || 'N/A'],
        ['Associated Targets:', String(cdrFiles.length) + " Target Numbers"],
        ['Operators Active:', operatorsStr],
        ['Total CDR Rows:', String(records.length)],
        ['First Activity Recorded:', firstContact],
        ['Last Activity Recorded:', lastContact],
        ['Date Generated:', new Date().toLocaleString()]
      ];

      caseDetails.forEach(([lbl, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text(lbl, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(val, 75, yPos);
        yPos += 10;
      });

      // Target numbers list
      yPos += 5;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("TARGET NUMBERS SUMMARY", 20, yPos);
      doc.line(20, yPos + 3, 190, yPos + 3);
      yPos += 11;

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Phone Number", 20, yPos);
      doc.text("Operator", 75, yPos);
      doc.text("Category", 120, yPos);
      doc.text("Records Count", 165, yPos);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      cdrFiles.forEach(f => {
        doc.text(f.phoneNumber, 20, yPos);
        doc.text(f.operator || 'N/A', 75, yPos);
        doc.text(f.category || 'N/A', 120, yPos);
        doc.text(String(f.recordsCount || 0), 165, yPos);
        yPos += 8;
      });

      // PAGE 2: TOP INTERACTING PARTNERS (White background)
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text("TOP INTERACTING COMMUNICATIONS PARTNERS", 20, 25);
      doc.setDrawColor(16, 185, 129);
      doc.line(20, 29, 190, 29);

      yPos = 40;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Rank", 20, yPos);
      doc.text("Contact Number", 35, yPos);
      doc.text("Total Comms", 75, yPos);
      doc.text("Calls (In/Out)", 115, yPos);
      doc.text("SMS (In/Out)", 145, yPos);
      doc.text("Duration (Min)", 175, yPos);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 9;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      topContacts.forEach((c, idx) => {
        doc.text(String(idx + 1), 20, yPos);
        doc.text(c.number, 35, yPos);
        doc.text(String(c.count) + " times", 75, yPos);
        doc.text(String(c.calls), 115, yPos);
        doc.text(String(c.sms), 145, yPos);
        doc.text(String(Math.round(c.duration / 60)), 175, yPos);
        yPos += 7.5;
      });

      // PAGE 3: TOP CELL TOWER LOCATIONS (White background)
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text("TOP CELL TOWER LOCATIONS VISITED", 20, 25);
      doc.setDrawColor(16, 185, 129);
      doc.line(20, 29, 190, 29);

      yPos = 40;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Rank", 20, yPos);
      doc.text("Cell Tower Address Description", 35, yPos);
      doc.text("Hits Count", 165, yPos);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 9;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      topLocations.forEach(([address, count], idx) => {
        const cleanedAddr = address.length > 70 ? address.substring(0, 67) + '...' : address;
        doc.text(String(idx + 1), 20, yPos);
        doc.text(cleanedAddr, 35, yPos);
        doc.text(String(count) + " hits", 165, yPos);
        yPos += 7.5;
      });

      doc.save(`Forensic_Case_Report_${activeCase.caseIdString}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF report.");
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
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3ecf8e]/10 hover:bg-[#3ecf8e] border border-[#3ecf8e]/30 hover:border-[#3ecf8e] text-[#3ecf8e] hover:text-gray-950 font-bold rounded-xl transition-all cursor-pointer text-sm"
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
            <span className="text-[11px] text-gray-550 font-bold uppercase tracking-wider font-mono">
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
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3ecf8e] hover:bg-[#2ebd7e] text-gray-950 font-bold rounded-xl transition-all cursor-pointer text-sm"
          >
            <Upload className="h-4 w-4" />
            Upload new CDR
          </button>
          
          <button 
            disabled={selectedFileIds.length === 0}
            onClick={() => setShowDeleteMultipleConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 disabled:opacity-40 text-red-400 disabled:text-gray-500 disabled:border-[#2e2e2e] rounded-xl font-semibold transition-all cursor-pointer text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedFileIds.length})
          </button>

          <button 
            onClick={handleGenerateReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] hover:bg-[#3ecf8e]/10 border border-[#2e2e2e] hover:border-[#3ecf8e]/30 text-gray-300 hover:text-white rounded-xl font-semibold transition-all cursor-pointer text-sm"
          >
            <FileText className="h-4 w-4 text-[#3ecf8e]" />
            Generate report
          </button>

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] hover:bg-[#3ecf8e]/10 border border-[#2e2e2e] hover:border-[#3ecf8e]/30 text-gray-300 hover:text-white rounded-xl font-semibold transition-all cursor-pointer text-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#3ecf8e]" />
            Export Excel
          </button>

          <button 
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] hover:bg-[#3ecf8e]/10 border border-[#2e2e2e] hover:border-[#3ecf8e]/30 text-gray-300 hover:text-white rounded-xl font-semibold transition-all cursor-pointer text-sm"
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

      <CustomConfirm
        isOpen={showDeleteMultipleConfirm}
        title="Delete Multiple CDR Files"
        message={`Are you sure you want to delete ${selectedFileIds.length} selected CDR file(s) and all their associated records? This action cannot be undone.`}
        confirmText="Confirm Delete All"
        onConfirm={confirmDeleteMultiple}
        onCancel={() => setShowDeleteMultipleConfirm(false)}
      />

      {isReportOpen && reportData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-forensic-report, #printable-forensic-report * {
                visibility: visible;
              }
              #printable-forensic-report {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                color: #000000 !important;
                background: #ffffff !important;
                padding: 20px;
                font-family: monospace;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div className="bg-[#171717] border border-[#2e2e2e] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between no-print bg-[#1a1a1a]">
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#3ecf8e]" />
                Forensic Summary Report
              </h3>
              <button 
                onClick={() => setIsReportOpen(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6" id="printable-forensic-report">
              {/* Header */}
              <div className="text-center pb-4 border-b border-[#2e2e2e]">
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">CDR FORENSIC ANALYSIS SUMMARY REPORT</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">GENERATED BY LAWMOR FORENSICS AI | STATUS: SECURE</p>
              </div>

              {/* Case Info */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <div><span className="text-gray-500 font-bold">CASE ID:</span> <span className="text-gray-200">{reportData.caseDetails.caseIdString}</span></div>
                  <div><span className="text-gray-500 font-bold">TITLE:</span> <span className="text-gray-200">{reportData.caseDetails.title}</span></div>
                  <div><span className="text-gray-500 font-bold">CASE TYPE:</span> <span className="text-gray-200">{reportData.caseDetails.caseType}</span></div>
                </div>
                <div className="space-y-1">
                  <div><span className="text-gray-500 font-bold">POLICE STATION:</span> <span className="text-gray-200">{reportData.caseDetails.policeStation || 'N/A'}</span></div>
                  <div><span className="text-gray-500 font-bold">INVESTIGATOR:</span> <span className="text-gray-200">{reportData.caseDetails.investigatorName || 'N/A'}</span></div>
                  <div><span className="text-gray-500 font-bold">DATE GENERATED:</span> <span className="text-gray-200">{new Date().toLocaleString()}</span></div>
                </div>
              </div>

              {/* Targets Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-[#3ecf8e] pl-2">Case Target CDR Files</h4>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#2e2e2e] text-gray-500">
                      <th className="py-2">Phone Number</th>
                      <th className="py-2">Operator</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">Records Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.cdrSummary.map((f, i) => (
                      <tr key={i} className="border-b border-[#2e2e2e]/30 text-gray-300">
                        <td className="py-2">{f.phoneNumber}</td>
                        <td className="py-2">{f.operator || 'N/A'}</td>
                        <td className="py-2">{f.category || 'N/A'}</td>
                        <td className="py-2 text-right">{f.recordsCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top Contacts */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-[#3ecf8e] pl-2">Top Interacting Contacts</h4>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#2e2e2e] text-gray-500">
                      <th className="py-2">Contact Number</th>
                      <th className="py-2 text-right">Communication Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topContacts.map((c, i) => (
                      <tr key={i} className="border-b border-[#2e2e2e]/30 text-gray-300">
                        <td className="py-2">{c.number}</td>
                        <td className="py-2 text-right">{c.count} times</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top Locations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-[#3ecf8e] pl-2">Top Cell Tower Locations Visited</h4>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#2e2e2e] text-gray-500">
                      <th className="py-2">Location Address</th>
                      <th className="py-2 text-right">Hits Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topLocations.map((l, i) => (
                      <tr key={i} className="border-b border-[#2e2e2e]/30 text-gray-350">
                        <td className="py-2 max-w-sm truncate" title={l.address}>{l.address}</td>
                        <td className="py-2 text-right">{l.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-[#2e2e2e] flex justify-end gap-3 no-print bg-[#1a1a1a]">
              <button 
                onClick={() => setIsReportOpen(false)}
                className="px-4 py-2 border border-[#2e2e2e] hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer text-sm"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#3ecf8e] hover:bg-[#2ebd7e] text-gray-950 font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
