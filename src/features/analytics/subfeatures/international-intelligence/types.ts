import type { CDRRecord } from '../../../../utils/db';

export interface InternationalRecord {
  number: string;
  country: string;
  flag: string;
  code: string;
  voiceCount: number;
  smsCount: number;
  totalComms: number;
  duration: number;
  activeDays: Set<string>;
  dayComms: number;
  nightComms: number;
  dayDuration: number;
  nightDuration: number;
}

export interface CountryAggregate {
  country: string;
  flag: string;
  code: string;
  numbers: string[];
  voiceCount: number;
  smsCount: number;
  totalComms: number;
  activeDays: number; // total unique active days across all numbers in this country
  allActiveDays: Set<string>;
  dayComms: number;
  nightComms: number;
  dayDuration: number;
  nightDuration: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const isInternationalNumber = (num: string) => {
  if (!num) return false;
  let normalized = num.replace(/\+/g, '');
  if (normalized.startsWith('00')) normalized = normalized.substring(2);
  
  // Local BD numbers start with 8801 or 01 and have specific lengths (13 or 11)
  // For safety, let's just say if it starts with 8801 or 01, it's local.
  if (normalized.startsWith('8801') || normalized.startsWith('01')) {
    return false;
  }
  return true;
};

export const getCountryInfo = (num: string) => {
  let normalized = num.replace(/\+/g, '');
  if (normalized.startsWith('00')) normalized = normalized.substring(2);

  if (normalized.startsWith('92')) return { name: 'Pakistan', flag: '🇵🇰', code: 'PK' };
  if (normalized.startsWith('91')) return { name: 'India', flag: '🇮🇳', code: 'IN' };
  if (normalized.startsWith('44')) return { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' };
  if (normalized.startsWith('971')) return { name: 'United Arab Emirates', flag: '🇦🇪', code: 'AE' };
  if (normalized.startsWith('966')) return { name: 'Saudi Arabia', flag: '🇸🇦', code: 'SA' };
  if (normalized.startsWith('973')) return { name: 'Bahrain', flag: '🇧🇭', code: 'BH' };
  if (normalized.startsWith('965')) return { name: 'Kuwait', flag: '🇰🇼', code: 'KW' };
  if (normalized.startsWith('93')) return { name: 'Afghanistan', flag: '🇦🇫', code: 'AF' };
  if (normalized.startsWith('49')) return { name: 'Germany', flag: '🇩🇪', code: 'DE' };
  if (normalized.startsWith('1')) return { name: 'USA/Canada', flag: '🇺🇸', code: 'US' };
  
  // Some other common prefixes just in case
  if (normalized.startsWith('65')) return { name: 'Singapore', flag: '🇸🇬', code: 'SG' };
  if (normalized.startsWith('60')) return { name: 'Malaysia', flag: '🇲🇾', code: 'MY' };
  
  return { name: 'Unknown', flag: '🌐', code: 'UN' };
};

export const determineRiskLevel = (comms: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (comms > 20) return 'HIGH';
  if (comms >= 5) return 'MEDIUM';
  return 'LOW';
};

export const processInternationalData = (records: CDRRecord[]) => {
  const intlMap = new Map<string, InternationalRecord>();

  records.forEach(r => {
    if (!r.otherParty) return;
    if (!isInternationalNumber(r.otherParty)) return;

    const { name, flag, code } = getCountryInfo(r.otherParty);
    const num = r.otherParty;

    if (!intlMap.has(num)) {
      intlMap.set(num, {
        number: num,
        country: name,
        flag,
        code,
        voiceCount: 0,
        smsCount: 0,
        totalComms: 0,
        duration: 0,
        activeDays: new Set<string>(),
        dayComms: 0,
        nightComms: 0,
        dayDuration: 0,
        nightDuration: 0,
      });
    }

    const stat = intlMap.get(num)!;
    stat.totalComms++;
    
    const type = (r.usageType || '').toLowerCase();
    if (type.includes('sms')) {
      stat.smsCount++;
    } else {
      stat.voiceCount++;
      stat.duration += r.duration || 0;
    }

    let isNight = false;
    if (r.timestamp) {
      let dateStr = '';
      let hr = 0;
      const timeStr = String(r.timestamp);
      if (timeStr.length === 14) {
        dateStr = `${timeStr.substring(0,4)}-${timeStr.substring(4,6)}-${timeStr.substring(6,8)}`;
        hr = parseInt(timeStr.substring(8,10), 10);
      } else {
        const d = new Date(r.timestamp);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
          hr = d.getHours();
        }
      }

      if (dateStr) stat.activeDays.add(dateStr);

      if (hr >= 18 || hr < 6) {
        isNight = true;
      }
    }

    if (isNight) {
      stat.nightComms++;
      if (!type.includes('sms')) stat.nightDuration += r.duration || 0;
    } else {
      stat.dayComms++;
      if (!type.includes('sms')) stat.dayDuration += r.duration || 0;
    }
  });

  const intlRecords = Array.from(intlMap.values()).sort((a, b) => b.totalComms - a.totalComms);

  const countryMap = new Map<string, CountryAggregate>();

  intlRecords.forEach(record => {
    if (!countryMap.has(record.country)) {
      countryMap.set(record.country, {
        country: record.country,
        flag: record.flag,
        code: record.code,
        numbers: [],
        voiceCount: 0,
        smsCount: 0,
        totalComms: 0,
        activeDays: 0,
        allActiveDays: new Set<string>(),
        dayComms: 0,
        nightComms: 0,
        dayDuration: 0,
        nightDuration: 0,
        riskLevel: 'LOW',
      });
    }

    const cStat = countryMap.get(record.country)!;
    cStat.numbers.push(record.number);
    cStat.voiceCount += record.voiceCount;
    cStat.smsCount += record.smsCount;
    cStat.totalComms += record.totalComms;
    cStat.dayComms += record.dayComms;
    cStat.nightComms += record.nightComms;
    cStat.dayDuration += record.dayDuration;
    cStat.nightDuration += record.nightDuration;
    
    record.activeDays.forEach(d => cStat.allActiveDays.add(d));
  });

  const countries = Array.from(countryMap.values()).map(c => {
    c.activeDays = c.allActiveDays.size;
    c.riskLevel = determineRiskLevel(c.totalComms);
    return c;
  }).sort((a, b) => b.totalComms - a.totalComms);

  return { intlRecords, countries };
};
