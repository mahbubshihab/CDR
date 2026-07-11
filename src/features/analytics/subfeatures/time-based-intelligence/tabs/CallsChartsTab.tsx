import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Download, Camera, Printer, Maximize2, Hash, Clock, Flame, CheckSquare } from 'lucide-react';
import { ExportableChartCard } from '../../../../../components/ui/ExportableChartCard';
import { type CDRRecord } from '../../../../../utils/db';

interface CallsChartsTabProps {
  records: CDRRecord[];
  mode: 'day' | 'night';
}

const COLORS = ['#3b82f6', '#22c55e', '#facc15', '#f43f5e', '#a855f7'];

export const CallsChartsTab: React.FC<CallsChartsTabProps> = ({ records, mode }) => {
  const chartData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    const contactMap = new Map<string, number>();
    const hourlyMap = new Map<number, number>();
    
    // For heatmap: date -> hour -> count
    const heatmapData = new Map<string, Map<number, number>>();
    
    let durationUnder1 = 0;
    let duration1to5 = 0;
    let durationOver5 = 0;

    records.forEach(r => {
      const d = new Date(r.timestamp);
      const h = d.getHours();
      const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      // Format: YYYY-MM-DD for timeline table
      const formattedDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const contact = r.otherParty || 'Unknown';
      const dur = r.duration || 0;

      dailyMap.set(formattedDate, (dailyMap.get(formattedDate) || 0) + 1);
      contactMap.set(contact, (contactMap.get(contact) || 0) + 1);
      hourlyMap.set(h, (hourlyMap.get(h) || 0) + 1);

      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      if (!heatmapData.has(dayOfWeek)) heatmapData.set(dayOfWeek, new Map());
      heatmapData.get(dayOfWeek)!.set(h, (heatmapData.get(dayOfWeek)!.get(h) || 0) + 1);

      if (dur < 60) durationUnder1++;
      else if (dur <= 300) duration1to5++;
      else durationOver5++;
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topContacts = Array.from(contactMap.entries())
      .map(([contact, count]) => ({ contact, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const durationData = [
      { name: '< 1 min', value: durationUnder1 },
      { name: '1-5 min', value: duration1to5 },
      { name: '5-15 min', value: 0 }, // Mock to match image 3 layout
      { name: '15+ min', value: durationOver5 }
    ].filter(d => d.value > 0);

    const totalEvents = records.length;
    const activeHours = Array.from(hourlyMap.values()).filter(v => v > 0).length;
    
    let peakHour = 0;
    let peakCount = 0;
    hourlyMap.forEach((count, hour) => {
      if (count > peakCount) {
        peakCount = count;
        peakHour = hour;
      }
    });
    
    let peakDay = '';
    let peakDayCount = 0;
    dailyData.forEach(d => {
      if (d.count > peakDayCount) {
        peakDayCount = d.count;
        peakDay = d.date;
      }
    });

    const peakHourStr = `${peakHour.toString().padStart(2, '0')}:00`;

    const hourlyList = Array.from(hourlyMap.entries())
      .map(([hour, events]) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        events,
        percent: totalEvents > 0 ? ((events / totalEvents) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return { 
      dailyData, 
      topContacts, 
      durationData,
      heatmapData,
      hourlyList,
      stats: {
        totalEvents,
        activeHours,
        peakHour: peakHourStr,
        peakCount,
        peakDay,
        peakDayCount,
        daysCount: dailyData.length
      }
    };
  }, [records]);

  const modeLabel = mode === 'day' ? 'Day' : 'Night';
  const primaryColor = mode === 'day' ? '#3b82f6' : '#60a5fa'; // Blue
  const highlightColor = mode === 'day' ? '#facc15' : '#fef08a'; // Yellow
  const greenColor = '#3ecf8e';

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex gap-6 h-full min-h-[600px]">
        {/* Call Frequency */}
        <ExportableChartCard 
          title={`${modeLabel} Call Frequency`}
          exportData={chartData.hourlyList}
          className="flex-1 w-1/2 h-[600px] !bg-[#121212] !border-[#2e2e2e]"
          contentClassName="!bg-[#121212] flex flex-col p-5 min-h-0"
        >
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Top Area: Stats */}
            <div className="flex justify-around items-center shrink-0 py-2 border-b border-[#2e2e2e]/50 mb-2">
              <div className="flex flex-col items-center">
                <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Total Events</div>
                <div className="text-lg font-bold text-white flex items-center gap-1">
                  {chartData.stats.totalEvents}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Active Hours</div>
                <div className="text-lg font-bold text-white flex items-center gap-1">
                  {chartData.stats.activeHours}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Peak Hour</div>
                <div className="text-lg font-bold text-white">
                  {chartData.stats.peakHour} <span className="text-sm font-normal text-gray-400">({chartData.stats.peakCount})</span>
                </div>
              </div>
            </div>
            
            {/* Middle Area: Chart */}
            <div className="h-48 w-full shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.hourlyList}>
                  <XAxis dataKey="hour" stroke="#4b5563" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#4b5563" fontSize={10} />
                  <Tooltip cursor={{fill: '#2a2a2a'}} contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="events" radius={[2, 2, 0, 0]}>
                    {chartData.hourlyList.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        index % 4 === 0 ? '#3ecf8e' : 
                        index % 4 === 1 ? '#3b82f6' : 
                        index % 4 === 2 ? '#a855f7' : '#f43f5e'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Bottom Area: Table */}
            <div className="flex-1 border border-[#2e2e2e] rounded flex flex-col min-h-0">
              <div className="bg-[#1a1a1a] flex p-2 text-[10px] text-gray-500 font-semibold border-b border-[#2e2e2e]">
                <div className="flex-1">Hour</div>
                <div className="w-24 text-right">Events</div>
                <div className="w-24 text-right">%</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {chartData.hourlyList.map(d => (
                  <div key={d.hour} className="flex p-2 text-[10px] text-gray-300 font-mono hover:bg-[#1e1e1e] border-b border-[#2e2e2e]/50">
                    <div className="flex-1">{d.hour}</div>
                    <div className="w-24 text-right">{d.events}</div>
                    <div className="w-24 text-right">{d.percent}%</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#1a1a1a] flex p-2 text-[10px] text-gray-500 font-semibold border-t border-[#2e2e2e] justify-end">
                Total: 100.0%
              </div>
            </div>
          </div>
        </ExportableChartCard>

        {/* Communication Timeline */}
        <ExportableChartCard 
          title={`${modeLabel} Communication Timeline`}
          exportData={chartData.dailyData}
          className="flex-1 w-1/2 h-[600px] !bg-[#121212] !border-[#2e2e2e]"
          contentClassName="!bg-[#121212] flex flex-col p-5 min-h-0"
        >
          <div className="text-[11px] text-gray-400 mb-6 flex gap-4 font-mono shrink-0">
            <span>Total: <strong className="text-white">{chartData.stats.totalEvents}</strong></span>
            <span>Days: <strong className="text-white">{chartData.stats.daysCount}</strong></span>
            <span>Peak: <strong className="text-white">{chartData.stats.peakDay.substring(5)} ({chartData.stats.peakDayCount})</strong></span>
          </div>
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="h-48 w-full shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.dailyData}>
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={0} tickLine={false} axisLine={false} height={0} />
                  <YAxis stroke="#4b5563" fontSize={0} tickLine={false} axisLine={false} width={0} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="count" stroke={greenColor} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 border border-[#2e2e2e] rounded flex flex-col min-h-0">
              <div className="bg-[#1a1a1a] flex p-2 text-[10px] text-gray-500 font-semibold border-b border-[#2e2e2e]">
                <div className="flex-1">Date</div>
                <div className="w-24 text-right">Events</div>
                <div className="w-24 text-right">%</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {chartData.dailyData.map(d => (
                  <div key={d.date} className="flex p-2 text-[10px] text-gray-300 font-mono hover:bg-[#1e1e1e] border-b border-[#2e2e2e]/50">
                    <div className="flex-1">{d.date}</div>
                    <div className="w-24 text-right">{d.count}</div>
                    <div className="w-24 text-right">-</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ExportableChartCard>
      </div>

      {/* ROW 2: Contact Distribution & Duration Distribution */}
      <div className="grid grid-cols-2 gap-6">
        {/* Contact Distribution */}
        <ExportableChartCard 
          title={`${modeLabel} Contact Distribution`}
          exportData={chartData.topContacts}
          className="h-[400px] !bg-[#121212] !border-[#2e2e2e]"
          contentClassName="!bg-[#121212] flex flex-col p-5 min-h-0"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
            <div className="flex flex-col gap-4">
              {chartData.topContacts.map((c, i) => {
                const percentage = ((c.count / chartData.stats.totalEvents) * 100).toFixed(1);
                return (
                  <div key={c.contact} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">#{i + 1}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></div>
                        <span className="text-gray-300">{c.contact}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-gray-400">{c.count}</span>
                        <span className="text-[#3b82f6] w-8 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#1e1e1e] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#3b82f6] h-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ExportableChartCard>

        {/* Duration Distribution */}
        <ExportableChartCard 
          title={`${modeLabel} Duration Distribution`}
          exportData={chartData.durationData}
          className="h-[400px] !bg-[#121212] !border-[#2e2e2e]"
          contentClassName="!bg-[#121212] flex flex-col p-5 min-h-0"
        >
          <div className="flex-1 flex items-center min-h-0">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.durationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.durationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 h-full justify-center">
              {chartData.durationData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-gray-300">{d.name}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">{d.value}</span>
                    <span className="text-gray-500">{((d.value / chartData.stats.totalEvents) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
              <div className="text-right text-[10px] text-gray-500 mt-4 border-t border-[#2e2e2e] pt-2">
                Total: 100.0%
              </div>
            </div>
          </div>
        </ExportableChartCard>
      </div>

      {/* ROW 3: Heatmap & Top Contacts (Yellow) */}
      <div className="grid grid-cols-2 gap-6">
        {/* Heatmap */}
        <ExportableChartCard 
          title={`${modeLabel} Activity Heatmap (Hourly)`}
          className="h-[480px] !bg-[#121212] !border-[#2e2e2e]"
          contentClassName="!bg-[#121212] flex flex-col p-5 min-h-0"
        >
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex mb-2 shrink-0">
              <div className="w-8 text-[9px] text-gray-500">Day</div>
              <div className="flex-1 flex justify-between px-1 text-[9px] text-gray-500">
                <span>0</span><span>3</span><span>6</span><span>9</span><span>12</span><span>15</span><span>18</span><span>21</span>
              </div>
            </div>
            <div className="shrink-0">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
              const hourMap = chartData.heatmapData.get(day) || new Map();
              return (
                <div key={day} className="flex mb-1">
                  <div className="w-8 text-[10px] text-gray-400 font-mono leading-6">{day}</div>
                  <div className="flex-1 flex gap-0.5">
                    {Array.from({length: 24}).map((_, h) => {
                      const count = hourMap.get(h) || 0;
                      // Determine color intensity based on count
                      const maxCount = Math.max(1, ...Array.from(chartData.heatmapData.values()).flatMap(m => Array.from(m.values() as Iterable<number>)));
                      let opacity = count === 0 ? 0 : Math.max(0.2, count / maxCount);
                      
                      return (
                        <div 
                          key={h} 
                          className="flex-1 h-6 rounded-sm flex items-center justify-center group relative cursor-pointer"
                          style={{ backgroundColor: count === 0 ? '#1e1e1e' : highlightColor, opacity: count === 0 ? 1 : opacity }}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50">
                            <div className="bg-[#2a2a2a] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-[#3e3e3e]">
                              {day} {h}:00 - {count} events
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
            <div className="text-center text-[9px] text-gray-500 mt-2 mb-4 shrink-0">Darker shade = more calls at that hour</div>
            
            <div className="flex-1 border border-[#2e2e2e] rounded flex flex-col min-h-0 mt-4">
              <div className="bg-[#1a1a1a] flex p-2 text-[10px] text-gray-500 font-semibold border-b border-[#2e2e2e]">
                <div className="flex-1">Day</div>
                <div className="flex-1">Hour</div>
                <div className="flex-1">Events</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Simplified list for heatmap bottom table */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].flatMap(day => {
                   const hourMap = chartData.heatmapData.get(day) || new Map();
                   return Array.from(hourMap.entries()).filter(([_, c]) => c > 0).map(([h, c]) => (
                     <div key={`${day}-${h}`} className="flex p-2 text-[10px] text-gray-300 font-mono hover:bg-[#1e1e1e] border-b border-[#2e2e2e]/50">
                       <div className="flex-1">{day}</div>
                       <div className="flex-1">{h.toString().padStart(2, '0')}:00</div>
                       <div className="flex-1">{c}</div>
                     </div>
                   ));
                })}
              </div>
            </div>
          </div>
        </ExportableChartCard>

        {/* Top Contacts (Yellow Bars) */}
        <ExportableChartCard 
          title={`Top ${modeLabel} Contacts`}
          exportData={chartData.topContacts}
          className="h-[480px] !bg-[#121212] !border-[#2e2e2e]"
          contentClassName="!bg-[#121212] flex flex-col p-5 min-h-0"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
            <div className="flex flex-col gap-4 mt-4">
              {chartData.topContacts.map((c, i) => {
                const percentage = ((c.count / chartData.stats.totalEvents) * 100).toFixed(1);
                return (
                  <div key={c.contact} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">#{i + 1}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#facc15]"></div>
                        <span className="text-gray-300">{c.contact}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-gray-400">{c.count}</span>
                        <span className="text-[#facc15] w-8 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#1e1e1e] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#facc15] h-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ExportableChartCard>
      </div>
    </div>
  );
};
