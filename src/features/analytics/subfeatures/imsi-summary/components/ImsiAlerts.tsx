import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ImsiSummaryStats as Stats } from '../hooks/useImsiAnalysis';

interface ImsiAlertsProps {
  stats: Stats;
}

export const ImsiAlerts: React.FC<ImsiAlertsProps> = ({ stats }) => {
  const alerts: string[] = [];

  if (stats.multipleSims) {
    alerts.push('Multiple SIM cards detected');
  }
  if (stats.simSwitching) {
    alerts.push('SIM switching detected');
  }
  if (stats.deviceChangeOnSim) {
    alerts.push('Device change on SIM detected');
  }
  if (stats.sharedImsiActivity) {
    alerts.push('Shared IMSI activity');
  }

  if (alerts.length === 0) return null;

  return (
    <div className="bg-[#1a1111] border border-red-900/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <h3 className="text-sm font-semibold text-red-400">IMSI Intelligence Alerts</h3>
      </div>
      <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-1">
        {alerts.map((alert, idx) => (
          <li key={idx}>{alert}</li>
        ))}
      </ul>
    </div>
  );
};
