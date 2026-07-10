import React, { useState, useMemo } from 'react';
import { TrendingUp, Award, MapPin } from 'lucide-react';

interface ActivityTrendlineProps {
  metrics: {
    dailyActivityByMonth: Array<{
      month: string;
      points: number[];
      color: string;
    }>;
    locationBadges: Array<{
      name: string;
      count: number;
    }>;
  };
}

export const ActivityTrendline: React.FC<ActivityTrendlineProps> = ({ metrics }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Peak value across all series
  const maxVal = useMemo(() => {
    let peak = 0;
    metrics.dailyActivityByMonth.forEach(m => {
      m.points.forEach(p => {
        if (p > peak) peak = p;
      });
    });
    return peak || 1;
  }, [metrics.dailyActivityByMonth]);

  // SVG coordinate dimensions
  const svgWidth = 650;
  const svgHeight = 180;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Calculate coordinates
  const getCoords = (dayIdx: number, val: number) => {
    const x = paddingLeft + (dayIdx / 29) * chartWidth;
    const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
    return { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;

    // Convert pixel position back to day index (0-29)
    const ratio = (xPos - (paddingLeft / svgWidth) * rect.width) / ((chartWidth / svgWidth) * rect.width);
    const index = Math.min(29, Math.max(0, Math.round(ratio * 29)));

    setHoveredIndex(index);
    setTooltipPos({ x: xPos + 10, y: yPos - 10 });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Generate ticks
  const yTicks = [
    maxVal,
    Math.round(maxVal * 0.75),
    Math.round(maxVal * 0.5),
    Math.round(maxVal * 0.25),
    0
  ];

  const xTicks = [0, 4, 9, 14, 19, 24, 29]; // Days 1, 5, 10, 15, 20, 25, 30

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 space-y-5 text-left font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-[#3ecf8e]" />
          <h3 className="text-xs font-semibold text-gray-250 uppercase tracking-wider">
            Daily Activity Trend Line
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {metrics.dailyActivityByMonth.map(m => (
            <div key={m.month} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="text-gray-400 font-semibold">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Interactive Trend Chart Container */}
      <div className="relative border border-[#2e2e2e] bg-[#121212]/35 rounded-xl p-3 overflow-visible select-none">
        
        {/* Tooltip Overlay */}
        {hoveredIndex !== null && (
          <div 
            className="absolute z-10 pointer-events-none bg-[#171717]/95 border border-[#2e2e2e] rounded-lg p-3 shadow-xl backdrop-blur-sm text-[10px] space-y-1.5 w-32"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <div className="font-bold text-gray-150 border-b border-[#2e2e2e] pb-1">
              Day {hoveredIndex + 1}
            </div>
            <div className="space-y-1 font-semibold">
              {metrics.dailyActivityByMonth.map(m => (
                <div key={m.month} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-gray-400">{m.month}</span>
                  </div>
                  <span className="text-gray-200">{m.points[hoveredIndex] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <svg 
          className="w-full h-auto overflow-visible cursor-crosshair"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Horizontal Grid lines and Y-axis Labels */}
          {yTicks.map((tick, i) => {
            const { y } = getCoords(0, tick);
            return (
              <g key={i} className="opacity-45">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={svgWidth - paddingRight} 
                  y2={y} 
                  stroke="#2e2e2e" 
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fill="#6b7280" 
                  fontSize="9" 
                  textAnchor="end"
                  className="font-mono font-semibold"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Vertical axis line */}
          <line 
            x1={paddingLeft} 
            y1={paddingTop} 
            x2={paddingLeft} 
            y2={svgHeight - paddingBottom} 
            stroke="#2e2e2e" 
            strokeWidth="1.5"
          />

          {/* Horizontal axis line */}
          <line 
            x1={paddingLeft} 
            y1={svgHeight - paddingBottom} 
            x2={svgWidth - paddingRight} 
            y2={svgHeight - paddingBottom} 
            stroke="#2e2e2e" 
            strokeWidth="1.5"
          />

          {/* X-axis Labels */}
          {xTicks.map((dayIdx, i) => {
            const { x } = getCoords(dayIdx, 0);
            return (
              <text 
                key={i} 
                x={x} 
                y={svgHeight - 12} 
                fill="#6b7280" 
                fontSize="9" 
                textAnchor="middle"
                className="font-mono font-semibold"
              >
                Day {dayIdx + 1}
              </text>
            );
          })}

          {/* Y-axis Label title */}
          <text 
            x={12} 
            y={paddingTop + chartHeight / 2} 
            fill="#4b5563" 
            fontSize="8" 
            textAnchor="middle" 
            transform={`rotate(-90 12 ${paddingTop + chartHeight / 2})`}
            className="font-mono uppercase tracking-wider font-bold"
          >
            Calls / Messages Count
          </text>

          {/* X-axis Label title */}
          <text 
            x={paddingLeft + chartWidth / 2} 
            y={svgHeight - 1} 
            fill="#4b5563" 
            fontSize="8" 
            textAnchor="middle"
            className="font-mono uppercase tracking-wider font-bold"
          >
            Day of Month
          </text>

          {/* Interactive vertical guide line */}
          {hoveredIndex !== null && (
            <line 
              x1={getCoords(hoveredIndex, 0).x} 
              y1={paddingTop} 
              x2={getCoords(hoveredIndex, 0).x} 
              y2={svgHeight - paddingBottom} 
              stroke="#3ecf8e" 
              strokeWidth="1" 
              strokeDasharray="3,3"
            />
          )}

          {/* Chart Polylines */}
          {metrics.dailyActivityByMonth.map(series => {
            const pointsStr = series.points.map((val, idx) => {
              const { x, y } = getCoords(idx, val);
              return `${x},${y}`;
            }).join(' ');

            return (
              <g key={series.month}>
                <polyline
                  fill="none"
                  stroke={series.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsStr}
                  className="transition-all duration-300"
                />
                
                {/* Active circle marker at hover index */}
                {hoveredIndex !== null && (
                  <circle
                    cx={getCoords(hoveredIndex, series.points[hoveredIndex] || 0).x}
                    cy={getCoords(hoveredIndex, series.points[hoveredIndex] || 0).y}
                    r="4"
                    fill={series.color}
                    stroke="#121212"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Location Intel metrics bar */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-1 text-gray-450 font-semibold font-mono text-[10px] uppercase tracking-wider">
          <Award className="h-3.5 w-3.5 text-[#3ecf8e]" />
          <span>Location Intelligence — Peak cell tower transitions</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
          {metrics.locationBadges.map((badge, idx) => (
            <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-[#171717] border border-[#2e2e2e] text-gray-300 rounded-lg hover:border-[#3ecf8e]/30 transition-colors">
              <MapPin className="h-3 w-3 text-gray-500" />
              <span className="truncate max-w-[120px]" title={badge.name}>{badge.name}</span>
              <strong className="text-[#3ecf8e] ml-1">{badge.count}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
