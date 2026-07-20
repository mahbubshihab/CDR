import React, { useEffect, useState } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { db, type Case } from '../../utils/db';

interface ReportData {
  caseInfo: Case;
  filesCount: number;
  recordsCount: number;
  providers: Record<string, number>;
}

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const allCases = await db.cases.toArray();
        const data: ReportData[] = [];
        
        for (const c of allCases) {
          if (!c.id) continue;
          
          const files = await db.cdrFiles.where('caseId').equals(c.id).toArray();
          let totalRecords = 0;
          files.forEach(f => {
            totalRecords += f.recordsCount || 0;
          });
          
          const providers: Record<string, number> = {};
          await db.cdrRecords.where('caseId').equals(c.id).each(r => {
            const p = r.provider || 'Unknown';
            providers[p] = (providers[p] || 0) + 1;
          });
          
          data.push({
            caseInfo: c,
            filesCount: files.length,
            recordsCount: totalRecords,
            providers
          });
        }
        
        setReports(data);
      } catch (err) {
        console.error("Error loading reports", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (reports.length === 0) return;
    
    const headers = ["Case ID", "Title", "Status", "Total Files", "Total Records", "Providers"];
    const rows = reports.map(r => {
      const pStr = Object.entries(r.providers).map(([k,v]) => `${k}: ${v}`).join(' | ');
      return [
        r.caseInfo.caseIdString,
        r.caseInfo.title,
        r.caseInfo.status,
        r.filesCount,
        r.recordsCount,
        pStr
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Case_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#121212] animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">Forensic Reports</h2>
          <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
            Case-Level Audit Summary
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] hover:bg-[#2e2e2e] text-gray-300 rounded-lg text-xs font-semibold transition-colors border border-[#333]">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#3ecf8e]/10 hover:bg-[#3ecf8e]/20 text-[#3ecf8e] rounded-lg text-xs font-semibold transition-colors border border-[#3ecf8e]/20">
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-6 print:bg-white print:border-none print:text-black">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center flex-col text-gray-500">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm font-semibold">N/A</p>
            <p className="text-xs mt-1">No cases available in CDR file</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report, idx) => (
              <div key={idx} className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-5 print:border-gray-300 print:bg-white">
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-[#2e2e2e] print:border-gray-300">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200 print:text-black flex items-center gap-2">
                      <span className="text-[#3ecf8e] print:text-gray-600">[{report.caseInfo.caseIdString}]</span>
                      {report.caseInfo.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 uppercase font-mono">
                      Status: <span className={report.caseInfo.status === 'Active' ? 'text-green-500' : 'text-yellow-500'}>{report.caseInfo.status}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 print:text-gray-600">Investigator: {report.caseInfo.investigatorName || 'N/A'}</p>
                    <p className="text-xs text-gray-400 mt-1 print:text-gray-600">Created: {new Date(report.caseInfo.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] print:border-gray-300 print:bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Log Files</p>
                    <p className="text-lg font-semibold text-gray-200 mt-1 print:text-black">{report.filesCount}</p>
                  </div>
                  <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] print:border-gray-300 print:bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Total Records</p>
                    <p className="text-lg font-semibold text-gray-200 mt-1 print:text-black">{report.recordsCount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] print:border-gray-300 print:bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">Provider Distribution</p>
                    {Object.keys(report.providers).length === 0 ? (
                      <p className="text-xs text-gray-400 print:text-gray-600">N/A</p>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(report.providers).map(([provider, count]) => (
                          <div key={provider} className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 print:text-gray-700">{provider}</span>
                            <span className="text-gray-200 font-semibold print:text-black">{count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
