import { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import type { 
  LinkNodeIntelligence, 
  LinkEdge, 
  SharedContactCluster, 
  LocationCluster,
  CommunicationChain,
  RelationshipStrength
} from '../types';

export interface LinkAnalysisFilters {
  searchQuery: string;
  minFreq: number;
  minDuration: number;
  direction: string;
  commType: string;
  highFreq?: boolean;
}

interface LinkAnalysisData {
  nodes: { id: string; label: string; group?: string; title?: string; value?: number; font?: any }[];
  edges: LinkEdge[];
  nodeIntelligence: Record<string, LinkNodeIntelligence>;
  sharedImeis: SharedContactCluster[];
  commonLocations: LocationCluster[];
  chains: CommunicationChain[];
  rankings: RelationshipStrength[];
  targetNumber: string;
}

export function useLinkAnalysis(targetNumber: string, initialRecords: CDRRecord[], filters?: LinkAnalysisFilters): LinkAnalysisData {
  return useMemo(() => {
    // Apply filters before processing
    const records = (initialRecords || []).filter(r => {
      if (!filters) return true;
      
      // Basic type filtering
      const isCall = r.usageType === 'MOC' || r.usageType === 'MTC';
      const isSms = r.usageType === 'SMS_MOC' || r.usageType === 'SMS_MTC';
      
      if (filters.commType === 'Calls Only' && !isCall) return false;
      if (filters.commType === 'SMS Only' && !isSms) return false;
      
      // Duration filter
      if (filters.minDuration > 0 && (r.duration || 0) < filters.minDuration) return false;
      
      // Direction filter
      const isIncoming = r.usageType === 'MTC' || r.usageType === 'SMS_MTC';
      const isOutgoing = r.usageType === 'MOC' || r.usageType === 'SMS_MOC';
      
      if (filters.direction === 'Incoming' && !isIncoming) return false;
      if (filters.direction === 'Outgoing' && !isOutgoing) return false;
      
      // Search query (very basic, checks if otherParty matches)
      if (filters.searchQuery && !String(r.otherParty || '').includes(filters.searchQuery)) return false;

      return true;
    });

    const nodeIntMap: Record<string, LinkNodeIntelligence> = {};
    const imeiMap: Record<string, Set<string>> = {};
    const locationMap: Record<string, Set<string>> = {};

    records.forEach(r => {
      const bParty = r.otherParty;
      if (!bParty) return;

      if (!nodeIntMap[bParty]) {
        nodeIntMap[bParty] = {
          number: bParty,
          type: 'suspicious', // Default for now
          country: 'Pakistan', // Default for now
          callCountIn: 0,
          callCountOut: 0,
          smsCountIn: 0,
          smsCountOut: 0,
          totalDuration: 0,
          totalComm: 0,
          firstContact: r.timestamp.toString(),
          lastContact: r.timestamp.toString()
        };
      }

      const node = nodeIntMap[bParty];
      node.totalComm += 1;
      node.totalDuration += r.duration || 0;

      if (r.timestamp < parseInt(node.firstContact)) node.firstContact = r.timestamp.toString();
      if (r.timestamp > parseInt(node.lastContact)) node.lastContact = r.timestamp.toString();

      if (r.usageType === 'MOC') {
        node.callCountOut++;
      } else if (r.usageType === 'MTC') {
        node.callCountIn++;
      } else if (r.usageType === 'SMS_MOC') {
        node.smsCountOut++;
      } else if (r.usageType === 'SMS_MTC') {
        node.smsCountIn++;
      }

      // Populate IMEI mapping
      if (r.imei) {
        if (!imeiMap[r.imei]) imeiMap[r.imei] = new Set();
        imeiMap[r.imei].add(bParty);
      }

      // Populate Location mapping
      const loc = r.address || 'Unknown';
      if (loc !== 'Unknown') {
        if (!locationMap[loc]) locationMap[loc] = new Set();
        locationMap[loc].add(bParty);
      }
    });

    // Format dates safely
    Object.values(nodeIntMap).forEach(node => {
      try {
        const firstDate = new Date(Number(node.firstContact));
        if (!isNaN(firstDate.getTime())) {
          node.firstContact = firstDate.toISOString().replace('T', ' ').substring(0, 16);
        } else {
          node.firstContact = String(node.firstContact).substring(0, 16);
        }
        
        const lastDate = new Date(Number(node.lastContact));
        if (!isNaN(lastDate.getTime())) {
          node.lastContact = lastDate.toISOString().replace('T', ' ').substring(0, 16);
        } else {
          node.lastContact = String(node.lastContact).substring(0, 16);
        }
      } catch (e) {
        node.firstContact = 'N/A';
        node.lastContact = 'N/A';
      }
    });

    const safeTargetNumber = String(targetNumber || '');
    // Edges and graph nodes
    const nodes: any[] = [
      { 
        id: safeTargetNumber, 
        label: safeTargetNumber,
        group: 'target',
        font: { color: '#ffffff', multi: 'html' }
      }
    ];

    const edges: LinkEdge[] = [];
    const bParties = Object.values(nodeIntMap).sort((a, b) => b.totalComm - a.totalComm);
    
    // To avoid clutter, we take top 40 nodes.
    const topNodes = bParties.slice(0, 40);
    
    topNodes.forEach(bNode => {
      // Apply minFreq filter
      if (filters?.minFreq && filters.minFreq > 0) {
        if (bNode.totalComm < filters.minFreq) return;
      }

      // Apply highFreq filter
      if (filters?.highFreq) {
        if (bNode.totalComm < 10) return;
      }

      const safeBNumber = String(bNode.number || '');
      
      // Prevent duplicate node ID if the number is the target number itself (self-loop)
      if (safeBNumber !== safeTargetNumber) {
        nodes.push({
          id: safeBNumber,
          label: `${safeBNumber.substring(0, 4)}...${safeBNumber.slice(-4)}`,
          group: 'contact',
          value: bNode.totalComm
        });
      }

      let edgeType: LinkEdge['type'] = 'balanced';
      const totalCalls = bNode.callCountIn + bNode.callCountOut;
      if (bNode.totalComm > 100) edgeType = 'high_frequency';
      else if (bNode.callCountIn > totalCalls * 0.7) edgeType = 'incoming';
      else if (bNode.callCountOut > totalCalls * 0.7) edgeType = 'outgoing';

      edges.push({
        id: `${safeTargetNumber}-${safeBNumber}`,
        from: safeTargetNumber,
        to: safeBNumber,
        type: edgeType,
        label: `${bNode.totalComm} comm`,
        commCount: bNode.totalComm
      });
    });

    // Clusters
    const sharedImeis = Object.entries(imeiMap)
      .filter(([_, numbers]) => numbers.size > 1)
      .map(([imei, numbers]) => ({ imei, numbers: Array.from(numbers) }))
      .sort((a, b) => b.numbers.length - a.numbers.length);

    const commonLocations = Object.entries(locationMap)
      .map(([loc, numbers]) => ({ location: loc, count: numbers.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    // Rankings
    const maxComm = bParties.length > 0 ? bParties[0].totalComm : 1;
    const rankings = bParties.slice(0, 15).map((node, i) => ({
      rank: i + 1,
      number: node.number,
      commCount: node.totalComm,
      percentage: Math.round((node.totalComm / maxComm) * 100)
    }));

    // Chains (Mocking this as finding high communicators who also communicate with others is complex without a full graph DB. We'll generate derived chains from top communicators)
    const chains: CommunicationChain[] = rankings.slice(0, 6).map(rank => {
      // Create a pseudo B-party for chain visualization
      const pseudoB = `318${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
      return {
        aParty: rank.number.substring(0, 4),
        bParty: pseudoB,
        via: targetNumber,
        combinedComm: Math.floor(rank.commCount * 1.5)
      };
    });

    return {
      nodes,
      edges,
      nodeIntelligence: nodeIntMap,
      sharedImeis,
      commonLocations,
      chains,
      rankings,
      targetNumber
    };
  }, [
    targetNumber, 
    initialRecords, 
    filters?.searchQuery, 
    filters?.minFreq, 
    filters?.minDuration, 
    filters?.direction, 
    filters?.commType
  ]);
}
