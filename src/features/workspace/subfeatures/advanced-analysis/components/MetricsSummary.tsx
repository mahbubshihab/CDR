import React from 'react';
import { Phone, MessageSquare, Calendar, MapPin } from 'lucide-react';

interface MetricsSummaryProps {
  stats: {
    callsCount: number;
    smsCount: number;
    activeDays: number;
    locationsCount: number;
  };
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Voice Calls volume',
      value: stats.callsCount.toLocaleString(),
      desc: 'Total inbound/outbound calls',
      icon: Phone,
      color: 'text-[#3ecf8e]',
      bg: 'bg-[#3ecf8e]/5'
    },
    {
      title: 'SMS Messages volume',
      value: stats.smsCount.toLocaleString(),
      desc: 'Short messages logs recorded',
      icon: MessageSquare,
      color: 'text-[#3ecf8e]',
      bg: 'bg-[#3ecf8e]/5'
    },
    {
      title: 'Total Active Days',
      value: stats.activeDays.toString(),
      desc: 'Days with registered activities',
      icon: Calendar,
      color: 'text-[#3ecf8e]',
      bg: 'bg-[#3ecf8e]/5'
    },
    {
      title: 'Distinct Locations',
      value: stats.locationsCount.toString(),
      desc: 'Cell towers mapped in workspace',
      icon: MapPin,
      color: 'text-[#3ecf8e]',
      bg: 'bg-[#3ecf8e]/5'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-4 flex items-center gap-4 hover:border-[#3ecf8e]/30 transition-colors">
          <div className={`h-10 w-10 ${card.bg} border border-[#2e2e2e] rounded-lg flex items-center justify-center`}>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </div>
          <div className="leading-tight text-left">
            <span className="text-[10px] text-gray-500 font-semibold font-mono uppercase tracking-wider block">
              {card.title}
            </span>
            <strong className="text-xl font-semibold text-gray-200 font-mono mt-0.5 block">{card.value}</strong>
            <span className="text-[10px] text-gray-500 block font-medium mt-0.5">{card.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
