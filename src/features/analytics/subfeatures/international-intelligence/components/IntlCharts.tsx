import React from 'react';
import { Camera, Printer, Maximize2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import type { CountryAggregate } from '../types';

interface IntlChartsProps {
  countries: CountryAggregate[];
  dayComms: number;
  nightComms: number;
  dayDuration: number;
  nightDuration: number;
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-[#1e293b] border border-[#334155] rounded-xl flex flex-col overflow-hidden">
    <div className="flex justify-between items-center px-4 py-3 border-b border-[#334155]">
      <h3 className="text-xs font-semibold text-gray-200">{title}</h3>
      <div className="flex items-center gap-2">
        <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#334155] transition-colors" title="Screenshot">
          <Camera className="w-3.5 h-3.5" />
        </button>
        <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#334155] transition-colors" title="Print">
          <Printer className="w-3.5 h-3.5" />
        </button>
        <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#334155] transition-colors" title="Expand">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    <div className="p-4 flex-1 min-h-[250px] relative">
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-[#334155] p-3 rounded-lg shadow-xl">
        <p className="text-gray-300 text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const IntlCharts: React.FC<IntlChartsProps> = ({ 
  countries,
  dayComms,
  nightComms,
  dayDuration,
  nightDuration
}) => {
  // Chart Data preparation
  const contactsData = countries.map(c => ({
    name: c.code,
    fullName: c.country,
    contacts: c.numbers.length
  })).slice(0, 10);

  const commsData = countries.map(c => ({
    name: c.code,
    fullName: c.country,
    comms: c.totalComms
  })).slice(0, 10);

  const riskCounts = {
    LOW: countries.filter(c => c.riskLevel === 'LOW').length,
    MEDIUM: countries.filter(c => c.riskLevel === 'MEDIUM').length,
    HIGH: countries.filter(c => c.riskLevel === 'HIGH').length,
  };
  
  const totalWithRisk = countries.length || 1; // avoid division by zero
  
  const riskData = [
    { name: 'LOW', value: riskCounts.LOW, percentage: ((riskCounts.LOW / totalWithRisk) * 100).toFixed(1) },
    { name: 'MEDIUM', value: riskCounts.MEDIUM, percentage: ((riskCounts.MEDIUM / totalWithRisk) * 100).toFixed(1) },
    { name: 'HIGH', value: riskCounts.HIGH, percentage: ((riskCounts.HIGH / totalWithRisk) * 100).toFixed(1) },
  ].filter(d => d.value > 0);

  const riskColors = {
    'LOW': '#0ea5e9',
    'MEDIUM': '#fb923c',
    'HIGH': '#a855f7'
  };

  const dayNightCommsData = [
    { name: 'Day', value: dayComms },
    { name: 'Night', value: nightComms }
  ];

  const dayNightDurationData = [
    { name: 'Day', value: parseFloat((dayDuration / 60).toFixed(1)) },
    { name: 'Night', value: parseFloat((nightDuration / 60).toFixed(1)) }
  ];

  return (
    <div className="space-y-6">
      {/* Row 1: Contacts & Communications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Contacts by Country">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contactsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
              <Bar dataKey="contacts" name="Contacts" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Communications by Country">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
              <Bar dataKey="comms" name="Communications" fill="#fb923c" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Risk & Day/Night */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Risk Distribution">
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={2}
                  label={({ name, percentage }: any) => `${name} ${percentage}%`}
                  stroke="none"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={riskColors[entry.name as keyof typeof riskColors]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-mono">
               No risk data available
             </div>
          )}
        </ChartCard>

        <ChartCard title="Day vs Night Communications">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayNightCommsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
              <Bar dataKey="value" name="Communications" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Day vs Night Duration (min)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayNightDurationData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
              <Bar dataKey="value" name="Duration (min)" fill="#fb923c" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
