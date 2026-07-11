import re

with open('src/features/dashboard/components/GlobalDashboard.tsx', 'r') as f:
    content = f.read()

# Add recharts import
if 'recharts' not in content:
    content = content.replace("import { db, type Case } from '../../../utils/db';", 
                              "import { db, type Case } from '../../../utils/db';\nimport { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';")

# Add state variables
if 'dailyData' not in content:
    content = content.replace("const [loading, setLoading] = useState(true);",
                              "const [loading, setLoading] = useState(true);\n  const [dailyData, setDailyData] = useState<{ date: string; volume: number }[]>([]);\n  const [hourlyData, setHourlyData] = useState<{ hour: string; volume: number }[]>([]);")

# Add daily/hourly logic to fetchDashboardStats
logic = """
      // Calculate Daily and Hourly stats from records
      const dailyMap: { [dateStr: string]: number } = {};
      const hourlyMap: { [hour: string]: number } = {};

      const now = new Date();
      // Initialize dailyMap for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
        dailyMap[d.toISOString().split('T')[0]] = 0;
      }
      // Initialize hourlyMap for 0-23
      for (let i = 0; i < 24; i++) {
        hourlyMap[i.toString().padStart(2, '0') + ':00'] = 0;
      }

      records.forEach(r => {
        const date = new Date(r.timestamp);
        const dateStr = date.toISOString().split('T')[0];
        const hourStr = date.getHours().toString().padStart(2, '0') + ':00';
        
        if (dailyMap[dateStr] !== undefined) {
          dailyMap[dateStr]++;
        }
        if (hourlyMap[hourStr] !== undefined) {
          hourlyMap[hourStr]++;
        }
      });

      setDailyData(Object.entries(dailyMap).map(([date, volume]) => ({ date, volume })));
      setHourlyData(Object.entries(hourlyMap).map(([hour, volume]) => ({ hour, volume })));

    } catch (err) {"""
content = content.replace("    } catch (err) {", logic)

# Replace Frequent locations fallback
fallback_regex = re.compile(r"\[40,\s*60,\s*30,\s*80,\s*50,\s*70\].map.*?\)\)", re.DOTALL)
content = fallback_regex.sub('<div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-medium pb-8">No location data available</div>', content)

# Replace Software Usage (Daily)
usage_block = """          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest block">
              CDR Volume (Daily)
            </h4>
            <p className="text-sm text-gray-400 block mt-0.5">
              Daily call records processed over the last 30 days
            </p>
          </div>

          <div className="h-36 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBlue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>"""

# Remove old SVG
svg_regex = re.compile(r'<div>\s*<h4[^>]*>.*?Software Usage \(Daily\).*?</h4>.*?<svg.*?</svg>\s*</div>', re.DOTALL)
content = svg_regex.sub(usage_block, content)

# Replace Software Open Times (Hourly)
open_times_block = """          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest block">
              CDR Activity (Hourly)
            </h4>
            <p className="text-sm text-gray-400 block mt-0.5">
              Aggregated call frequency by hour of day
            </p>
          </div>

          <div className="h-36 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorPurple)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>"""

svg_regex_2 = re.compile(r'<div>\s*<h4[^>]*>.*?Software Open Times \(Hourly\).*?</h4>.*?<svg.*?</svg>\s*</div>', re.DOTALL)
content = svg_regex_2.sub(open_times_block, content)

with open('src/features/dashboard/components/GlobalDashboard.tsx', 'w') as f:
    f.write(content)

