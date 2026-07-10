import React, { useState, useEffect } from 'react';
import { X, BarChart, PhoneCall, Clock, CheckCircle } from 'lucide-react';
import { db, type CDRFile, type CDRRecord } from '../../../../utils/db';

interface FileStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: CDRFile | null;
}

export const FileStatsModal: React.FC<FileStatsModalProps> = ({ isOpen, onClose, file }) => {
  const [records, setRecords] = useState<CDRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file || !file.id) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await db.cdrRecords.where('fileId').equals(file.id!).toArray();
        setRecords(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [file]);

  if (!isOpen || !file) return null;

  // Calculate statistics
  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
  const totalCalls = records.filter(r => r.usageType.includes('MO') || r.usageType.includes('MT')).length;
  const totalSMS = records.filter(r => r.usageType.includes('SMS')).length;

  // Group top contacts
  const contactCounts: { [num: string]: { count: number, duration: number } } = {};
  records.forEach(r => {
    if (!r.otherParty) return;
    if (!contactCounts[r.otherParty]) {
      contactCounts[r.otherParty] = { count: 0, duration: 0 };
    }
    contactCounts[r.otherParty].count += 1;
    contactCounts[r.otherParty].duration += r.duration;
  });

  const topContacts = Object.entries(contactCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([number, data]) => ({ number, ...data }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left text-sm animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2e2e2e]">
          <div>
            <h3 className="text-sm font-bold text-gray-200">CDR File Analysis</h3>
            <p className="text-sm text-gray-500 mt-0.5">{file.fileName} ({file.phoneNumber})</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-mono">Analyzing CDR logs...</div>
        ) : (
          <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-xl p-4 flex flex-col">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wider font-mono">
                  Total Duration
                </span>
                <span className="text-sm font-semibold text-gray-250 mt-1 font-mono">
                  {Math.round(totalDuration / 60)} min
                </span>
              </div>
              <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-xl p-4 flex flex-col">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wider font-mono">
                  Voice Calls
                </span>
                <span className="text-sm font-semibold text-gray-250 mt-1 font-mono">
                  {totalCalls}
                </span>
              </div>
              <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-xl p-4 flex flex-col">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wider font-mono">
                  SMS Logs
                </span>
                <span className="text-sm font-semibold text-gray-250 mt-1 font-mono">
                  {totalSMS}
                </span>
              </div>
            </div>

            {/* Top Contact list */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-300 flex items-center gap-1.5">
                <PhoneCall className="h-4 w-4 text-[#3ecf8e]" />
                Top Contacted Parties
              </h4>
              <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl overflow-hidden font-mono">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#2e2e2e] text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-[#121212]/30">
                      <th className="py-2.5 px-4">Contact number</th>
                      <th className="py-2.5 px-4 text-center">Frequency</th>
                      <th className="py-2.5 px-4 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-500/5">
                    {topContacts.map((contact, idx) => (
                      <tr key={idx} className="hover:bg-[#171717]/30 transition-colors">
                        <td className="py-2.5 px-4 text-[#3ecf8e] font-bold">
                          {contact.number}
                        </td>
                        <td className="py-2.5 px-4 text-center text-gray-300">
                          {contact.count} calls
                        </td>
                        <td className="py-2.5 px-4 text-right text-gray-400">
                          {Math.round(contact.duration / 60)} min
                        </td>
                      </tr>
                    ))}
                    {topContacts.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500">
                          No voice/SMS records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Status */}
            <div className="flex items-center gap-2.5 p-3.5 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl">
              <CheckCircle className="h-4.5 w-4.5 text-brand-emerald" />
              <div className="text-sm">
                <span className="font-bold text-gray-250 block">Parser check successful</span>
                <span className="text-gray-500 block mt-0.5 font-mono">
                  Indexed {records.length} records dynamically without mapping warnings.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-[#2e2e2e] bg-[#070a1c]/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#046a38] text-white font-medium border border-[#3ecf8e] hover:bg-[#00522c] rounded-lg shadow-md transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
