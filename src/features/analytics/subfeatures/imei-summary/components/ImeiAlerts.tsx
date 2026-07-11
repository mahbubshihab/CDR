import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ImeiSummaryStats as Stats } from '../hooks/useImeiAnalysis';

interface ImeiAlertsProps {
  stats: Stats;
}

export const ImeiAlerts: React.FC<ImeiAlertsProps> = ({ stats }) => {
  const alerts: string[] = [];

  if (stats.multipleDevices) {
    alerts.push('Multiple devices detected');
  }
  if (stats.deviceSwitching) {
    alerts.push('Device switching detected');
  }
  if (stats.sharedImei) {
    alerts.push('Shared IMEI activity');
  }
  if (stats.correctedCount > 0) {
    alerts.push(`${stats.correctedCount} IMEI(s) corrected via Luhn`);
  }

  if (alerts.length === 0) return null;

  return (
    <div className="bg-[#1a1111] border border-red-900/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <h3 className="text-sm font-semibold text-red-400">IMEI Intelligence Alerts</h3>
      </div>
      <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-1">
        {alerts.map((alert, idx) => (
          <li key={idx}>{alert}</li>
        ))}
      </ul>
    </div>
  );
};
