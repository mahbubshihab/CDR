export interface NetworkRecord {
  number: string;
  operator: string;
  party: string;
}

export interface NetworkStats {
  totalUnique: number;
  operatorCounts: { [key: string]: number };
  operatorPercentages: { [key: string]: string };
}
