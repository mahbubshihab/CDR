export interface LinkNodeIntelligence {
  number: string;
  type: string; // e.g. "suspicious", "regular"
  country: string;
  callCountIn: number;
  callCountOut: number;
  smsCountIn: number;
  smsCountOut: number;
  totalDuration: number;
  totalComm: number;
  firstContact: string;
  lastContact: string;
}

export interface LinkEdge {
  id: string;
  from: string;
  to: string;
  type: 'incoming' | 'outgoing' | 'balanced' | 'high_frequency';
  label: string; // e.g., "65 comm - 10129m"
  commCount: number;
}

export interface SharedContactCluster {
  imei: string;
  numbers: string[];
}

export interface LocationCluster {
  location: string;
  count: number;
}

export interface CommunicationChain {
  aParty: string;
  bParty: string;
  via: string;
  combinedComm: number;
}

export interface RelationshipStrength {
  rank: number;
  number: string;
  commCount: number;
  percentage: number;
}
