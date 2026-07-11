import React from 'react';

interface MfcHighFrequencyProps {
  contacts: string[];
}

export const MfcHighFrequency: React.FC<MfcHighFrequencyProps> = ({ contacts }) => {
  if (contacts.length === 0) return null;

  return (
    <div className="bg-[#171717]/60 border border-[#2e2e2e] rounded-xl p-3 px-4 flex flex-col gap-2.5">
      <span className="text-yellow-500 font-semibold text-xs">
        High frequency contacts detected
      </span>
      <div className="flex flex-wrap gap-2">
        {contacts.map(num => (
          <span key={num} className="bg-[#1e3a8a]/40 text-[#60a5fa] border border-[#1e3a8a] px-2.5 py-0.5 rounded shadow-sm font-mono text-[11px] font-bold">
            {num}
          </span>
        ))}
      </div>
    </div>
  );
};
