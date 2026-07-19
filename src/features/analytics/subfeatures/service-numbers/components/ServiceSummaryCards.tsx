import React from 'react';
import { Building2 } from 'lucide-react';

interface ServiceSummaryCardsProps {
  stats: {
    serviceContacts: number;
    hexIdentifiers: number;
    emergency: number;
    banking: number;
    telecom: number;
    government: number;
    shortCodes: number;
  };
}

export const ServiceSummaryCards: React.FC<ServiceSummaryCardsProps> = ({ stats }) => {
  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
      
      <div className="flex items-center gap-6 md:gap-10 overflow-x-auto custom-scrollbar flex-1">
        <div className="text-center shrink-0">
          <div className="text-xl md:text-2xl font-bold text-white">{stats.serviceContacts}</div>
          <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Service Contacts</div>
        </div>

        <div className="text-center shrink-0">
          <div className="text-xl md:text-2xl font-bold text-fuchsia-400">{stats.hexIdentifiers}</div>
          <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Hex Identifiers</div>
        </div>

        <div className="text-center shrink-0">
          <div className="text-xl md:text-2xl font-bold text-red-400">{stats.emergency}</div>
          <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Emergency</div>
        </div>

        <div className="text-center shrink-0">
          <div className="text-xl md:text-2xl font-bold text-amber-400">{stats.banking}</div>
          <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Banking</div>
        </div>

        <div className="text-center shrink-0">
          <div className="text-xl md:text-2xl font-bold text-blue-400">{stats.telecom}</div>
          <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Telecom</div>
        </div>

        <div className="text-center shrink-0">
          <div className="text-xl md:text-2xl font-bold text-emerald-400">{stats.government}</div>
          <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Government</div>
        </div>

        <div className="text-center shrink-0">
          <div className="text-xl md:text-2xl font-bold text-purple-400">{stats.shortCodes}</div>
          <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Short Codes</div>
        </div>
      </div>

      <div className="border-l border-[#2e2e2e] pl-6 py-2 flex items-center gap-3 shrink-0">
        <Building2 className="h-8 w-8 text-[#3ecf8e]" />
        <div className="text-xs text-gray-400 max-w-[120px] leading-tight">
          Service + hex telecom intelligence
        </div>
      </div>
    </div>
  );
};
