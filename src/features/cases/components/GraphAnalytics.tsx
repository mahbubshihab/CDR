import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Calendar, Phone, MessageSquare, MapPin, 
  Smartphone, UserCheck, Globe, ShieldAlert, Award, 
  TrendingUp, Clock, HelpCircle, AlertCircle, Sparkles,
  Layers, Users, ArrowRight, Download, Printer, Camera, Maximize2
} from 'lucide-react';
import { type CDRFile, type CDRRecord } from '../../../utils/db';
import { getBPartyOperator } from '../../../utils/operators';

interface GraphAnalyticsProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const GraphAnalytics: React.FC<GraphAnalyticsProps> = ({ cdrFile, records }) => {
  // Guard clause for empty records
  if (!records || records.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-6 text-center max-w-sm">
          <AlertCircle className="h-8 w-8 text-[#3ecf8e] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-200">No Records Found</h3>
          <p className="text-xs text-gray-400 mt-1">Please upload a valid CDR file first.</p>
        </div>
      </div>
    );
  }

  // --- STATS & COMPUTATIONS ---

  // 1. Communication Timeline Data
  const timelineData = useMemo(() => {
    const countsMap: { [date: string]: number } = {};
    records.forEach(r => {
      if (r.timestamp) {
        // Parse date string (either ISO format or YYYYMMDDHHMMSS)
        const timeStr = String(r.timestamp);
        let dateStr = '';
        if (timeStr.length === 14) {
          dateStr = `${timeStr.substring(0, 4)}-${timeStr.substring(4, 6)}-${timeStr.substring(6, 8)}`;
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0];
            }
          } catch (_) {}
        }
        if (dateStr) {
          countsMap[dateStr] = (countsMap[dateStr] || 0) + 1;
        }
      }
    });

    const sortedDates = Object.keys(countsMap).sort();
    const list = sortedDates.map(date => ({ date, count: countsMap[date] }));
    
    // Find Peak
    let peakDate = '—';
    let peakCount = 0;
    list.forEach(item => {
      if (item.count > peakCount) {
        peakCount = item.count;
        peakDate = item.date;
      }
    });

    return { list, peakDate, peakCount, totalDays: list.length };
  }, [records]);

  // 2. Hourly Call Pattern
  const hourlyData = useMemo(() => {
    const hours = Array(24).fill(0);
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let hr = -1;
        if (timeStr.length === 14) {
          hr = parseInt(timeStr.substring(8, 10), 10);
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              hr = d.getHours();
            }
          } catch (_) {}
        }
        if (hr >= 0 && hr < 24) {
          hours[hr]++;
        }
      }
    });

    let peakHour = 0;
    let peakCount = 0;
    let activeHours = 0;
    hours.forEach((count, hr) => {
      if (count > 0) activeHours++;
      if (count > peakCount) {
        peakCount = count;
        peakHour = hr;
      }
    });

    return { hours, peakHour, peakCount, activeHours };
  }, [records]);

  // 3. Call Type Distribution (MOC vs MTC vs SMS)
  const callTypeDistribution = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;
    let sms = 0;
    records.forEach(r => {
      const type = r.usageType.toLowerCase();
      if (type.includes('sms')) sms++;
      else if (type.includes('mtc') || type.includes('incoming')) incoming++;
      else if (type.includes('moc') || type.includes('outgoing')) outgoing++;
      else outgoing++; // Default fallback
    });
    const total = incoming + outgoing + sms || 1;
    return {
      incoming,
      outgoing,
      sms,
      incomingPct: ((incoming / total) * 100).toFixed(1),
      outgoingPct: ((outgoing / total) * 100).toFixed(1),
      smsPct: ((sms / total) * 100).toFixed(1),
      total
    };
  }, [records]);

  // 4. Call Duration Distribution (0-30s, 30s-1m, 1-5m, 5-15m, 15m+)
  const durationDistribution = useMemo(() => {
    let range1 = 0; // 0-30s
    let range2 = 0; // 30s-1m
    let range3 = 0; // 1-5m
    let range4 = 0; // 5-15m
    let range5 = 0; // 15m+

    records.forEach(r => {
      // Skip SMS records for duration
      if (r.usageType.toLowerCase().includes('sms')) return;
      const d = r.duration || 0;
      if (d <= 30) range1++;
      else if (d <= 60) range2++;
      else if (d <= 300) range3++;
      else if (d <= 900) range4++;
      else range5++;
    });

    const total = range1 + range2 + range3 + range4 + range5 || 1;
    return [
      { name: '0-30s', count: range1, pct: ((range1 / total) * 100).toFixed(1) },
      { name: '30s-1m', count: range2, pct: ((range2 / total) * 100).toFixed(1) },
      { name: '1-5m', count: range3, pct: ((range3 / total) * 100).toFixed(1) },
      { name: '5-15m', count: range4, pct: ((range4 / total) * 100).toFixed(1) },
      { name: '15m+', count: range5, pct: ((range5 / total) * 100).toFixed(1) },
    ];
  }, [records]);

  // 5. Day of Week Analysis
  const dayOfWeekData = useMemo(() => {
    const days = Array(7).fill(0); // 0 = Sun, 1 = Mon ...
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let dayIdx = -1;
        if (timeStr.length === 14) {
          const y = parseInt(timeStr.substring(0, 4), 10);
          const m = parseInt(timeStr.substring(4, 6), 10) - 1;
          const d = parseInt(timeStr.substring(6, 8), 10);
          dayIdx = new Date(y, m, d).getDay();
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              dayIdx = d.getDay();
            }
          } catch (_) {}
        }
        if (dayIdx >= 0 && dayIdx < 7) {
          days[dayIdx]++;
        }
      }
    });

    const total = days.reduce((a, b) => a + b, 0) || 1;
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Reorder as Mon to Sun for display (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    const displayIndices = [1, 2, 3, 4, 5, 6, 0];
    const colors = [
      '#3ecf8e', // Mon - Emerald
      '#8b5cf6', // Tue - Purple
      '#f59e0b', // Wed - Amber
      '#10b981', // Thu - Teal/Green
      '#ec4899', // Fri - Pink
      '#3b82f6', // Sat - Blue
      '#f97316'  // Sun - Orange
    ];

    return displayIndices.map((idx, index) => ({
      name: names[idx],
      count: days[idx],
      pct: ((days[idx] / total) * 100).toFixed(1),
      color: colors[index]
    }));
  }, [records]);

  // 6. IMEI Usage Pattern
  const imeiUsage = useMemo(() => {
    const map: { [imei: string]: number } = {};
    records.forEach(r => {
      if (r.imei) {
        map[r.imei] = (map[r.imei] || 0) + 1;
      }
    });
    const sorted = Object.entries(map)
      .map(([imei, count]) => ({ imei, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 4).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);

  // 7. Call Direction Analysis (Outgoing Calls vs Outgoing SMS)
  const callDirection = useMemo(() => {
    let outgoingCalls = 0;
    let outgoingSMS = 0;
    records.forEach(r => {
      const type = r.usageType.toLowerCase();
      if (type.includes('moc') || type.includes('outgoing')) {
        if (type.includes('sms')) {
          outgoingSMS++;
        } else {
          outgoingCalls++;
        }
      }
    });
    const total = outgoingCalls + outgoingSMS || 1;
    return {
      calls: outgoingCalls,
      sms: outgoingSMS,
      callsPct: ((outgoingCalls / total) * 100).toFixed(1),
      smsPct: ((outgoingSMS / total) * 100).toFixed(1)
    };
  }, [records]);

  // 8. Call Activity Heatmap Data (7 Days x 24 Hours)
  const heatmapData = useMemo(() => {
    // 7 rows (Mon-Sun), 24 columns (00:00 to 23:00)
    const grid = Array(7).fill(0).map(() => Array(24).fill(0));
    
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let hr = -1;
        let dayIdx = -1;
        if (timeStr.length === 14) {
          hr = parseInt(timeStr.substring(8, 10), 10);
          const y = parseInt(timeStr.substring(0, 4), 10);
          const m = parseInt(timeStr.substring(4, 6), 10) - 1;
          const d = parseInt(timeStr.substring(6, 8), 10);
          dayIdx = new Date(y, m, d).getDay();
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              hr = d.getHours();
              dayIdx = d.getDay();
            }
          } catch (_) {}
        }
        
        if (hr >= 0 && hr < 24 && dayIdx >= 0 && dayIdx < 7) {
          // Map dayIdx (0=Sun, 1=Mon, ..., 6=Sat) to Display Index (0=Mon, 1=Tue, ..., 6=Sun)
          const displayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
          grid[displayIdx][hr]++;
        }
      }
    });

    let maxCellVal = 0;
    grid.forEach(row => {
      row.forEach(val => {
        if (val > maxCellVal) maxCellVal = val;
      });
    });

    return { grid, maxCellVal: maxCellVal || 1 };
  }, [records]);

  // 9. Contact Frequency
  const contactFrequency = useMemo(() => {
    const map: { [num: string]: number } = {};
    records.forEach(r => {
      if (r.otherParty) {
        map[r.otherParty] = (map[r.otherParty] || 0) + 1;
      }
    });
    const sorted = Object.entries(map)
      .map(([number, count]) => ({ number, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 6).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);

  // 10. Top Location Activity
  const locationActivity = useMemo(() => {
    const map: { [addr: string]: number } = {};
    records.forEach(r => {
      if (r.address) {
        map[r.address] = (map[r.address] || 0) + 1;
      }
    });
    const sorted = Object.entries(map)
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 6).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);

  // 11. Day vs Night Activity (Day: 06:00-22:00, Night: 22:00-06:00)
  const dayNightActivity = useMemo(() => {
    let day = 0;
    let night = 0;
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let hr = -1;
        if (timeStr.length === 14) {
          hr = parseInt(timeStr.substring(8, 10), 10);
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              hr = d.getHours();
            }
          } catch (_) {}
        }
        if (hr >= 0) {
          if (hr >= 6 && hr < 22) {
            day++;
          } else {
            night++;
          }
        }
      }
    });
    const total = day + night || 1;
    return {
      day,
      night,
      dayPct: ((day / total) * 100).toFixed(1),
      nightPct: ((night / total) * 100).toFixed(1)
    };
  }, [records]);

  // 12. Call vs SMS Distribution
  const callSmsDistribution = useMemo(() => {
    let calls = 0;
    let sms = 0;
    records.forEach(r => {
      if (r.usageType.toLowerCase().includes('sms')) {
        sms++;
      } else {
        calls++;
      }
    });
    const total = calls + sms || 1;
    return {
      calls,
      sms,
      callsPct: ((calls / total) * 100).toFixed(1),
      smsPct: ((sms / total) * 100).toFixed(1)
    };
  }, [records]);

  // 13. Incoming vs Outgoing for Top Contacts
  const incomingOutgoingContacts = useMemo(() => {
    const map: { [num: string]: { incoming: number; outgoing: number; total: number } } = {};
    records.forEach(r => {
      if (!r.otherParty) return;
      if (!map[r.otherParty]) {
        map[r.otherParty] = { incoming: 0, outgoing: 0, total: 0 };
      }
      const type = r.usageType.toLowerCase();
      if (type.includes('mtc') || type.includes('incoming')) {
        map[r.otherParty].incoming++;
      } else {
        map[r.otherParty].outgoing++;
      }
      map[r.otherParty].total++;
    });

    return Object.entries(map)
      .map(([number, data]) => ({ number, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [records]);

  // 14. SMS Activity (Top SMS contacts)
  const smsActivity = useMemo(() => {
    const map: { [num: string]: number } = {};
    records.forEach(r => {
      if (r.otherParty && r.usageType.toLowerCase().includes('sms')) {
        map[r.otherParty] = (map[r.otherParty] || 0) + 1;
      }
    });
    const sorted = Object.entries(map)
      .map(([number, count]) => ({ number, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 6).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);

  // 15. Monthly Activity Graph
  const monthlyData = useMemo(() => {
    const monthsMap: { [month: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let mIdx = -1;
        let yr = '';
        if (timeStr.length === 14) {
          mIdx = parseInt(timeStr.substring(4, 6), 10) - 1;
          yr = timeStr.substring(2, 4);
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              mIdx = d.getMonth();
              yr = d.getFullYear().toString().substring(2);
            }
          } catch (_) {}
        }
        if (mIdx >= 0 && mIdx < 12) {
          const key = `${monthNames[mIdx]} ${yr}`;
          monthsMap[key] = (monthsMap[key] || 0) + 1;
        }
      }
    });

    const list = Object.entries(monthsMap).map(([month, count]) => ({ month, count }));
    const total = list.reduce((a, b) => a + b.count, 0) || 1;
    
    let peakMonth = '—';
    let peakCount = 0;
    list.forEach(item => {
      if (item.count > peakCount) {
        peakCount = item.count;
        peakMonth = item.month;
      }
    });

    return {
      list: list.map(item => ({ ...item, pct: ((item.count / total) * 100).toFixed(1) })),
      peakMonth,
      peakCount,
      totalMonths: list.length
    };
  }, [records]);

  // 16. International Activity Graph
  const internationalData = useMemo(() => {
    const countriesMap: { [country: string]: number } = {};
    records.forEach(r => {
      if (r.otherParty) {
        let num = r.otherParty.replace('+', '');
        if (num.startsWith('0')) num = num.substring(1);
        
        let country = 'Bangladesh';
        if (num.startsWith('92')) country = 'Pakistan';
        else if (num.startsWith('91')) country = 'India';
        else if (num.startsWith('44')) country = 'United Kingdom';
        else if (num.startsWith('971')) country = 'United Arab Emirates';
        else if (num.startsWith('966')) country = 'Saudi Arabia';
        else if (num.startsWith('973')) country = 'Bahrain';
        else if (num.startsWith('965')) country = 'Kuwait';
        else if (num.startsWith('93')) country = 'Afghanistan';
        else if (num.startsWith('49')) country = 'Germany';
        else if (num.startsWith('1')) country = 'USA/Canada';
        
        if (country !== 'Bangladesh') {
          countriesMap[country] = (countriesMap[country] || 0) + 1;
        }
      }
    });

    const sorted = Object.entries(countriesMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 6).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);


  // Helper component for small card buttons
  const CardActions = () => (
    <div className="flex items-center gap-1.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
      <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-200 rounded transition-colors" title="Download data">
        <Download className="h-3 w-3" />
      </button>
      <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-200 rounded transition-colors" title="Screenshot">
        <Camera className="h-3 w-3" />
      </button>
      <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-200 rounded transition-colors" title="Print">
        <Printer className="h-3 w-3" />
      </button>
      <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-200 rounded transition-colors" title="Maximize">
        <Maximize2 className="h-3 w-3" />
      </button>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Tab Header with indicators */}
      <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-gray-200">Graph Analytics</h2>
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#3ecf8e]" />
              <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="h-2 w-2 rounded-full bg-teal-500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Comprehensive multidimensional statistical graphs and behavioral timelines
          </p>
        </div>
      </div>

      {/* Grid containing 16 analytical cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Communication Timeline */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Communication Timeline</h3>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 font-mono">
                  <span>Total: <strong className="text-gray-300 font-semibold">{timelineData.list.reduce((a,b)=>a+b.count,0)}</strong></span>
                  <span>Days: <strong className="text-gray-300 font-semibold">{timelineData.totalDays}</strong></span>
                  <span>Peak: <strong className="text-[#3ecf8e] font-semibold">{timelineData.peakDate} ({timelineData.peakCount})</strong></span>
                </div>
              </div>
              <CardActions />
            </div>

            {/* Custom SVG Line Chart */}
            <div className="h-40 w-full relative border-b border-[#2e2e2e]/55 mt-4">
              {timelineData.list.length > 1 ? (
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="500" y2="25" stroke="#2e2e2e" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#2e2e2e" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#2e2e2e" strokeWidth="0.5" strokeDasharray="3,3" />
                  
                  {/* Curve Path */}
                  {(() => {
                    const maxVal = Math.max(...timelineData.list.map(d => d.count)) || 1;
                    const points = timelineData.list.map((item, idx) => {
                      const x = (idx / (timelineData.list.length - 1)) * 500;
                      const y = 90 - (item.count / maxVal) * 80;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#3ecf8e"
                          strokeWidth="2.2"
                          points={points}
                        />
                        {/* Shadow path */}
                        <path
                          fill="url(#timelineGrad)"
                          stroke="none"
                          d={`M 0,100 L ${points} L 500,100 Z`}
                        />
                        <defs>
                          <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3ecf8e" stopOpacity="0.16" />
                            <stop offset="100%" stopColor="#3ecf8e" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-mono">
                  Insufficient daily span to render trendline.
                </div>
              )}
            </div>
          </div>

          {/* Timeline Mini Data Table */}
          <div className="mt-4">
            <div className="overflow-hidden border border-[#2e2e2e]/60 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400">
                    <th className="py-1.5 px-3">Date</th>
                    <th className="py-1.5 px-3 text-right">Events</th>
                    <th className="py-1.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                  {timelineData.list.slice(0, 3).map((item, idx) => {
                    const total = timelineData.list.reduce((a,b)=>a+b.count,0) || 1;
                    return (
                      <tr key={idx} className="hover:bg-[#171717]/40">
                        <td className="py-1.5 px-3">{item.date}</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-gray-200">{item.count}</td>
                        <td className="py-1.5 px-3 text-right text-gray-500">{((item.count / total) * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2. Hourly Call Pattern */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Hourly Call Pattern</h3>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 font-mono">
                  <span>TOTAL EVENTS: <strong className="text-gray-300 font-semibold">{records.length}</strong></span>
                  <span>ACTIVE HOURS: <strong className="text-gray-300 font-semibold">{hourlyData.activeHours}</strong></span>
                  <span>PEAK HOUR: <strong className="text-red-500 font-semibold">{hourlyData.peakHour.toString().padStart(2,'0')}:00 ({hourlyData.peakCount})</strong></span>
                </div>
              </div>
              <CardActions />
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-40 w-full relative flex items-end gap-1 border-b border-[#2e2e2e]/55 mt-4 pb-1">
              {hourlyData.hours.map((count, hr) => {
                const max = Math.max(...hourlyData.hours) || 1;
                const heightPct = (count / max) * 100;
                const isPeak = hr === hourlyData.peakHour;
                return (
                  <div key={hr} className="flex-1 flex flex-col items-center group h-full justify-end">
                    <div 
                      className={`w-full rounded-t transition-all duration-155 ${isPeak ? 'bg-red-500' : 'bg-[#3ecf8e]/80 hover:bg-[#3ecf8e]'}`}
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                      title={`${hr.toString().padStart(2,'0')}:00 - ${count} events`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly Mini Data Table */}
          <div className="mt-4">
            <div className="overflow-hidden border border-[#2e2e2e]/60 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400">
                    <th className="py-1.5 px-3">Hour</th>
                    <th className="py-1.5 px-3 text-right">Events</th>
                    <th className="py-1.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                  {[hourlyData.peakHour, (hourlyData.peakHour + 1) % 24, (hourlyData.peakHour + 2) % 24].map((hr, idx) => {
                    const count = hourlyData.hours[hr] || 0;
                    const pct = ((count / (records.length || 1)) * 100).toFixed(1);
                    return (
                      <tr key={idx} className="hover:bg-[#171717]/40">
                        <td className="py-1.5 px-3">{hr.toString().padStart(2,'0')}:00</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-gray-200">{count}</td>
                        <td className="py-1.5 px-3 text-right text-gray-500">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Call Type Distribution */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Call Type Distribution</h3>
            <CardActions />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            {/* Donut Chart SVG */}
            <div className="relative h-32 w-32 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2e2e2e" strokeWidth="3" />
                
                {(() => {
                  const t = callTypeDistribution;
                  const totalVal = t.total;
                  const inStroke = (t.incoming / totalVal) * 100;
                  const outStroke = (t.outgoing / totalVal) * 100;
                  const smsStroke = (t.sms / totalVal) * 100;

                  return (
                    <>
                      {/* Incoming: Teal */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3ecf8e" strokeWidth="3"
                        strokeDasharray={`${inStroke} ${100 - inStroke}`}
                        strokeDashoffset="0"
                      />
                      {/* Outgoing: Purple */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="3"
                        strokeDasharray={`${outStroke} ${100 - outStroke}`}
                        strokeDashoffset={`-${inStroke}`}
                      />
                      {/* SMS: Yellow */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3"
                        strokeDasharray={`${smsStroke} ${100 - smsStroke}`}
                        strokeDashoffset={`-${inStroke + outStroke}`}
                      />
                    </>
                  );
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold text-gray-100 font-mono leading-none">
                  {callTypeDistribution.total}
                </span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Logs</span>
              </div>
            </div>

            {/* Legends */}
            <div className="flex-1 space-y-2.5 w-full text-xs font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3ecf8e]" />
                  <span className="text-gray-300">Incoming Calls</span>
                </div>
                <span className="text-gray-400 font-semibold">{callTypeDistribution.incoming} ({callTypeDistribution.incomingPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                  <span className="text-gray-300">Outgoing Calls</span>
                </div>
                <span className="text-gray-400 font-semibold">{callTypeDistribution.outgoing} ({callTypeDistribution.outgoingPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-gray-300">SMS Activity</span>
                </div>
                <span className="text-gray-400 font-semibold">{callTypeDistribution.sms} ({callTypeDistribution.smsPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Call Duration Distribution */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Call Duration Distribution</h3>
            <CardActions />
          </div>

          <div className="h-32 flex items-end gap-3 mt-4">
            {durationDistribution.map((item, idx) => {
              const max = Math.max(...durationDistribution.map(d => d.count)) || 1;
              const heightPct = (item.count / max) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] text-gray-500 font-mono mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div 
                    className="w-full bg-[#3ecf8e]/20 hover:bg-[#3ecf8e]/40 border border-[#3ecf8e]/30 rounded-t transition-all duration-150"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                  <span className="text-[10px] text-gray-400 mt-2 font-mono truncate max-w-full text-center">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-gray-500 font-mono text-center mt-3">
            Note: SMS events excluded from duration aggregates.
          </div>
        </div>

        {/* 5. Day of Week Analysis */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Day of Week Analysis</h3>
            <CardActions />
          </div>

          <div className="h-32 flex items-end gap-3.5 mt-4">
            {dayOfWeekData.map((item, idx) => {
              const max = Math.max(...dayOfWeekData.map(d => d.count)) || 1;
              const heightPct = (item.count / max) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[9px] text-gray-500 font-mono mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.pct}%
                  </span>
                  <div 
                    className="w-full rounded-t transition-all duration-150"
                    style={{ 
                      height: `${Math.max(heightPct, 4)}%`,
                      backgroundColor: item.color
                    }}
                  />
                  <span className="text-[10px] text-gray-400 mt-2 font-mono text-center">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-gray-500 font-mono text-center mt-3">
            Total Distribution Percentage: 100%
          </div>
        </div>

        {/* 6. IMEI Usage Pattern */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">IMEI Usage Pattern</h3>
            <CardActions />
          </div>

          <div className="space-y-4 py-1.5">
            {imeiUsage.length > 0 ? (
              imeiUsage.map((item, idx) => {
                const colors = ['bg-cyan-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500'];
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-400">#{idx+1} <strong className="text-gray-200 ml-1.5">{item.imei}</strong></span>
                      <span className="text-gray-450 font-semibold">{item.count} <strong className="text-gray-500 text-[10px] ml-1">({item.pct}%)</strong></span>
                    </div>
                    <div className="h-2 w-full bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-300`} 
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-xs text-gray-500 font-mono py-8">
                No IMEI data mapped in spreadsheet.
              </div>
            )}
          </div>
        </div>

        {/* 7. Call Direction Analysis */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Call Direction Analysis</h3>
            <CardActions />
          </div>

          <div className="flex flex-col justify-center h-32 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-300">Outgoing Calls</span>
                <span className="text-cyan-400 font-semibold">{callDirection.callsPct}%</span>
              </div>
              <div className="h-4.5 w-full bg-[#121212] border border-[#2e2e2e] rounded overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-300" 
                  style={{ width: `${callDirection.callsPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-300">Outgoing SMS</span>
                <span className="text-purple-400 font-semibold">{callDirection.smsPct}%</span>
              </div>
              <div className="h-4.5 w-full bg-[#121212] border border-[#2e2e2e] rounded overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300" 
                  style={{ width: `${callDirection.smsPct}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 font-mono text-center mt-2">
            Comparison of outbound target traffic distribution.
          </div>
        </div>

        {/* 8. Call Activity Heatmap */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Call Activity Heatmap</h3>
            <CardActions />
          </div>

          <div className="flex flex-col mt-2">
            <div className="flex justify-between text-[8px] text-gray-500 font-mono pl-8 pr-1 mb-1">
              <span>0</span>
              <span>6</span>
              <span>12</span>
              <span>18</span>
              <span>23</span>
            </div>
            
            <div className="space-y-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => (
                <div key={day} className="flex items-center gap-1.5">
                  <span className="w-6 text-[9px] text-gray-400 font-mono text-right">{day}</span>
                  <div className="flex-1 grid grid-cols-24 gap-0.5">
                    {Array(24).fill(0).map((_, hIdx) => {
                      const val = heatmapData.grid[dIdx][hIdx] || 0;
                      const ratio = val / heatmapData.maxCellVal;
                      return (
                        <div 
                          key={hIdx} 
                          className="aspect-square rounded-[1px] transition-colors border border-[#2e2e2e]/20"
                          style={{
                            backgroundColor: val > 0 
                              ? `rgba(62, 207, 142, ${0.15 + ratio * 0.85})` 
                              : '#121212'
                          }}
                          title={`${day} ${hIdx.toString().padStart(2,'0')}:00 - ${val} events`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Gradient scale legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-[9px] text-gray-500 font-mono">
              <span>Low</span>
              <div className="w-24 h-2 rounded bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-400" />
              <span>High</span>
            </div>
          </div>
        </div>

        {/* 9. Contact Frequency */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Contact Frequency</h3>
            <CardActions />
          </div>

          <div className="space-y-3.5 py-1">
            {contactFrequency.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">#{idx+1} <strong className="text-gray-200 ml-1.5">{item.number}</strong></span>
                  <span className="text-gray-450 font-semibold">{item.count} <strong className="text-gray-500 text-[10px] ml-1">({item.pct}%)</strong></span>
                </div>
                <div className="h-1.5 w-full bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 rounded-full transition-all duration-300" 
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 10. Top Location Activity */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Top Location Activity</h3>
            <CardActions />
          </div>

          <div className="space-y-3.5 py-1">
            {locationActivity.length > 0 ? (
              locationActivity.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400 truncate max-w-[170px]" title={item.address}>
                      #{idx+1} <strong className="text-gray-200 ml-1.5">{item.address}</strong>
                    </span>
                    <span className="text-gray-450 font-semibold">{item.count} <strong className="text-gray-500 text-[10px] ml-1">({item.pct}%)</strong></span>
                  </div>
                  <div className="h-1.5 w-full bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-gray-555 font-mono py-12">
                No cell tower coordinate address data.
              </div>
            )}
          </div>
        </div>

        {/* 11. Day vs Night Activity */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Day vs Night Activity</h3>
            <CardActions />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            <div className="relative h-28 w-28 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2e2e2e" strokeWidth="4.5" />
                
                {(() => {
                  const dayPct = parseFloat(dayNightActivity.dayPct);
                  const nightPct = parseFloat(dayNightActivity.nightPct);
                  return (
                    <>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4.5"
                        strokeDasharray={`${dayPct} ${100 - dayPct}`}
                        strokeDashoffset="0"
                      />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4.5"
                        strokeDasharray={`${nightPct} ${100 - nightPct}`}
                        strokeDashoffset={`-${dayPct}`}
                      />
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="flex-1 space-y-3 w-full text-xs font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-gray-300">Day (06:00 - 22:00)</span>
                </div>
                <span className="text-gray-400 font-semibold">{dayNightActivity.day} ({dayNightActivity.dayPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
                  <span className="text-gray-300">Night (22:00 - 06:00)</span>
                </div>
                <span className="text-gray-400 font-semibold">{dayNightActivity.night} ({dayNightActivity.nightPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 12. Call vs SMS Distribution */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Call vs SMS Distribution</h3>
            <CardActions />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            <div className="relative h-28 w-28 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2e2e2e" strokeWidth="4.5" />
                {(() => {
                  const callsPct = parseFloat(callSmsDistribution.callsPct);
                  const smsPct = parseFloat(callSmsDistribution.smsPct);
                  return (
                    <>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3ecf8e" strokeWidth="4.5"
                        strokeDasharray={`${callsPct} ${100 - callsPct}`}
                        strokeDashoffset="0"
                      />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="4.5"
                        strokeDasharray={`${smsPct} ${100 - smsPct}`}
                        strokeDashoffset={`-${callsPct}`}
                      />
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="flex-1 space-y-3 w-full text-xs font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3ecf8e]" />
                  <span className="text-gray-300">Voice Calls</span>
                </div>
                <span className="text-gray-400 font-semibold">{callSmsDistribution.calls} ({callSmsDistribution.callsPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                  <span className="text-gray-300">SMS Logs</span>
                </div>
                <span className="text-gray-400 font-semibold">{callSmsDistribution.sms} ({callSmsDistribution.smsPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 13. Incoming vs Outgoing */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Incoming vs Outgoing</h3>
            <CardActions />
          </div>

          <div className="space-y-3 py-1">
            {incomingOutgoingContacts.map((item, idx) => {
              const total = item.incoming + item.outgoing || 1;
              const incPct = (item.incoming / total) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">#{idx+1} <strong className="text-gray-200 ml-1.5">{item.number}</strong></span>
                    <span className="text-gray-505 text-[10px] font-semibold">Total: {item.total}</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#121212] border border-[#2e2e2e] rounded overflow-hidden flex">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-300" 
                      style={{ width: `${incPct}%` }}
                      title={`Incoming: ${item.incoming}`}
                    />
                    <div 
                      className="h-full bg-purple-500 transition-all duration-300" 
                      style={{ width: `${100 - incPct}%` }}
                      title={`Outgoing: ${item.outgoing}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 14. SMS Activity */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">SMS Activity</h3>
            <CardActions />
          </div>

          <div className="space-y-3.5 py-1">
            {smsActivity.length > 0 ? (
              smsActivity.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">#{idx+1} <strong className="text-gray-200 ml-1.5">{item.number}</strong></span>
                    <span className="text-gray-450 font-semibold">{item.count} <strong className="text-gray-500 text-[10px] ml-1">({item.pct}%)</strong></span>
                  </div>
                  <div className="h-1.5 w-full bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 rounded-full transition-all duration-300" 
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-gray-500 font-mono py-12">
                No SMS activity logged in records.
              </div>
            )}
          </div>
        </div>

        {/* 15. Monthly Activity Graph */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Monthly Activity Graph</h3>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 font-mono">
                  <span>TOTAL EVENTS: <strong className="text-gray-300 font-semibold">{records.length}</strong></span>
                  <span>MONTHS: <strong className="text-gray-300 font-semibold">{monthlyData.totalMonths}</strong></span>
                  <span>PEAK MONTH: <strong className="text-[#3ecf8e] font-semibold">{monthlyData.peakMonth} ({monthlyData.peakCount})</strong></span>
                </div>
              </div>
              <CardActions />
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-32 flex items-end gap-3 mt-4 border-b border-[#2e2e2e]/55 pb-1">
              {monthlyData.list.map((item, idx) => {
                const max = Math.max(...monthlyData.list.map(d => d.count)) || 1;
                const heightPct = (item.count / max) * 100;
                const colors = ['bg-[#3ecf8e]', 'bg-[#8b5cf6]', 'bg-[#f59e0b]', 'bg-blue-500', 'bg-pink-500'];
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div 
                      className={`w-full rounded-t transition-all duration-150 ${colors[idx % colors.length]}`}
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                      title={`${item.month} - ${item.count} events`}
                    />
                    <span className="text-[9px] text-gray-400 mt-2 font-mono truncate max-w-full text-center">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Mini Data Table */}
          <div className="mt-4">
            <div className="overflow-hidden border border-[#2e2e2e]/60 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400">
                    <th className="py-1.5 px-3">Month</th>
                    <th className="py-1.5 px-3 text-right">Events</th>
                    <th className="py-1.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                  {monthlyData.list.slice(0, 3).map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#171717]/40">
                      <td className="py-1.5 px-3">{item.month}</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-gray-200">{item.count}</td>
                      <td className="py-1.5 px-3 text-right text-gray-505">{item.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 16. International Activity Graph */}
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">International Activity Graph</h3>
            <CardActions />
          </div>

          <div className="space-y-3.5 py-1">
            {internationalData.length > 0 ? (
              internationalData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">#{idx+1} <strong className="text-gray-200 ml-1.5">{item.country}</strong></span>
                    <span className="text-gray-450 font-semibold">{item.count} <strong className="text-gray-500 text-[10px] ml-1">({item.pct}%)</strong></span>
                  </div>
                  <div className="h-1.5 w-full bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-gray-500 font-mono py-12">
                No international call prefixes matched (+92, +91, +44, +971, etc.).
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
