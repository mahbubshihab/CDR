import React, { useState, useRef, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { NetworkGraph, type NetworkGraphRef } from './components/NetworkGraph';
import { NodeIntelligencePanel } from './components/NodeIntelligencePanel';
import { ClusterDetection } from './components/ClusterDetection';
import { CommunicationChain } from './components/CommunicationChain';
import { RelationshipStrength } from './components/RelationshipStrength';
import { useLinkAnalysis } from './hooks/useLinkAnalysis';
import { 
  Search, Highlighter, EyeOff, Trash2, Eye, Layers, RotateCcw, 
  ZoomIn, ZoomOut, Maximize, Filter, Download
} from 'lucide-react';

interface LinkAnalysisProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const LinkAnalysis: React.FC<LinkAnalysisProps> = ({ cdrFile, records }) => {
  const graphRef = useRef<NetworkGraphRef>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    nodeId: string;
    visible: boolean;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [minFreq, setMinFreq] = useState(0);
  const [minDuration, setMinDuration] = useState(0);
  const [direction, setDirection] = useState('All directions');
  const [commType, setCommType] = useState('Calls + SMS');
  const [showPanels, setShowPanels] = useState(true);
  const [highFreq, setHighFreq] = useState(false);
  const [showClusters, setShowClusters] = useState(true);

  // Hidden, removed, and highlighted node states
  const [hiddenNodeIds, setHiddenNodeIds] = useState<Set<string>>(new Set());
  const [removedNodeIds, setRemovedNodeIds] = useState<Set<string>>(new Set());
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());

  const {
    nodes: rawNodes,
    edges: rawEdges,
    nodeIntelligence,
    sharedImeis,
    commonLocations,
    chains,
    rankings
  } = useLinkAnalysis(cdrFile?.phoneNumber || '', records, { 
    searchQuery: '', // Skip search filter in hook to handle highlight/hide on top dynamically
    minFreq, 
    minDuration, 
    direction, 
    commType,
    highFreq
  });

  const activeNode = selectedNodeId ? nodeIntelligence[selectedNodeId] || null : null;

  // Declarative filtering and styling of nodes (memoized)
  const nodes = useMemo(() => {
    const hasHighlights = highlightedNodeIds.size > 0;
    return rawNodes.map(n => {
      const isHighlighted = highlightedNodeIds.has(n.id);
      if (n.group === 'target') return n;
      
      return {
        ...n,
        color: isHighlighted 
          ? { background: '#1d4ed8', border: '#60a5fa' } 
          : (hasHighlights 
              ? { background: '#111111', border: '#333333', font: { color: '#666666' } } 
              : undefined)
      };
    }).filter(n => !hiddenNodeIds.has(n.id) && !removedNodeIds.has(n.id));
  }, [rawNodes, highlightedNodeIds, hiddenNodeIds, removedNodeIds]);

  // Filter edges where either endpoint is hidden or removed (memoized)
  const edges = useMemo(() => {
    return rawEdges.filter(e => 
      !hiddenNodeIds.has(e.from) && !hiddenNodeIds.has(e.to) &&
      !removedNodeIds.has(e.from) && !removedNodeIds.has(e.to)
    );
  }, [rawEdges, hiddenNodeIds, removedNodeIds]);

  // Toolbar Actions
  const handleHighlight = () => {
    if (!searchQuery) {
      setHighlightedNodeIds(new Set());
      return;
    }
    const matching = new Set<string>();
    Object.values(nodeIntelligence).forEach(node => {
      if (node.number.toLowerCase().includes(searchQuery.toLowerCase())) {
        matching.add(node.number);
      }
    });
    setHighlightedNodeIds(matching);
  };

  const handleHide = () => {
    if (!searchQuery) return;
    const newHidden = new Set(hiddenNodeIds);
    Object.values(nodeIntelligence).forEach(node => {
      if (node.number.toLowerCase().includes(searchQuery.toLowerCase())) {
        newHidden.add(node.number);
      }
    });
    setHiddenNodeIds(newHidden);
  };

  const handleRemoveView = () => {
    if (selectedNodeId) {
      const newRemoved = new Set(removedNodeIds);
      newRemoved.add(selectedNodeId);
      setRemovedNodeIds(newRemoved);
      setSelectedNodeId(null);
    }
  };

  const handleRestore = () => {
    setHiddenNodeIds(new Set());
    setRemovedNodeIds(new Set());
    setHighlightedNodeIds(new Set());
  };

  const handleReset = () => {
    setSearchQuery('');
    setMinFreq(0);
    setMinDuration(0);
    setDirection('All directions');
    setCommType('Calls + SMS');
    setHighFreq(false);
    setShowClusters(true);
    setHiddenNodeIds(new Set());
    setRemovedNodeIds(new Set());
    setHighlightedNodeIds(new Set());
    setSelectedNodeId(null);
    setTimeout(() => {
      graphRef.current?.fitToScreen();
    }, 50);
  };

  // Export handlers
  const handleExportImage = (format: 'png' | 'jpeg') => {
    const dataUrl = graphRef.current?.exportImage(format);
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `link-analysis-${cdrFile?.phoneNumber || 'export'}.${format === 'png' ? 'png' : 'jpg'}`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleExportPDF = async () => {
    const dataUrl = graphRef.current?.exportImage('png');
    if (dataUrl) {
      try {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF('landscape', 'px', [800, 600]);
        pdf.addImage(dataUrl, 'PNG', 0, 0, 800, 600);
        pdf.save(`link-analysis-${cdrFile?.phoneNumber || 'export'}.pdf`);
      } catch (e) {
        console.error("PDF export failed", e);
      }
    }
  };

  const handleExportJSON = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `link-analysis-${cdrFile?.phoneNumber || 'export'}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    let csv = 'Source,Target,Type,Comm Count\n';
    edges.forEach(e => {
      csv += `"${e.from}","${e.to}","${e.type}","${e.commCount}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `link-analysis-${cdrFile?.phoneNumber || 'export'}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#0a0a0a] custom-scrollbar text-left flex flex-col font-sans animate-in fade-in duration-300">
      
      {/* Top section: Header & Toolbars */}
      <div className="flex flex-col border-b border-[#2e2e2e] p-4 bg-[#0a0a0a]">
        
        {/* Header Stats */}
        <div className="flex justify-between items-start mb-6 border border-[#2e2e2e] rounded-lg p-4 bg-[#121212]">
          <div>
            <div className="text-[#38bdf8] text-xs font-bold uppercase tracking-wider mb-2">
              {activeNode ? 'SELECTED NODE INTELLIGENCE' : 'LINK INTELLIGENCE ANALYSIS'}
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {activeNode ? activeNode.number : (cdrFile?.phoneNumber || 'Unknown')}
            </div>
            <div className="text-gray-400 text-sm">
              {activeNode ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono">
                  <span>Type: <strong className="text-[#38bdf8]">{activeNode.type}</strong></span>
                  <span>Country: <strong className="text-white">{activeNode.country}</strong></span>
                  <span>Total Comm: <strong className="text-white">{activeNode.totalComm}</strong></span>
                  <span>Duration: <strong className="text-white">{activeNode.totalDuration} min</strong></span>
                  <span>First: <strong className="text-white">{activeNode.firstContact}</strong></span>
                  <span>Last: <strong className="text-white">{activeNode.lastContact}</strong></span>
                </div>
              ) : (
                `${Object.keys(nodeIntelligence).length} entities • ${edges.length} relationships • ${Object.keys(nodeIntelligence).length + edges.length} contacts`
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="bg-[#0a0a0a] border border-[#2e2e2e] rounded flex flex-col items-center justify-center p-2 w-20">
              <span className="text-white font-bold">{sharedImeis.length + commonLocations.length}</span>
              <span className="text-xs text-gray-500">Clusters</span>
            </div>
            <div className="bg-[#0a0a0a] border border-[#2e2e2e] rounded flex flex-col items-center justify-center p-2 w-20">
              <span className="text-white font-bold">{nodes.filter(n => n.group !== 'target').length}</span>
              <span className="text-xs text-gray-500">Nodes</span>
            </div>
            <div className="bg-[#0a0a0a] border border-[#2e2e2e] rounded flex flex-col items-center justify-center p-2 w-20">
              <span className="text-white font-bold">{edges.length}</span>
              <span className="text-xs text-gray-500">Links</span>
            </div>
          </div>
        </div>

        {/* Toolbar 1 */}
        <div className="flex flex-wrap items-center gap-4 mb-4 border border-[#2e2e2e] rounded-lg p-2 bg-[#121212]">
          <div className="relative flex-grow max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2e2e2e] text-white text-sm rounded-md pl-9 pr-3 py-1.5 focus:outline-none focus:border-[#38bdf8]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleHighlight}
              className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-3 py-1.5 rounded-md text-xs transition-colors"
            >
              <Highlighter size={14} /> Highlight
            </button>
            <button 
              onClick={handleHide}
              className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-3 py-1.5 rounded-md text-xs transition-colors"
            >
              <EyeOff size={14} /> Hide
            </button>
            <button 
              onClick={handleRemoveView}
              disabled={!selectedNodeId}
              className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-3 py-1.5 rounded-md text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 size={14} /> Remove view
            </button>
            <button 
              onClick={handleRestore}
              className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-3 py-1.5 rounded-md text-xs transition-colors"
            >
              <Eye size={14} /> Restore
            </button>
            <button 
              onClick={() => graphRef.current?.fitToScreen()}
              className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-3 py-1.5 rounded-md text-xs transition-colors"
            >
              <Layers size={14} /> Auto Arrange
            </button>
            <button 
              onClick={handleReset}
              className="flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-3 py-1.5 rounded-md text-xs transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <div className="flex-grow"></div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => graphRef.current?.zoomIn()}
              className="bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 p-1.5 rounded-md text-xs transition-colors"
            >
              <ZoomIn size={14} />
            </button>
            <button 
              onClick={() => graphRef.current?.zoomOut()}
              className="bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 p-1.5 rounded-md text-xs transition-colors"
            >
              <ZoomOut size={14} />
            </button>
            <button 
              onClick={() => graphRef.current?.fitToScreen()}
              className="bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 p-1.5 rounded-md text-xs transition-colors"
            >
              <Maximize size={14} />
            </button>
            <div className="w-px h-6 bg-[#2e2e2e] mx-1"></div>
            <button onClick={() => handleExportImage('png')} className="bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-2 py-1.5 rounded-md text-xs font-mono transition-colors">IMG</button>
            <button onClick={() => handleExportImage('jpeg')} className="bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-2 py-1.5 rounded-md text-xs font-mono transition-colors">JPG</button>
            <button onClick={() => handleExportImage('png')} className="bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-2 py-1.5 rounded-md text-xs font-mono transition-colors">SVG</button>
            <button onClick={handleExportPDF} className="bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-2 py-1.5 rounded-md text-xs font-mono transition-colors">PDF</button>
            <button onClick={handleExportJSON} className="bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-2 py-1.5 rounded-md text-xs font-mono transition-colors">JSON</button>
            <button onClick={handleExportCSV} className="bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] text-gray-300 px-2 py-1.5 rounded-md text-xs font-mono flex items-center gap-1 transition-colors"><Download size={12}/> CSV</button>
          </div>
        </div>

        {/* Toolbar 2 (Filters) */}
        <div className="flex flex-wrap items-center gap-4 border border-[#2e2e2e] rounded-lg p-2 bg-[#121212]">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">Min freq</span>
            <input type="number" value={minFreq} onChange={(e) => setMinFreq(Number(e.target.value))} className="w-16 bg-[#0a0a0a] border border-[#2e2e2e] text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#38bdf8]" />
            <span className="text-xs text-gray-400 ml-2">Min min</span>
            <input type="number" value={minDuration} onChange={(e) => setMinDuration(Number(e.target.value))} className="w-16 bg-[#0a0a0a] border border-[#2e2e2e] text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#38bdf8]" />
          </div>

          <div className="w-px h-6 bg-[#2e2e2e] mx-1"></div>

          <select value={direction} onChange={(e) => setDirection(e.target.value)} className="bg-[#0a0a0a] border border-[#2e2e2e] text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-[#38bdf8]">
            <option>All directions</option>
            <option>Incoming</option>
            <option>Outgoing</option>
          </select>

          <select value={commType} onChange={(e) => setCommType(e.target.value)} className="bg-[#0a0a0a] border border-[#2e2e2e] text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-[#38bdf8]">
            <option>Calls + SMS</option>
            <option>Calls Only</option>
            <option>SMS Only</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer ml-4 select-none">
            <input 
              type="checkbox" 
              checked={highFreq}
              onChange={(e) => setHighFreq(e.target.checked)}
              className="accent-[#38bdf8]" 
            />
            <span className="text-xs text-gray-300">High frequency</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer ml-2 select-none">
            <input 
              type="checkbox" 
              checked={showClusters}
              onChange={(e) => setShowClusters(e.target.checked)}
              className="accent-[#38bdf8]" 
            />
            <span className="text-xs text-gray-300">IMEI / Locations</span>
          </label>
          
          <div className="flex-grow"></div>
          
          <button onClick={() => setShowPanels(!showPanels)} className="text-xs text-gray-400 hover:text-white transition-colors">
            {showPanels ? 'Hide intelligence panels' : 'Show intelligence panels'}
          </button>
        </div>

      </div>

      {/* Main Graph Area */}
      <div className="flex w-full min-h-[650px] border-b border-[#2e2e2e]">
        <div className="flex-grow relative bg-[#0a0a0a]">
          <NetworkGraph 
            ref={graphRef}
            nodes={nodes} 
            edges={edges} 
            onNodeHover={setTooltip}
            onNodeSelect={setSelectedNodeId}
          />

          {/* Floating Tooltip Popup (on hover) */}
          {tooltip && tooltip.visible && nodeIntelligence[tooltip.nodeId] && (
            <div 
              className="absolute z-20 pointer-events-none bg-[#1e293b]/95 border border-[#3b82f6] rounded-lg p-3 shadow-xl text-white text-[11px] font-mono select-none"
              style={{ 
                left: `${tooltip.x + 15}px`, 
                top: `${tooltip.y - 75}px`
              }}
            >
              <div className="font-bold text-[#38bdf8] border-b border-gray-700 pb-1 mb-1.5">
                Full Number: {nodeIntelligence[tooltip.nodeId].number}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                <div>Type: <span className="text-[#38bdf8]">{nodeIntelligence[tooltip.nodeId].type}</span></div>
                <div>Country: <span className="text-[#38bdf8]">{nodeIntelligence[tooltip.nodeId].country}</span></div>
                <div>Calls: <span className="text-[#38bdf8]">In {nodeIntelligence[tooltip.nodeId].callCountIn} / Out {nodeIntelligence[tooltip.nodeId].callCountOut}</span></div>
                <div>SMS: <span className="text-[#38bdf8]">In {nodeIntelligence[tooltip.nodeId].smsCountIn} / Out {nodeIntelligence[tooltip.nodeId].smsCountOut}</span></div>
                <div>Duration: <span className="text-[#38bdf8]">{nodeIntelligence[tooltip.nodeId].totalDuration} min</span></div>
                <div>Total Comm: <span className="text-[#38bdf8]">{nodeIntelligence[tooltip.nodeId].totalComm}</span></div>
              </div>
              <div className="mt-1 pt-1 border-t border-gray-700 text-[10px] text-gray-400">
                First: {nodeIntelligence[tooltip.nodeId].firstContact}
              </div>
              <div className="text-[10px] text-gray-400">
                Last: {nodeIntelligence[tooltip.nodeId].lastContact}
              </div>
            </div>
          )}
        </div>
        
        {/* Permanent Node Intelligence Panel Sidebar */}
        {showPanels && (
          <div className="w-80 min-w-[320px] bg-[#121212] border-l border-[#2e2e2e] sticky top-4 h-[calc(100vh-220px)] self-start overflow-y-auto custom-scrollbar">
            {activeNode ? (
              <NodeIntelligencePanel node={activeNode} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center text-sm">
                <p className="mb-2">No Node Selected</p>
                <p className="text-xs text-gray-600">Click a node in the circular graph to view full details here and in the header stats.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section: Analytics Modules */}
      {showClusters && (
        <div className="p-6">
          <ClusterDetection 
            sharedImeis={sharedImeis}
            commonLocations={commonLocations}
          />
          
          <CommunicationChain chains={chains} />
          
          <RelationshipStrength rankings={rankings} />
        </div>
      )}

    </div>
  );
};
