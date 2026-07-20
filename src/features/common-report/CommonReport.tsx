import React, { useState, useEffect } from 'react';
import { BookOpen, Search, MapPin, Users, Filter } from 'lucide-react';
import { db, type Case } from '../../utils/db';

interface CommonOverlap {
  type: 'B-Party' | 'Location';
  value: string;
  count: number;
  involvedCases: string[];
}

export const CommonReport: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCases, setSelectedCases] = useState<number[]>([]);
  const [overlaps, setOverlaps] = useState<CommonOverlap[]>([]);
  const [loading, setLoading] = useState(false);
  const [overlapType, setOverlapType] = useState<'both' | 'bparty' | 'location'>('both');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    const allCases = await db.cases.toArray();
    setCases(allCases);
  };

  const toggleCase = (caseId: number) => {
    setSelectedCases(prev => 
      prev.includes(caseId) ? prev.filter(id => id !== caseId) : [...prev, caseId]
    );
  };

  const findOverlaps = async () => {
    if (selectedCases.length < 2) return;
    setLoading(true);
    setOverlaps([]);

    try {
      const bPartyMap = new Map<string, Set<number>>();
      const locationMap = new Map<string, Set<number>>();
      const caseTitles = new Map(cases.map(c => [c.id, c.title]));

      for (const caseId of selectedCases) {
        const records = await db.cdrRecords.where('caseId').equals(caseId).toArray();
        
        for (const record of records) {
          if ((overlapType === 'both' || overlapType === 'bparty') && record.otherParty) {
            if (!bPartyMap.has(record.otherParty)) {
              bPartyMap.set(record.otherParty, new Set());
            }
            bPartyMap.get(record.otherParty)!.add(caseId);
          }
          
          if ((overlapType === 'both' || overlapType === 'location') && record.address) {
            if (!locationMap.has(record.address)) {
              locationMap.set(record.address, new Set());
            }
            locationMap.get(record.address)!.add(caseId);
          }
        }
      }

      const results: CommonOverlap[] = [];

      if (overlapType === 'both' || overlapType === 'bparty') {
        bPartyMap.forEach((caseSet, bparty) => {
          if (caseSet.size > 1) {
            results.push({
              type: 'B-Party',
              value: bparty,
              count: caseSet.size,
              involvedCases: Array.from(caseSet).map(id => caseTitles.get(id) || 'Unknown')
            });
          }
        });
      }

      if (overlapType === 'both' || overlapType === 'location') {
        locationMap.forEach((caseSet, loc) => {
          if (caseSet.size > 1) {
            results.push({
              type: 'Location',
              value: loc,
              count: caseSet.size,
              involvedCases: Array.from(caseSet).map(id => caseTitles.get(id) || 'Unknown')
            });
          }
        });
      }

      results.sort((a, b) => b.count - a.count);
      setOverlaps(results);
    } catch (err) {
      console.error("Error finding overlaps", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#121212] animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-200">Common Report (Overlap Finder)</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Analyze overlapping contacts and shared locations between multiple cases
        </p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        <div className="w-1/3 flex flex-col bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e] bg-[#1a1a1a]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Configuration</h3>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">1. Select Cases (Min 2)</h4>
              <div className="space-y-2">
                {cases.length === 0 ? (
                  <p className="text-xs text-gray-500">N/A - No cases available.</p>
                ) : (
                  cases.map(c => (
                    <label key={c.id} className="flex items-center gap-3 p-3 bg-[#121212] border border-[#2e2e2e] rounded-lg cursor-pointer hover:border-[#3ecf8e]/50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedCases.includes(c.id!)}
                        onChange={() => toggleCase(c.id!)}
                        className="accent-[#3ecf8e] w-4 h-4 rounded bg-[#1e1e1e] border-[#2e2e2e]"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-gray-200 truncate">{c.title}</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{c.caseIdString}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" /> 2. Analysis Type
              </h4>
              <select 
                value={overlapType} 
                onChange={(e) => setOverlapType(e.target.value as any)}
                className="w-full bg-[#121212] border border-[#2e2e2e] text-gray-200 text-xs rounded p-2.5 outline-none focus:border-[#3ecf8e]"
              >
                <option value="both">Both B-Parties & Locations</option>
                <option value="bparty">Common B-Parties Only</option>
                <option value="location">Common Locations Only</option>
              </select>
            </div>
            
            <button 
              onClick={findOverlaps}
              disabled={selectedCases.length < 2 || loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all ${
                selectedCases.length >= 2 && !loading 
                  ? 'bg-[#3ecf8e] text-black hover:bg-[#32ad75]' 
                  : 'bg-[#2e2e2e] text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><Search className="w-4 h-4" /> Run Cross-Match</>
              )}
            </button>
          </div>
        </div>

        <div className="w-2/3 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between bg-[#1a1a1a]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#3ecf8e]" /> Correlation Results
            </h3>
            {overlaps.length > 0 && (
              <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-[#3ecf8e]/20 text-[#3ecf8e]">
                {overlaps.length} Matches
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                 <div className="w-8 h-8 border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : overlaps.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                <Search className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm font-semibold">N/A</p>
                <p className="text-xs max-w-xs text-center leading-relaxed">
                  Select at least two cases and run the cross-match to view overlaps. If no overlaps exist, they will not be shown.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {overlaps.map((overlap, idx) => (
                  <div key={idx} className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${overlap.type === 'B-Party' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {overlap.type === 'B-Party' ? <Users className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-mono uppercase">{overlap.type}</p>
                          <h4 className="text-base font-semibold text-gray-200 mt-0.5">{overlap.value}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#2e2e2e] text-gray-300">
                          {overlap.count} Cases
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-[#2e2e2e]">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Involved In:</p>
                      <div className="flex flex-wrap gap-2">
                        {overlap.involvedCases.map((c, i) => (
                          <span key={i} className="text-[11px] bg-[#1a1a1a] text-gray-300 border border-[#2e2e2e] px-2 py-1 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
