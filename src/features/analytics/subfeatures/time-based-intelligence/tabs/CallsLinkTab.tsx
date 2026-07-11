import React, { useEffect, useRef, useMemo } from 'react';
import { Network } from 'vis-network';
import { type CDRRecord } from '../../../../../utils/db';

interface CallsLinkTabProps {
  records: CDRRecord[];
}

export const CallsLinkTab: React.FC<CallsLinkTabProps> = ({ records }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const graphData = useMemo(() => {
    const nodes = new Map<string, { id: string, label: string, group: string, value: number }>();
    const edges = new Map<string, { from: string, to: string, value: number }>();

    records.forEach(r => {
      const a = r.aparty || 'Unknown A';
      const b = r.otherParty || 'Unknown B';
      
      if (!nodes.has(a)) nodes.set(a, { id: a, label: a, group: 'target', value: 10 });
      else nodes.get(a)!.value += 1;

      if (!nodes.has(b)) nodes.set(b, { id: b, label: b, group: 'contact', value: 5 });
      else nodes.get(b)!.value += 1;

      const edgeId = [a, b].sort().join('-');
      if (!edges.has(edgeId)) edges.set(edgeId, { from: a, to: b, value: 1 });
      else edges.get(edgeId)!.value += 1;
    });

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values())
    };
  }, [records]);

  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      nodes: {
        shape: 'dot',
        font: { color: '#ffffff', size: 12 },
        scaling: { min: 10, max: 30 }
      },
      edges: {
        color: { color: '#4b5563', highlight: '#3ecf8e' },
        width: 1,
        smooth: { enabled: true, type: 'continuous', roundness: 0.5 }
      },
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08
        },
        maxVelocity: 50,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: { iterations: 150 }
      },
      groups: {
        target: { color: { background: '#facc15', border: '#eab308' } },
        contact: { color: { background: '#3b82f6', border: '#2563eb' } }
      }
    };

    networkRef.current = new Network(containerRef.current, graphData, options);

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graphData]);

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      
      {/* Top Header */}
      <div className="flex bg-[#121212] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="flex-1 p-4">
          <h3 className="text-xs font-bold text-[#3b82f6] uppercase tracking-wider mb-1">Link Intelligence Analysis</h3>
          <h1 className="text-xl font-bold text-white mb-1">Suspect Analysis</h1>
          <p className="text-xs text-gray-500 font-mono">
            {graphData.nodes.length} entities • {graphData.edges.length} relationships • - contacts
          </p>
        </div>
        <div className="flex items-center p-4 gap-2 border-l border-[#2e2e2e]">
          <div className="flex flex-col items-center justify-center bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 min-w-[80px]">
            <span className="text-lg font-bold text-white">0</span>
            <span className="text-[10px] text-gray-400 uppercase">Clusters</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 min-w-[80px]">
            <span className="text-lg font-bold text-white">{graphData.nodes.length}</span>
            <span className="text-[10px] text-gray-400 uppercase">Nodes</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 min-w-[80px]">
            <span className="text-lg font-bold text-white">{graphData.edges.length}</span>
            <span className="text-[10px] text-gray-400 uppercase">Links</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-[#121212] border border-[#2e2e2e] rounded-xl p-2 px-4 overflow-x-auto custom-scrollbar">
        <input type="text" placeholder="Search number..." className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white w-48 focus:outline-none focus:border-[#3ecf8e]" />
        <button className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Highlight</button>
        <button className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Hide</button>
        <button className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Remove view</button>
        <button className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Restore</button>
        <button className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Auto Arrange</button>
        <button className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Reset</button>
        <div className="flex-1"></div>
        {['PNG', 'JPG', 'SVG', 'PDF', 'JSON', 'CSV'].map(ext => (
          <button key={ext} className="px-2 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-[10px] text-gray-400 hover:bg-[#2a2a2a]">{ext}</button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-[#121212] border border-[#2e2e2e] rounded-xl p-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Min freq</span>
          <input type="number" defaultValue="0" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white w-16" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Min min</span>
          <input type="number" defaultValue="0" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white w-16" />
        </div>
        <select className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white">
          <option>All directions</option>
        </select>
        <select className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white">
          <option>Calls + SMS</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" className="rounded bg-[#1e1e1e] border-[#2e2e2e]" /> High frequency
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" defaultChecked className="rounded bg-[#1e1e1e] border-[#2e2e2e]" /> IMEI / Locations
        </label>
        <div className="flex-1"></div>
        <button className="text-xs text-gray-400 hover:text-white">Hide intelligence panels</button>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 flex gap-4 min-h-[500px]">
        <div className="flex-1 bg-[#121212] border border-[#2e2e2e] rounded-xl overflow-hidden relative">
          <div ref={containerRef} className="w-full h-full" />
        </div>
        <div className="w-64 bg-[#121212] border border-[#2e2e2e] rounded-xl p-4 flex flex-col">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hover Intelligence</h3>
          <p className="text-xs text-gray-400">Hover nodes or relationship lines for detailed communication metadata.</p>
        </div>
      </div>
    </div>
  );
};
