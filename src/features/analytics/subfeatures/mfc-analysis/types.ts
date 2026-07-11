export interface BPartyStats {
  bNumber: string;
  type: string;
  operator: string;
  country: string;
  
  inCalls: number;
  outCalls: number;
  inSms: number;
  outSms: number;
  totalActivities: number;
  
  totalDurationSeconds: number;
  longestDurationSeconds: number;
  shortestDurationSeconds: number;
  
  firstDate: string;
  firstTime: string;
  lastDate: string;
  lastTime: string;
  
  firstTimestamp: number; // For sorting
  lastTimestamp: number; // For sorting
  
  activeDays: number;
  uniqueDays: Set<string>;
  
  locations: number;
  uniqueLocations: Set<string>;
  
  imeis: number;
  uniqueImeis: Set<string>;
  
  hourlyActivity: number[]; // Array of length 24
  
  freqScore: number;
}
