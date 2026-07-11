import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CallsDayVsNightTabProps {
  records: CDRRecord[];
}

const isTimeInRange = (timestamp: number | string | undefined, startHM: string, endHM: string) => {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const m = d.getHours() * 60 + d.getMinutes();
  
  const [sH, sM] = startHM.split(':').map(Number);
  const [eH, eM] = endHM.split(':').map(Number);
  
  const startM = sH * 60 + sM;
  const endM = eH * 60 + eM;
  
  if (startM <= endM) {
    return m >= startM && m <= endM;
  } else {
    return m >= startM || m <= endM;
  }
};

export const CallsDayVsNightTab: React.FC<CallsDayVsNightTabProps> = ({ records }) => {
  const { dayRecords, nightRecords, stats } = useMemo(() => {
    // Hardcoded ranges as per typical config
    const dayStart = '06:00', dayEnd = '17:59';
    const nightStart = '18:00', nightEnd = '05:59';

    const day = records.filter(r => isTimeInRange(r.timestamp, dayStart, dayEnd));
    const night = records.filter(r => isTimeInRange(r.timestamp, nightStart, nightEnd));

    const dayContacts = new Set(day.map(r => r.otherParty).filter(Boolean));
    const nightContacts = new Set(night.map(r => r.otherParty).filter(Boolean));

    const dayOnly = Array.from(dayContacts).filter(c => !nightContacts.has(c));
    const nightOnly = Array.from(nightContacts).filter(c => !dayContacts.has(c));
    const shared = Array.from(dayContacts).filter(c => nightContacts.has(c));

    const total = day.length + night.length;

    return {
      dayRecords: day,
      nightRecords: night,
      stats: {
        dayCount: day.length,
        nightCount: night.length,
        dayShare: total > 0 ? ((day.length / total) * 100).toFixed(1) : '0.0',
        nightShare: total > 0 ? ((night.length / total) * 100).toFixed(1) : '0.0',
        dayOnly,
        nightOnly,
        shared
      }
    };
  }, [records]);

  const pieData = [
    { name: 'Day', value: stats.dayCount },
    { name: 'Night', value: stats.nightCount }
  ];

  return (
    <div className="w-full pb-10">
      <div className="grid grid-cols-2 gap-6 min-h-[600px]">
        {/* Left Column: Pie Chart and Stats */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-6 flex flex-col items-center justify-center flex-1">
            <h3 className="text-sm font-semibold text-gray-300 w-full mb-4">Day vs Night Activity</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#3b82f6" /> {/* Day color */}
                    <Cell fill="#3ecf8e" /> {/* Night color */}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full mt-6 space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                  <span>Day</span>
                </div>
                <div className="flex gap-4">
                  <span>{stats.dayCount}</span>
                  <span className="font-bold text-[#3b82f6]">{stats.dayShare}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3ecf8e]"></div>
                  <span>Night</span>
                </div>
                <div className="flex gap-4">
                  <span>{stats.nightCount}</span>
                  <span className="font-bold text-[#3ecf8e]">{stats.nightShare}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Lists */}
        <div className="flex flex-col gap-6">
          <ContactListCard title={`Day-Only Contacts (${stats.dayOnly.length})`} contacts={stats.dayOnly} />
          <ContactListCard title={`Night-Only Contacts (${stats.nightOnly.length})`} contacts={stats.nightOnly} />
          <ContactListCard title={`Shared Day & Night Contacts (${stats.shared.length})`} contacts={stats.shared} />
        </div>
      </div>
    </div>
  );
};

const ContactListCard: React.FC<{ title: string, contacts: string[] }> = ({ title, contacts }) => {
  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-4 flex-1 flex flex-col max-h-[300px]">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-wrap gap-2">
          {contacts.length > 0 ? contacts.map(c => (
            <span key={c} className="text-xs font-mono text-gray-400 bg-[#1e1e1e] px-2 py-1 rounded">
              {c}
            </span>
          )) : (
            <span className="text-xs text-gray-600 font-mono">None</span>
          )}
        </div>
      </div>
    </div>
  );
};
