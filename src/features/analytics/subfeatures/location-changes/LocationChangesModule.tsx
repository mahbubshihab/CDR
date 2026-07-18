import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';

interface LocationChangesModuleProps {
  cdrFile: CDRFile | null;
  records: CDRRecord[];
}

interface LocationTransition {
  fromLocation: string;
  toLocation: string;
  frequency: number;
}

export const LocationChangesModule: React.FC<LocationChangesModuleProps> = ({ cdrFile, records }) => {
  const [loading, setLoading] = useState(true);
  const [transitions, setTransitions] = useState<LocationTransition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!records || records.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Run processing after a small timeout to not block UI thread
    const timer = setTimeout(() => {
      try {
        const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);
        
        const transitionMap = new Map<string, LocationTransition>();
        let previousLocation: string | null = null;

        for (const record of sortedRecords) {
          const currentLocation = record.address;
          
          if (!currentLocation) {
            continue;
          }

          if (previousLocation !== null && previousLocation !== currentLocation) {
            const key = `${previousLocation}___${currentLocation}`;
            
            if (transitionMap.has(key)) {
              transitionMap.get(key)!.frequency += 1;
            } else {
              transitionMap.set(key, {
                fromLocation: previousLocation,
                toLocation: currentLocation,
                frequency: 1
              });
            }
          }
          
          previousLocation = currentLocation;
        }

        const transitionArray = Array.from(transitionMap.values())
          .sort((a, b) => b.frequency - a.frequency); // Sort by frequency descending
          
        setTransitions(transitionArray);
      } catch (error) {
        console.error("Error processing location transitions:", error);
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [records]);

  const filteredTransitions = useMemo(() => {
    if (!searchTerm.trim()) return transitions;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return transitions.filter(t => 
      t.fromLocation.toLowerCase().includes(lowerSearchTerm) || 
      t.toLocation.toLowerCase().includes(lowerSearchTerm)
    );
  }, [transitions, searchTerm]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-gray-200">
      {/* Header controls */}
      <div className="p-4 border-b border-[#2e2e2e] shrink-0 bg-[#121212] flex items-center justify-between">
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-1.5 border border-[#3e3e3e] rounded-md leading-5 bg-[#1c1c1c] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] focus:border-[#3ecf8e] sm:text-sm transition-colors"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 bg-[#1c1c1c] px-3 py-1.5 rounded border border-[#2e2e2e]">
            Columns
          </span>
          <span className="text-sm text-gray-400">
            {filteredTransitions.length} rows
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-[#121212] p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3ecf8e]"></div>
            <p className="text-gray-400 mt-4 text-sm font-mono">Analyzing location transitions...</p>
          </div>
        ) : filteredTransitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-[#1c1c1c]/50 rounded-lg border border-[#2e2e2e] border-dashed">
            <p className="text-gray-400 text-sm font-mono mb-2">No location transitions found.</p>
            {searchTerm && (
              <p className="text-gray-500 text-xs">Try adjusting your search criteria.</p>
            )}
          </div>
        ) : (
          <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-[#2e2e2e]">
              <thead className="bg-[#171717]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    From
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Freq
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Dist km
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Dir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e] bg-[#121212]">
                {filteredTransitions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-[#1c1c1c]/80 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                      {t.fromLocation}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                      {t.toLocation}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                      {t.frequency}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                      N/A
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                      N/A
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
