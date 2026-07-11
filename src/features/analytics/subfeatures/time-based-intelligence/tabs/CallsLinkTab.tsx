import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Network } from 'vis-network';
import { jsPDF } from 'jspdf';
import { type CDRRecord } from '../../../../../utils/db';

interface CallsLinkTabProps {
  records: CDRRecord[];
}

export const CallsLinkTab: React.FC<CallsLinkTabProps> = ({ records }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [minFreq, setMinFreq] = useState(0);
  const [minDuration, setMinDuration] = useState(0);
  const [direction, setDirection] = useState('All directions');
  const [callType, setCallType] = useState('Calls + SMS');
  const [showHighFreq, setShowHighFreq] = useState(false);
  const [showImeiLoc, setShowImeiLoc] = useState(true);
  const [hidePanels, setHidePanels] = useState(false);

  // Interaction States
  const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());
  const [hoverData, setHoverData] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Process data with filters
  const graphData = useMemo(() => {
    const nodesMap = new Map<string, any>();
    const edgesMap = new Map<string, any>();

    records.forEach(r => {
      const a = r.aparty || 'Unknown A';
      const b = r.otherParty || 'Unknown B';
      const isCall = r.usageType === 'MOC' || r.usageType === 'MTC';
      const isSMS = r.usageType === 'SMS_MOC' || r.usageType === 'SMS_MTC';
      const isOutgoing = r.usageType === 'MOC' || r.usageType === 'SMS_MOC';

      // Apply Type filter
      if (callType === 'Calls only' && !isCall) return;
      if (callType === 'SMS only' && !isSMS) return;

      // Apply Direction filter
      if (direction === 'Outgoing' && !isOutgoing) return;
      if (direction === 'Incoming' && isOutgoing) return;

      const edgeId = [a, b].sort().join('-');
      if (!edgesMap.has(edgeId)) {
        edgesMap.set(edgeId, { 
          id: edgeId, from: a, to: b, value: 1, duration: r.duration || 0,
          calls: isCall ? 1 : 0, sms: isSMS ? 1 : 0,
          outgoing: isOutgoing ? 1 : 0, incoming: !isOutgoing ? 1 : 0
        });
      } else {
        const edge = edgesMap.get(edgeId);
        edge.value += 1;
        edge.duration += (r.duration || 0);
        if (isCall) edge.calls += 1;
        if (isSMS) edge.sms += 1;
        if (isOutgoing) edge.outgoing += 1;
        else edge.incoming += 1;
      }
    });

    let validEdges = Array.from(edgesMap.values()).filter(e => 
      e.value >= minFreq && e.duration >= minDuration * 60
    );

    if (showHighFreq && validEdges.length > 0) {
      validEdges.sort((a, b) => b.value - a.value);
      const limit = Math.max(5, Math.floor(validEdges.length * 0.2));
      validEdges = validEdges.slice(0, limit);
    }

    validEdges.forEach(e => {
      [e.from, e.to].forEach(nodeId => {
        if (!nodesMap.has(nodeId)) {
          const nodeRecords = records.filter(r => r.aparty === nodeId || r.otherParty === nodeId);
          const imeis = new Set(nodeRecords.map(r => r.imei).filter(Boolean));
          const locs = new Set(nodeRecords.map(r => r.address).filter(Boolean));
          const durations = nodeRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
          
          nodesMap.set(nodeId, {
            id: nodeId,
            label: nodeId,
            group: nodeId === records[0]?.aparty ? 'target' : 'contact',
            value: 0,
            totalInteractions: nodeRecords.length,
            totalDuration: durations,
            firstContact: new Date(Math.min(...nodeRecords.map(r => r.timestamp))).toLocaleString(),
            lastContact: new Date(Math.max(...nodeRecords.map(r => r.timestamp))).toLocaleString(),
            imeis: Array.from(imeis),
            locations: Array.from(locs)
          });
        }
        nodesMap.get(nodeId).value += e.value;
      });
    });

    hiddenNodes.forEach(id => nodesMap.delete(id));
    const finalEdges = validEdges.filter(e => nodesMap.has(e.from) && nodesMap.has(e.to));

    return {
      nodes: Array.from(nodesMap.values()),
      edges: finalEdges
    };
  }, [records, minFreq, minDuration, direction, callType, showHighFreq, hiddenNodes]);

  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      nodes: {
        shape: 'dot',
        font: { color: '#ffffff', size: 11, strokeWidth: 2, strokeColor: '#121212' },
        scaling: { min: 8, max: 25 },
        shadow: { enabled: true, color: 'rgba(0,0,0,0.4)', size: 8, x: 1, y: 1 }
      },
      edges: {
        color: { color: '#334155', highlight: '#3ecf8e', hover: '#60a5fa' },
        width: 1,
        smooth: { enabled: true, type: 'continuous', roundness: 0.3 },
        hoverWidth: 1.5,
        selectionWidth: 2
      },
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -200,
          centralGravity: 0.015,
          springLength: 200,
          springConstant: 0.04,
          damping: 0.8
        },
        maxVelocity: 50,
        minVelocity: 0.5,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: { iterations: 200, fit: true }
      },
      groups: {
        target: { 
          color: { background: '#fbbf24', border: '#f59e0b', highlight: { background: '#fcd34d', border: '#fbbf24' } },
          size: 35
        },
        contact: { 
          color: { background: '#3b82f6', border: '#2563eb', highlight: { background: '#93c5fd', border: '#3b82f6' } } 
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200
      }
    };

    networkRef.current = new Network(containerRef.current, graphData, options);

    networkRef.current.on('hoverNode', (params) => {
      const node = graphData.nodes.find(n => n.id === params.node);
      if (node) setHoverData({ type: 'node', data: node });
    });

    networkRef.current.on('blurNode', () => {
      const selectedNodes = networkRef.current?.getSelectedNodes() || [];
      if (selectedNodes.length === 0) setHoverData(null);
      else {
        const node = graphData.nodes.find(n => n.id === selectedNodes[0]);
        if (node) setHoverData({ type: 'node', data: node });
      }
    });

    networkRef.current.on('hoverEdge', (params) => {
      const edge = graphData.edges.find(e => e.id === params.edge);
      if (edge) setHoverData({ type: 'edge', data: edge });
    });

    networkRef.current.on('blurEdge', () => {
      const selectedNodes = networkRef.current?.getSelectedNodes() || [];
      if (selectedNodes.length === 0) setHoverData(null);
      else {
        const node = graphData.nodes.find(n => n.id === selectedNodes[0]);
        if (node) setHoverData({ type: 'node', data: node });
      }
    });

    networkRef.current.on('selectNode', (params) => {
      const nodeId = params.nodes[0];
      setSelectedNodeId(nodeId);
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (node) setHoverData({ type: 'node', data: node });
    });

    networkRef.current.on('deselectNode', () => {
      setSelectedNodeId(null);
      setHoverData(null);
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graphData]);

  // Handlers
  const handleHighlight = () => {
    if (!networkRef.current || !searchTerm) return;
    const targetNode = graphData.nodes.find(n => n.id.includes(searchTerm) || n.label.includes(searchTerm));
    if (targetNode) {
      networkRef.current.selectNodes([targetNode.id]);
      networkRef.current.focus(targetNode.id, { scale: 1.5, animation: true });
      setSelectedNodeId(targetNode.id);
      setHoverData({ type: 'node', data: targetNode });
    }
  };

  const handleHide = () => {
    if (selectedNodeId) {
      setHiddenNodes(prev => new Set(prev).add(selectedNodeId));
      setSelectedNodeId(null);
      setHoverData(null);
    }
  };

  const handleRestore = () => setHiddenNodes(new Set());
  
  const handleAutoArrange = () => {
    if (networkRef.current) {
      networkRef.current.stabilize();
      networkRef.current.fit({ animation: true });
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setMinFreq(0);
    setMinDuration(0);
    setDirection('All directions');
    setCallType('Calls + SMS');
    setShowHighFreq(false);
    setHiddenNodes(new Set());
    if (networkRef.current) networkRef.current.fit({ animation: true });
  };

  const exportImage = (format: 'png' | 'jpeg') => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL(`image/${format}`);
    const link = document.createElement('a');
    link.download = `network_graph.${format === 'jpeg' ? 'jpg' : 'png'}`;
    link.href = url;
    link.click();
  };

  const exportPDF = () => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.addImage(url, 'JPEG', 10, 10, 277, 190);
    pdf.save('network_graph.pdf');
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphData, null, 2));
    const link = document.createElement('a');
    link.download = "network_data.json";
    link.href = dataStr;
    link.click();
  };

  const exportCSV = () => {
    const headers = ['From', 'To', 'Interactions', 'Duration (s)', 'Calls', 'SMS', 'Outgoing', 'Incoming'];
    const rows = graphData.edges.map(e => [
      e.from, e.to, e.value, e.duration, e.calls, e.sms, e.outgoing, e.incoming
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement('a');
    link.download = "network_edges.csv";
    link.href = encodeURI(csvContent);
    link.click();
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      
      {/* Top Header */}
      <div className="flex bg-[#121212] border border-[#2e2e2e] rounded-xl overflow-hidden shrink-0">
        <div className="flex-1 p-4">
          <h3 className="text-xs font-bold text-[#3b82f6] uppercase tracking-wider mb-1">Link Intelligence Analysis</h3>
          <h1 className="text-xl font-bold text-white mb-1">Suspect Analysis</h1>
          <p className="text-xs text-gray-500 font-mono">
            {graphData.nodes.length} entities • {graphData.edges.length} relationships • - contacts
          </p>
        </div>
        <div className="flex items-center p-4 gap-2 border-l border-[#2e2e2e]">
          <div className="flex flex-col items-center justify-center bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 min-w-[80px]">
            <span className="text-lg font-bold text-white">1</span>
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
      <div className="flex items-center gap-2 bg-[#121212] border border-[#2e2e2e] rounded-xl p-2 px-4 overflow-x-auto custom-scrollbar shrink-0">
        <input 
          type="text" 
          placeholder="Search number..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white w-48 focus:outline-none focus:border-[#3ecf8e]" 
        />
        <button onClick={handleHighlight} className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Highlight</button>
        <button onClick={handleHide} className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Hide</button>
        <button onClick={handleHide} className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Remove view</button>
        <button onClick={handleRestore} className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Restore</button>
        <button onClick={handleAutoArrange} className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Auto Arrange</button>
        <button onClick={handleReset} className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a]">Reset</button>
        <div className="flex-1"></div>
        <button onClick={() => exportImage('png')} className="px-2 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-[10px] text-gray-400 hover:bg-[#2a2a2a]">PNG</button>
        <button onClick={() => exportImage('jpeg')} className="px-2 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-[10px] text-gray-400 hover:bg-[#2a2a2a]">JPG</button>
        <button onClick={() => exportImage('png')} className="px-2 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-[10px] text-gray-400 hover:bg-[#2a2a2a]">SVG</button>
        <button onClick={exportPDF} className="px-2 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-[10px] text-gray-400 hover:bg-[#2a2a2a]">PDF</button>
        <button onClick={exportJSON} className="px-2 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-[10px] text-gray-400 hover:bg-[#2a2a2a]">JSON</button>
        <button onClick={exportCSV} className="px-2 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-[10px] text-gray-400 hover:bg-[#2a2a2a]">CSV</button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-[#121212] border border-[#2e2e2e] rounded-xl p-3 px-4 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Min freq</span>
          <input 
            type="number" 
            value={minFreq}
            onChange={e => setMinFreq(Number(e.target.value))}
            className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white w-16" 
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Min min</span>
          <input 
            type="number" 
            value={minDuration}
            onChange={e => setMinDuration(Number(e.target.value))}
            className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white w-16" 
          />
        </div>
        <select 
          value={direction}
          onChange={e => setDirection(e.target.value)}
          className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white"
        >
          <option>All directions</option>
          <option>Outgoing</option>
          <option>Incoming</option>
        </select>
        <select 
          value={callType}
          onChange={e => setCallType(e.target.value)}
          className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white"
        >
          <option>Calls + SMS</option>
          <option>Calls only</option>
          <option>SMS only</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showHighFreq}
            onChange={e => setShowHighFreq(e.target.checked)}
            className="rounded bg-[#1e1e1e] border-[#2e2e2e]" 
          /> High frequency
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showImeiLoc}
            onChange={e => setShowImeiLoc(e.target.checked)}
            className="rounded bg-[#1e1e1e] border-[#2e2e2e]" 
          /> IMEI / Locations
        </label>
        <div className="flex-1"></div>
        <button 
          onClick={() => setHidePanels(!hidePanels)}
          className="text-xs text-gray-400 hover:text-white"
        >
          {hidePanels ? 'Show intelligence panels' : 'Hide intelligence panels'}
        </button>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 flex gap-4 min-h-[500px]">
        <div className="flex-1 bg-[#121212] border border-[#2e2e2e] rounded-xl overflow-hidden relative">
          <div ref={containerRef} className="w-full h-full" />
        </div>
        
        {!hidePanels && (
          <div className="w-72 bg-[#121212] border border-[#2e2e2e] rounded-xl p-4 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-[#2e2e2e] pb-2">Hover Intelligence</h3>
            
            {!hoverData ? (
              <p className="text-xs text-gray-500 italic text-center mt-10">Hover nodes or relationship lines for detailed communication metadata.</p>
            ) : hoverData.type === 'node' ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Entity ID</p>
                  <p className="text-sm font-bold text-white font-mono break-all">{hoverData.data.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1a1a1a] p-2 rounded border border-[#2e2e2e]">
                    <p className="text-[10px] text-gray-500 uppercase">Interactions</p>
                    <p className="text-sm font-bold text-blue-400">{hoverData.data.totalInteractions}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-2 rounded border border-[#2e2e2e]">
                    <p className="text-[10px] text-gray-500 uppercase">Duration (m)</p>
                    <p className="text-sm font-bold text-yellow-400">{Math.floor(hoverData.data.totalDuration / 60)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">First Contact</p>
                  <p className="text-xs text-gray-300 font-mono">{hoverData.data.firstContact}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Last Contact</p>
                  <p className="text-xs text-gray-300 font-mono">{hoverData.data.lastContact}</p>
                </div>
                
                {showImeiLoc && hoverData.data.imeis.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Associated IMEIs</p>
                    <div className="flex flex-col gap-1">
                      {hoverData.data.imeis.slice(0, 5).map((imei: string) => (
                        <span key={imei} className="text-xs text-gray-400 font-mono bg-[#1e1e1e] px-2 py-1 rounded truncate">{imei}</span>
                      ))}
                    </div>
                  </div>
                )}

                {showImeiLoc && hoverData.data.locations.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Top Locations</p>
                    <div className="flex flex-col gap-1">
                      {hoverData.data.locations.slice(0, 5).map((loc: string) => (
                        <span key={loc} className="text-xs text-gray-400 font-mono bg-[#1e1e1e] px-2 py-1 rounded truncate" title={loc}>{loc}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Link Between</p>
                  <p className="text-xs font-bold text-white font-mono break-all">{hoverData.data.from}</p>
                  <p className="text-[10px] text-gray-500 my-0.5">and</p>
                  <p className="text-xs font-bold text-white font-mono break-all">{hoverData.data.to}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1a1a1a] p-2 rounded border border-[#2e2e2e]">
                    <p className="text-[10px] text-gray-500 uppercase">Total Freq</p>
                    <p className="text-sm font-bold text-blue-400">{hoverData.data.value}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-2 rounded border border-[#2e2e2e]">
                    <p className="text-[10px] text-gray-500 uppercase">Duration (m)</p>
                    <p className="text-sm font-bold text-yellow-400">{Math.floor(hoverData.data.duration / 60)}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-2 rounded border border-[#2e2e2e]">
                    <p className="text-[10px] text-gray-500 uppercase">Calls</p>
                    <p className="text-sm font-bold text-gray-300">{hoverData.data.calls}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-2 rounded border border-[#2e2e2e]">
                    <p className="text-[10px] text-gray-500 uppercase">SMS</p>
                    <p className="text-sm font-bold text-gray-300">{hoverData.data.sms}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-2 rounded border border-[#2e2e2e]">
                    <p className="text-[10px] text-gray-500 uppercase">Outgoing</p>
                    <p className="text-sm font-bold text-[#3ecf8e]">{hoverData.data.outgoing}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-2 rounded border border-[#2e2e2e]">
                    <p className="text-[10px] text-gray-500 uppercase">Incoming</p>
                    <p className="text-sm font-bold text-red-400">{hoverData.data.incoming}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
