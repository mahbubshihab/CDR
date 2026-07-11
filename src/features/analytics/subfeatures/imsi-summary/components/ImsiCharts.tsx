import React from 'react';
import { ExportableChartCard } from '../../../../../components/ui/ExportableChartCard';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import type { ImsiChartData } from '../hooks/useImsiAnalysis';

interface ImsiChartsProps {
  data: ImsiChartData[];
}

const COLORS = ['#00bcd4', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];

export const ImsiCharts: React.FC<ImsiChartsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ExportableChartCard title="IMSI Usage Frequency">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis dataKey="imsi" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#00bcd4' }}
                cursor={{ fill: '#ffffff10' }}
              />
              <Bar dataKey="usageCount" name="Usage Count" fill="#00bcd4" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ExportableChartCard>

      <ExportableChartCard title="Operator Breakdown">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis dataKey="operator" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                cursor={{ fill: '#ffffff10' }}
              />
              <Bar dataKey="usageCount" name="Events" radius={[4, 4, 0, 0]} barSize={80}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ExportableChartCard>

      <ExportableChartCard title="Devices per SIM">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis dataKey="imsi" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#ff9800' }}
                cursor={{ fill: '#ffffff10' }}
              />
              <Bar dataKey="devices" name="Unique IMEIs" fill="#ff9800" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ExportableChartCard>
    </div>
  );
};
