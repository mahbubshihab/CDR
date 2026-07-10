import React from 'react';
import { ArrowRight, Compass, Network, Hourglass } from 'lucide-react';

interface SecondaryPortalGridProps {
  locationsCount: number;
  uniqueBPartiesCount: number;
  firstActivity: string;
  lastActivity: string;
  activeDays: number;
  onNavigateToTab?: (tabId: string) => void;
}

export const SecondaryPortalGrid: React.FC<SecondaryPortalGridProps> = ({
  locationsCount,
  uniqueBPartiesCount,
  firstActivity,
  lastActivity,
  activeDays,
  onNavigateToTab
}) => {
  const cards = [
    {
      id: 'loc_intel',
      title: 'Geo Intelligence',
      value: locationsCount,
      sub: 'Total Locations',
      meta: `Active Towers: ${locationsCount}`,
      icon: Compass,
      color: 'text-teal-400'
    },
    {
      id: 'graph',
      title: 'Link Analysis',
      value: uniqueBPartiesCount,
      sub: 'Total Connected Numbers',
      meta: `Total Relationships: ${uniqueBPartiesCount}`,
      icon: Network,
      color: 'text-emerald-400'
    },
    {
      id: 'locations',
      title: 'Timeline Intelligence',
      value: firstActivity,
      sub: 'First Activity',
      meta: `Last: ${lastActivity} · ${activeDays} Days`,
      icon: Hourglass,
      color: 'text-amber-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div 
            key={idx}
            onClick={() => onNavigateToTab?.(c.id)}
            className="bg-[#1e1e1e] border border-[#2e2e2e]/90 rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 hover:bg-[#1e1e1e]/80 cursor-pointer transition-all duration-200 group text-left"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4.5 w-4.5 ${c.color}`} />
                <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">{c.title}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </div>

            <div className="mt-4">
              <span className="text-xl font-bold text-gray-150 block truncate">{c.value}</span>
              <span className="text-[9px] text-gray-500 font-semibold block mt-1.5">{c.sub}</span>
            </div>

            <div className="border-t border-[#2e2e2e]/55 mt-3 pt-2 text-[8px] text-gray-600 font-bold uppercase tracking-wide truncate max-w-full">
              {c.meta}
            </div>
          </div>
        );
      })}
    </div>
  );
};
