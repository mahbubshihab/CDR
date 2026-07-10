import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { Download, Camera, Printer, Maximize2, Users, MessageSquare } from 'lucide-react';

interface IncomingSmsActivityCardsProps {
  records: CDRRecord[];
}

const CardActions = () => (
  <div className="flex items-center gap-1.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Download data">
      <Download className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Screenshot">
      <Camera className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Print">
      <Printer className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Maximize">
      <Maximize2 className="h-3 w-3" />
    </button>
  </div>
);

export const IncomingSmsActivityCards: React.FC<IncomingSmsActivityCardsProps> = ({ records }) => {
  // 13. Incoming vs Outgoing for Top Contacts
  const incomingOutgoingContacts = useMemo(() => {
    const map: { [num: string]: { incoming: number; outgoing: number; total: number } } = {};
    records.forEach(r => {
      if (!r.otherParty) return;
      if (!map[r.otherParty]) {
        map[r.otherParty] = { incoming: 0, outgoing: 0, total: 0 };
      }
      const type = r.usageType.toLowerCase();
      if (type.includes('mtc') || type.includes('incoming')) {
        map[r.otherParty].incoming++;
      } else {
        map[r.otherParty].outgoing++;
      }
      map[r.otherParty].total++;
    });

    return Object.entries(map)
      .map(([number, data]) => ({ number, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [records]);

  // 14. SMS Activity (Top SMS contacts)
  const smsActivity = useMemo(() => {
    const map: { [num: string]: number } = {};
    records.forEach(r => {
      if (r.otherParty && r.usageType.toLowerCase().includes('sms')) {
        map[r.otherParty] = (map[r.otherParty] || 0) + 1;
      }
    });
    const sorted = Object.entries(map)
      .map(([number, count]) => ({ number, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 6).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);

  return (
    <>
      {/* 13. Incoming vs Outgoing for Top Contacts */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Incoming vs Outgoing</h3>
          <CardActions />
        </div>

        <div className="space-y-4 mt-4 text-xs font-mono">
          {incomingOutgoingContacts.map((contact, idx) => {
            const inPct = ((contact.incoming / (contact.total || 1)) * 100).toFixed(0);
            const outPct = ((contact.outgoing / (contact.total || 1)) * 100).toFixed(0);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Users className="h-3.5 w-3.5 text-gray-500" />
                    <span>{contact.number}</span>
                  </span>
                  <span className="font-semibold text-gray-200">
                    In: {contact.incoming} ({inPct}%) | Out: {contact.outgoing} ({outPct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden flex">
                  <div className="bg-[#3ecf8e] h-full" style={{ width: `${inPct}%` }} />
                  <div className="bg-[#8b5cf6] h-full" style={{ width: `${outPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 14. SMS Activity */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">SMS Activity</h3>
          <CardActions />
        </div>

        <div className="space-y-3.5 mt-4 text-xs font-mono">
          {smsActivity.length > 0 ? (
            smsActivity.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                    <span>{item.number}</span>
                  </span>
                  <span className="font-semibold text-gray-200">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                  <div className="bg-[#f59e0b] h-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-500">
              No SMS activity logs.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
