import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Network } from 'vis-network';
import type { LinkEdge } from '../types';

export interface NetworkGraphRef {
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  exportImage: (format: 'png' | 'jpeg') => string | undefined;
}

interface NetworkGraphProps {
  nodes: any[];
  edges: LinkEdge[];
  onNodeHover: (tooltip: { x: number; y: number; nodeId: string; visible: boolean } | null) => void;
  onNodeSelect: (nodeId: string | null) => void;
}

export const NetworkGraph = forwardRef<NetworkGraphRef, NetworkGraphProps>(
  ({ nodes, edges, onNodeHover, onNodeSelect }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);

    const onNodeHoverRef = useRef(onNodeHover);
    const onNodeSelectRef = useRef(onNodeSelect);

    useEffect(() => {
      onNodeHoverRef.current = onNodeHover;
      onNodeSelectRef.current = onNodeSelect;
    }, [onNodeHover, onNodeSelect]);

    // Expose ref methods at the TOP LEVEL (rules of React Hooks)
    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (networkRef.current) {
          const scale = networkRef.current.getScale();
          networkRef.current.moveTo({ scale: scale * 1.2, animation: true });
        }
      },
      zoomOut: () => {
        if (networkRef.current) {
          const scale = networkRef.current.getScale();
          networkRef.current.moveTo({ scale: scale * 0.8, animation: true });
        }
      },
      fitToScreen: () => {
        networkRef.current?.fit({ animation: true });
      },
      exportImage: (format: 'png' | 'jpeg') => {
        if (!containerRef.current) return;
        const canvas = containerRef.current.getElementsByTagName('canvas')[0];
        if (canvas) {
          return canvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`);
        }
      }
    }));

    // 1. Initialize Network ONCE
    useEffect(() => {
      if (!containerRef.current) return;

      const data = {
        nodes: [],
        edges: []
      };

      const options = {
        autoResize: true,
        layout: {
          improvedLayout: false
        },
        physics: false,
        interaction: {
          hover: true,
          hoverConnectedEdges: true,
          selectConnectedEdges: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true
        },
        edges: {
          arrows: {
            to: { enabled: false }
          }
        }
      };

      const network = new Network(containerRef.current, data, options);
      networkRef.current = network;

      // Fit to screen on first draw
      network.once('afterDrawing', () => {
        network.fit({
          animation: {
            duration: 600,
            easingFunction: 'easeInOutQuad'
          }
        });
      });

      // Events
      network.on('hoverNode', (params: any) => {
        const nodeId = params.node;
        const nodePos = network.getPosition(nodeId);
        if (nodePos && containerRef.current) {
          const domPos = network.canvasToDOM(nodePos);
          if (domPos) {
            onNodeHoverRef.current({
              nodeId: String(nodeId),
              x: domPos.x,
              y: domPos.y,
              visible: true
            });
          }
        }
      });

      network.on('blurNode', () => {
        onNodeHoverRef.current(null);
      });

      network.on('selectNode', (params: any) => {
        if (params.nodes.length > 0) {
          onNodeSelectRef.current(String(params.nodes[0]));
        }
      });

      network.on('deselectNode', () => {
        onNodeSelectRef.current(null);
      });

      return () => {
        if (networkRef.current) {
          networkRef.current.destroy();
          networkRef.current = null;
        }
      };
    }, []);

    // 2. Update Data dynamically when nodes or edges props change
    useEffect(() => {
      if (!networkRef.current) return;

      const otherNodes = nodes.filter(n => n.group !== 'target');
      const N = otherNodes.length;
      const radius = Math.max(180, N * 7); 
      const angleStep = N > 0 ? (2 * Math.PI) / N : 0;
      
      const targetX = 0;
      const targetY = 0;

      const formattedNodes = nodes.map((n) => {
        const isTarget = n.group === 'target';
        
        let x = targetX;
        let y = targetY;
        
        if (!isTarget) {
          const index = otherNodes.indexOf(n);
          const angle = index * angleStep;
          x = radius * Math.cos(angle);
          y = radius * Math.sin(angle);
        }

        let finalLabel = n.label;
        if (isTarget) {
          finalLabel = `★★ ${n.label}\n${otherNodes.length} entities • ${edges.length} links`;
        }

        return {
          id: n.id,
          label: finalLabel,
          shape: 'box',
          x: x,
          y: y,
          color: {
            background: isTarget ? '#1e3a8a' : (n.color?.background || '#000000'),
            border: isTarget ? '#3b82f6' : (n.color?.border || '#ef4444'),
            highlight: {
              background: '#1e293b',
              border: '#38bdf8'
            },
            hover: {
              background: '#1e293b',
              border: '#38bdf8'
            }
          },
          font: {
            color: n.color?.font?.color || '#ffffff',
            face: 'Inter, sans-serif',
            size: isTarget ? 14 : 11,
            multi: 'html'
          },
          borderWidth: 1.5,
          borderWidthSelected: 2,
          shadow: isTarget ? { enabled: true, color: 'rgba(59, 130, 246, 0.5)', size: 10, x: 0, y: 0 } : false,
          shapeProperties: {
            borderRadius: 4
          },
          margin: { top: 6, right: 10, bottom: 6, left: 10 }
        };
      });

      const formattedEdges = edges.map(e => {
        let color = '#3ecf8e'; // incoming
        if (e.type === 'outgoing') color = '#3b82f6';
        else if (e.type === 'balanced') color = '#f59e0b';
        else if (e.type === 'high_frequency') color = '#ef4444';

        return {
          id: e.id,
          from: e.from,
          to: e.to,
          label: e.label,
          color: {
            color: color,
            highlight: '#38bdf8',
            hover: '#38bdf8'
          },
          font: {
            color: '#94a3b8',
            size: 10,
            face: 'monospace',
            background: '#121212'
          },
          width: Math.min(Math.max(e.commCount / 10, 1), 5),
          selectionWidth: 2,
          hoverWidth: 1.5,
          smooth: false
        };
      });

      const uniqueNodes = Array.from(new Map(formattedNodes.map(item => [item.id, item])).values());
      const uniqueEdges = Array.from(new Map(formattedEdges.map(item => [item.id, item])).values());

      // Save current selection to restore it after setData
      const selectedNodes = networkRef.current.getSelectedNodes();

      // Directly update the Network instance with the new arrays
      networkRef.current.setData({ 
        nodes: uniqueNodes, 
        edges: uniqueEdges 
      });

      // Restore selection if nodes still exist
      const validSelection = selectedNodes.filter(id => uniqueNodes.some(n => n.id === id));
      if (validSelection.length > 0) {
        networkRef.current.selectNodes(validSelection);
      }

      // Auto-fit network view after updating data
      networkRef.current.fit({ animation: false });
    }, [nodes, edges]);

    return (
      <div className="w-full h-[650px] relative">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] font-mono text-gray-400 bg-[#121212]/80 p-2 rounded-lg border border-[#2e2e2e]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#3ecf8e]"></span> Incoming
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> Outgoing
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Balanced
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> High frequency
          </div>
        </div>
      </div>
    );
  }
);

NetworkGraph.displayName = 'NetworkGraph';
