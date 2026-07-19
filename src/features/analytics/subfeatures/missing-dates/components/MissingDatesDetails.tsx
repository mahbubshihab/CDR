import React from 'react';
import { type DateStats } from '../MissingDatesModule';
import { AlertTriangle, Clock } from 'lucide-react';

export const MissingDatesDetails: React.FC<{ dateStats: DateStats[] }> = ({ dateStats }) => {
  const missingStats = dateStats.filter(s => !s.isActive);

  if (missingStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Clock className="w-12 h-12 mb-4 text-gray-600" />
        <p>No missing dates found in the CDR record range.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Missing dates details ({missingStats.length})
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {missingStats.map((stat) => {
          const formattedDate = `${String(stat.date.getDate()).padStart(2, '0')}-${stat.date.toLocaleString('default', { month: 'short' })}-${stat.date.getFullYear()}`;
          const dayOfWeek = stat.date.toLocaleString('default', { weekday: 'long' });
          
          return (
            <div 
              key={stat.dateStr} 
              className="bg-red-900/10 border border-red-900/50 rounded-md p-3 flex items-start gap-3 hover:bg-red-900/20 transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-red-400 font-medium text-sm">{formattedDate}</div>
                <div className="text-gray-500 text-xs mt-0.5">({dayOfWeek})</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
