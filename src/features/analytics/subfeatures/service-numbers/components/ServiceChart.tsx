import React from 'react';
import { ExportableChartCard } from '../../../../../components/ui/ExportableChartCard';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

interface ServiceChartProps {
  data: { category: string; count: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-[#334155] p-3 rounded-lg shadow-xl">
        <p className="text-gray-200 font-semibold mb-1 text-xs">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="text-white font-mono">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ServiceChart: React.FC<ServiceChartProps> = ({ data }) => {
  return (
    <ExportableChartCard
      id="chart-service-category"
      title="Services by Category"
      exportData={data}
      contentClassName="h-[250px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3b4e" vertical={false} />
          <XAxis 
            dataKey="category" 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
          <Bar 
            dataKey="count" 
            name="Frequency" 
            fill="#a855f7" 
            radius={[4, 4, 0, 0]} 
            barSize={60} 
          />
        </BarChart>
      </ResponsiveContainer>
    </ExportableChartCard>
  );
};
