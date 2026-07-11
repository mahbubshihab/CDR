import React, { useState, useRef } from 'react';
import { Download, Camera, Printer, Maximize2, X } from 'lucide-react';

interface MfcChartCardWrapperProps {
  title: string;
  subdetails?: React.ReactNode;
  exportData: any;
  chartType: 'top5' | 'heatmap';
  children: React.ReactNode;
}

export const MfcChartCardWrapper: React.FC<MfcChartCardWrapperProps> = ({
  title,
  subdetails,
  exportData,
  chartType,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Download Data as CSV
  const handleDownloadData = (e: React.MouseEvent) => {
    e.stopPropagation();

    const convertToCSV = (data: any): string => {
      if (Array.isArray(data)) {
        if (data.length === 0) return '';
        const first = data[0];
        if (typeof first === 'object' && first !== null) {
          const headers = Object.keys(first);
          const rows = data.map(row => 
            headers.map(h => {
              const val = row[h];
              return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : String(val ?? '');
            }).join(',')
          );
          return [headers.join(','), ...rows].join('\n');
        } else {
          return 'Index,Value\n' + data.map((val, idx) => `${idx},${val}`).join('\n');
        }
      } else if (typeof data === 'object' && data !== null) {
        const entries = Object.entries(data);
        return 'Metric,Value\n' + entries.map(([k, v]) => `"${k}",${v}`).join('\n');
      }
      return String(data);
    };

    let csvData = exportData;
    // Flatten heatmap data for CSV if needed
    if (chartType === 'heatmap') {
      csvData = exportData.map((row: any) => {
        const res: any = { Contact: row.contact };
        row.hourly.forEach((val: number, hr: number) => {
          res[`Hour_${hr}`] = val;
        });
        return res;
      });
    }

    const csvContent = convertToCSV(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `${title.toLowerCase().replace(/ /g, '_')}_data.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  // 2. Export Card View as PNG Screenshot
  const handleScreenshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const scaleFactor = 3;
    const canvas = document.createElement('canvas');
    canvas.width = 600 * scaleFactor;
    canvas.height = 320 * scaleFactor;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scaleFactor, scaleFactor);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 320);

    // Draw card border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, 598, 318);

    // Draw Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(title.toUpperCase(), 20, 30);

    // Draw watermark
    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.fillText('AI-Powered CDR Analyzer', 600 - 165, 320 - 15);

    if (Array.isArray(exportData)) {
      if (exportData.length === 0) {
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText('No data available', 600 / 2 - 50, 320 / 2);
      } else {
        if (chartType === 'top5') {
          const list = exportData;
          const padT = 60;
          const rowH = 40;

          list.forEach((item: any, idx: number) => {
            const y = padT + idx * rowH;
            const label = item.number || 'N/A';
            const count = item.count || 0;
            const pct = item.pct || '0';
            const color = item.color || '#3ecf8e';

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`#${idx + 1}  ${label}`, 20, y + 10);

            ctx.fillStyle = '#000000';
            ctx.fillText(`${count} (${pct}%)`, 600 - 100, y + 10);

            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(20, y + 16, 600 - 40, 6);

            ctx.fillStyle = color;
            ctx.fillRect(20, y + 16, (parseFloat(pct) / 100) * (600 - 40), 6);
          });
        } else if (chartType === 'heatmap') {
          const gridData = exportData;
          const maxVal = Math.max(...gridData.map((row: any) => Math.max(...row.hourly))) || 1;
          
          const padL = 90;
          const padT = 60;
          const gridW = 600 - padL - 20;
          const gridH = 320 - padT - 30;
          const cellW = gridW / 24;
          const cellH = gridH / Math.max(gridData.length, 1);

          // Draw hours header
          ctx.fillStyle = '#666666';
          ctx.font = '7px monospace';
          [0, 3, 6, 9, 12, 15, 18, 21].forEach(h => {
            ctx.fillText(String(h), padL + h * cellW, padT - 8);
          });

          gridData.forEach((item: any, dIdx: number) => {
            // Draw contact label
            ctx.fillStyle = item.color || '#000000';
            ctx.font = 'bold 8px monospace';
            ctx.fillText(item.contact, 10, padT + dIdx * cellH + cellH / 1.5);

            item.hourly.forEach((val: number, hIdx: number) => {
              const x = padL + hIdx * cellW;
              const y = padT + dIdx * cellH;

              let bg = '#ffffff';
              if (val > 0) {
                const intensity = val / maxVal;
                if (intensity > 0.8) bg = '#ec4899'; // Very hot
                else if (intensity > 0.5) bg = '#06b6d4'; // Hot
                else if (intensity > 0.2) bg = '#0369a1'; // Medium
                else bg = '#bae6fd'; // Low (light blue for white bg)
              }

              ctx.fillStyle = bg;
              ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);

              ctx.strokeStyle = '#e5e7eb';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
            });
          });
        }
      }
    }

    const pngData = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngData;
    downloadLink.download = `${title.toLowerCase().replace(/ /g, '_')}_screenshot.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  };

  // 3. Print Card Content
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    
    const cardHtml = containerRef.current.innerHTML;
    
    // Convert dark mode classes to light mode for printing
    const printHtml = cardHtml
      .replace(/bg-\[\#171717\]/g, 'bg-white')
      .replace(/bg-\[\#121212\]/g, 'bg-gray-100')
      .replace(/border-\[\#2e2e2e\]/g, 'border-gray-300')
      .replace(/text-white/g, 'text-black')
      .replace(/text-gray-200/g, 'text-gray-900')
      .replace(/text-gray-300/g, 'text-gray-800')
      .replace(/text-gray-400/g, 'text-gray-600')
      .replace(/text-gray-500/g, 'text-gray-500')
      // Inline styles for heatmap colors (dark to light)
      .replace(/background-color: rgb\(18, 18, 18\)/g, 'background-color: #f3f4f6')
      .replace(/background-color: #121212/g, 'background-color: #f3f4f6')
      .replace(/background-color: rgb\(15, 23, 42\)/g, 'background-color: #bae6fd')
      .replace(/background-color: #0f172a/g, 'background-color: #bae6fd')
      // Legend gradient
      .replace(/from-\[\#0f172a\]/g, 'from-gray-200');
    
    const styleElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>${title} - Print View</title>
          ${styleElements}
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body { 
              background-color: #ffffff !important; 
              color: #000000 !important; 
              padding: 40px; 
              font-family: monospace; 
            }
            .no-print-actions { display: none !important; }
            .max-h-36, .overflow-y-auto, .custom-scrollbar {
              max-height: none !important;
              overflow: visible !important;
            }
          </style>
        </head>
        <body>
          <h2 class="text-lg font-bold border-b border-gray-300 text-black pb-3 mb-6">${title}</h2>
          ${printHtml}
        </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 800);
  };

  const CardContent = (
    <div ref={containerRef} className="flex-1 flex flex-col justify-between h-full bg-[#171717] p-4 rounded-xl border border-[#2e2e2e]">
      <div className="flex justify-between items-start mb-4">
        <div className="text-left">
          <h3 className="text-[13px] font-semibold text-gray-200">{title}</h3>
          {subdetails && <div className="mt-1.5">{subdetails}</div>}
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity no-print-actions">
          <button 
            onClick={handleDownloadData} 
            className="p-1 hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded transition-colors cursor-pointer" 
            title="Download CSV datasheet"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={handleScreenshot} 
            className="p-1 hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded transition-colors cursor-pointer" 
            title="Export PNG screenshot"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={handlePrint} 
            className="p-1 hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded transition-colors cursor-pointer" 
            title="Print view"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setIsExpanded(true)} 
            className="p-1 hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded transition-colors cursor-pointer" 
            title="Full screen view"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {children}
    </div>
  );

  return (
    <>
      <div className="flex flex-col justify-between text-left h-full min-h-[320px]">
        {CardContent}
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl w-[96vw] max-w-[96vw] h-[92vh] max-h-[92vh] p-6 sm:p-8 flex flex-col relative shadow-2xl overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2e2e2e]/60 no-print-actions">
              <div>
                <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wider">{title}</h2>
                {subdetails && <div className="mt-1">{subdetails}</div>}
              </div>
              <div className="flex items-center gap-3 mr-12">
                <button 
                  onClick={handleScreenshot}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffffff] text-[#121212] font-semibold text-xs rounded-lg hover:bg-gray-200 transition-all cursor-pointer shadow-lg"
                  title="Capture & Download PNG"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Download PNG</span>
                </button>
                <button 
                  onClick={handleDownloadData}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2e2e2e] border border-gray-700 text-gray-200 text-xs rounded-lg hover:bg-[#383838] transition-all cursor-pointer"
                  title="Download CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>CSV</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2e2e2e] border border-gray-700 text-gray-200 text-xs rounded-lg hover:bg-[#383838] transition-all cursor-pointer"
                  title="Print Card"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 p-2 bg-[#121212] border border-[#2e2e2e] text-gray-400 hover:text-white hover:border-gray-500 rounded-xl transition-all cursor-pointer z-10"
              title="Close Full Screen"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex-1 flex flex-col justify-between">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
