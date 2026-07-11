import React from 'react';
import { ExportableChartCard } from '../../../../../components/ui/ExportableChartCard';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

interface ImeiChartData {
  imei: string;
  usageCount: number;
  linkedNumbers: number;
}

interface ImeiChartsProps {
  data: ImeiChartData[];
}

export const ImeiCharts: React.FC<ImeiChartsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ExportableChartCard title="IMEI Usage Frequency">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis dataKey="imei" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#3ecf8e' }}
                cursor={{ fill: '#ffffff10' }}
              />
              <Bar dataKey="usageCount" name="Usage Count" fill="#9d4edd" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ExportableChartCard>

      <ExportableChartCard title="Shared IMEI Graph">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis dataKey="imei" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#3ecf8e' }}
                cursor={{ fill: '#ffffff10' }}
              />
              <Bar dataKey="linkedNumbers" name="Linked Numbers" fill="#ff4d4f" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ExportableChartCard>

      <ExportableChartCard title="IMEI Activity Timeline">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis dataKey="imei" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#00bcd4' }}
                cursor={{ fill: '#ffffff10' }}
              />
              <Bar dataKey="usageCount" name="Events" fill="#00bcd4" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ExportableChartCard>
    </div>
  );
};
