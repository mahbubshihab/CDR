import React, { useMemo, useState } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { ChartCardWrapper } from './ChartCardWrapper';
import { Users, MessageSquare } from 'lucide-react';

interface IncomingSmsActivityCardsProps {
  records: CDRRecord[];
}

export const IncomingSmsActivityCards: React.FC<IncomingSmsActivityCardsProps> = ({ records }) => {
  const [hoveredInOut, setHoveredInOut] = useState<{ number: string; incoming: number; outgoing: number; total: number } | null>(null);
  const [hoveredSms, setHoveredSms] = useState<{ number: string; count: number; pct: string } | null>(null);

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
      <ChartCardWrapper
        title="Incoming vs Outgoing"
        exportData={incomingOutgoingContacts}
      >
        <div className="space-y-4 mt-4 text-xs font-mono relative">
          {incomingOutgoingContacts.map((contact, idx) => {
            const inPct = ((contact.incoming / (contact.total || 1)) * 100).toFixed(0);
            const outPct = ((contact.outgoing / (contact.total || 1)) * 100).toFixed(0);
            return (
              <div 
                key={idx} 
                className="space-y-1 cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/30 transition-colors"
                onMouseEnter={() => setHoveredInOut(contact)}
                onMouseLeave={() => setHoveredInOut(null)}
              >
                <div className="flex justify-between text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-205">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    <span>{contact.number}</span>
                  </span>
                  <span className="font-semibold text-white">
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

          {/* Interactive Floating Tooltip */}
          {hoveredInOut && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#171717] border border-gray-600 rounded-lg p-2.5 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none">
              <span className="block text-gray-400 font-bold">Direction Split</span>
              <span className="block text-gray-200 mt-0.5">Number: {hoveredInOut.number}</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Incoming: {hoveredInOut.incoming}</span>
              <span className="block text-[#8b5cf6] font-semibold mt-0.5">Outgoing: {hoveredInOut.outgoing}</span>
              <span className="block text-white font-semibold mt-0.5">Total Hits: {hoveredInOut.total}</span>
            </div>
          )}
        </div>
      </ChartCardWrapper>

      {/* 14. SMS Activity */}
      <ChartCardWrapper
        title="SMS Activity"
        exportData={smsActivity}
      >
        <div className="space-y-3.5 mt-4 text-xs font-mono relative">
          {smsActivity.length > 0 ? (
            smsActivity.map((item, idx) => (
              <div 
                key={idx} 
                className="space-y-1 cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/30 transition-colors"
                onMouseEnter={() => setHoveredSms(item)}
                onMouseLeave={() => setHoveredSms(null)}
              >
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-200">
                    <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                    <span>{item.number}</span>
                  </span>
                  <span className="font-semibold text-white">{item.count} ({item.pct}%)</span>
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

          {/* Interactive Floating Tooltip */}
          {hoveredSms && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#171717] border border-gray-600 rounded-lg p-2.5 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none">
              <span className="block text-gray-400 font-bold">SMS Contact Details</span>
              <span className="block text-gray-200 mt-0.5">Number: {hoveredSms.number}</span>
              <span className="block text-[#f59e0b] font-semibold mt-0.5">SMS Count: {hoveredSms.count} ({hoveredSms.pct}%)</span>
            </div>
          )}
        </div>
      </ChartCardWrapper>
    </>
  );
};
