import React, { useState, useRef } from 'react';
import { Download, Camera, Printer, Maximize2, X } from 'lucide-react';

interface ChartCardWrapperProps {
  title: string;
  subdetails?: React.ReactNode;
  exportData: any;
  children: React.ReactNode;
}

export const ChartCardWrapper: React.FC<ChartCardWrapperProps> = ({
  title,
  subdetails,
  exportData,
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
          // primitive array (e.g. hourly array)
          return 'Index,Count\n' + data.map((val, idx) => `${idx},${val}`).join('\n');
        }
      } else if (typeof data === 'object' && data !== null) {
        const entries = Object.entries(data);
        return 'Metric,Value\n' + entries.map(([k, v]) => `"${k}",${v}`).join('\n');
      }
      return String(data);
    };

    const csvContent = convertToCSV(exportData);
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
    
    // Create a virtual canvas to draw chart in high-resolution (3x scale factor)
    const scaleFactor = 3;
    const canvas = document.createElement('canvas');
    canvas.width = 600 * scaleFactor;
    canvas.height = 320 * scaleFactor;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale canvas operations
    ctx.scale(scaleFactor, scaleFactor);

    // Draw background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, 600, 320);

    // Draw card border
    ctx.strokeStyle = '#2e2e2e';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, 598, 318);

    // Draw Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(title.toUpperCase(), 20, 30);

    // Draw watermark logo
    ctx.fillStyle = '#555555';
    ctx.font = '10px monospace';
    ctx.fillText('AI-Powered CDR Analyzer', 600 - 165, 320 - 15);

    // Check data and draw representation
    if (Array.isArray(exportData)) {
      if (exportData.length === 0) {
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText('No data available', 600 / 2 - 50, 320 / 2);
      } else {
        const first = exportData[0];
        
        // 2a. Primitive number array (e.g. hourly data)
        if (typeof first === 'number') {
          const list = exportData;
          const maxVal = Math.max(...list) || 1;
          const padL = 40;
          const padT = 70;
          const chartW = 600 - padL - 40;
          const chartH = 320 - padT - 50;

          list.forEach((val: number, hr: number) => {
            const w = chartW / list.length;
            const h = (val / maxVal) * chartH;
            const x = padL + hr * w + w * 0.1;
            const y = padT + chartH - h;

            ctx.fillStyle = '#3ecf8e';
            ctx.fillRect(x, y, w * 0.8, h);
            
            if (hr % 4 === 0) {
              ctx.fillStyle = '#888888';
              ctx.font = '8px monospace';
              ctx.fillText(`${hr}:00`, x, padT + chartH + 12);
            }
          });
        }
        // 2b. Line Chart (Timeline pattern)
        else if (first.date !== undefined && first.count !== undefined) {
          const points = exportData;
          const maxVal = Math.max(...points.map((p: any) => p.count)) || 1;
          const padL = 40;
          const padR = 40;
          const padT = 70;
          const padB = 50;
          const chartW = 600 - padL - padR;
          const chartH = 320 - padT - padB;

          // Draw axes
          ctx.strokeStyle = '#2e2e2e';
          ctx.beginPath();
          ctx.moveTo(padL, padT);
          ctx.lineTo(padL, padT + chartH);
          ctx.lineTo(padL + chartW, padT + chartH);
          ctx.stroke();

          // Draw line
          ctx.strokeStyle = '#3ecf8e';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          points.forEach((p: any, idx: number) => {
            const x = padL + (idx / (points.length - 1 || 1)) * chartW;
            const y = padT + chartH - (p.count / maxVal) * chartH;
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();

          // Draw circles
          ctx.fillStyle = '#3ecf8e';
          points.forEach((p: any, idx: number) => {
            const x = padL + (idx / (points.length - 1 || 1)) * chartW;
            const y = padT + chartH - (p.count / maxVal) * chartH;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
        // 2c. Monthly Bar Chart (Month, count, pct)
        else if (first.month !== undefined && first.count !== undefined) {
          const list = exportData;
          const maxVal = Math.max(...list.map((m: any) => m.count)) || 1;
          const padL = 50;
          const padT = 70;
          const chartW = 600 - padL - 40;
          const chartH = 320 - padT - 50;

          list.forEach((item: any, idx: number) => {
            const w = chartW / list.length;
            const h = (item.count / maxVal) * chartH;
            const x = padL + idx * w + w * 0.15;
            const y = padT + chartH - h;

            ctx.fillStyle = '#3ecf8e';
            ctx.fillRect(x, y, w * 0.7, h);

            ctx.fillStyle = '#888888';
            ctx.font = '8px monospace';
            ctx.fillText(item.month, x, padT + chartH + 12);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(String(item.count), x, y - 5);
          });
        }
        // 2d. Weekly/Duration Bar Chart (Name, count, pct)
        else if (first.name !== undefined && first.count !== undefined) {
          const list = exportData;
          const maxVal = Math.max(...list.map((d: any) => d.count)) || 1;
          const padL = 50;
          const padT = 70;
          const chartW = 600 - padL - 40;
          const chartH = 320 - padT - 50;

          list.forEach((item: any, idx: number) => {
            const w = chartW / list.length;
            const h = (item.count / maxVal) * chartH;
            const x = padL + idx * w + w * 0.15;
            const y = padT + chartH - h;

            ctx.fillStyle = item.color || '#3ecf8e';
            ctx.fillRect(x, y, w * 0.7, h);

            ctx.fillStyle = '#888888';
            ctx.font = '9px monospace';
            ctx.fillText(item.name, x, padT + chartH + 15);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(String(item.count), x, y - 5);
          });
        }
        // 2e. Horizontal Progress List (IMEI, Contacts, Locations)
        else {
          const list = exportData.slice(0, 6);
          const padT = 60;
          const rowH = 35;

          list.forEach((item: any, idx: number) => {
            const y = padT + idx * rowH;
            const label = item.number || item.address || item.imei || item.country || 'N/A';
            const count = item.count || 0;
            const pct = item.pct || '0';

            ctx.fillStyle = '#cccccc';
            ctx.font = '10px monospace';
            ctx.fillText(`${idx + 1}. ${label}`, 20, y + 10);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${count} (${pct}%)`, 600 - 150, y + 10);

            ctx.fillStyle = '#121212';
            ctx.fillRect(20, y + 16, 600 - 40, 5);

            ctx.fillStyle = title.includes('Location') ? '#8b5cf6' : '#3ecf8e';
            ctx.fillRect(20, y + 16, (parseFloat(pct) / 100) * (600 - 40), 5);
          });
        }
      }
    }
    // 3. Hourly Bar Pattern (Array of numbers)
    else if (Array.isArray(exportData) === false && typeof exportData === 'object' && exportData !== null) {
      if (exportData.incoming !== undefined && exportData.outgoing !== undefined) {
        // Call Type
        const t = exportData;
        const total = t.total || 1;
        const incPct = parseFloat(t.incomingPct || '0');
        const outPct = parseFloat(t.outgoingPct || '0');
        const smsPct = parseFloat(t.smsPct || '0');

        ctx.fillStyle = '#3ecf8e';
        ctx.fillText(`Incoming Calls: ${t.incoming} (${incPct}%)`, 30, 80);
        ctx.fillStyle = '#8b5cf6';
        ctx.fillText(`Outgoing Calls: ${t.outgoing} (${outPct}%)`, 30, 110);
        if (t.sms !== undefined) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillText(`SMS Activities: ${t.sms} (${smsPct}%)`, 30, 140);
        }

        // Draw donut
        ctx.strokeStyle = '#2e2e2e';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.arc(600 - 120, 110, 45, 0, 2 * Math.PI);
        ctx.stroke();

        let startAng = -Math.PI / 2;
        ctx.strokeStyle = '#3ecf8e';
        ctx.beginPath();
        ctx.arc(600 - 120, 110, 45, startAng, startAng + (incPct / 100) * 2 * Math.PI);
        ctx.stroke();
        startAng += (incPct / 100) * 2 * Math.PI;

        ctx.strokeStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(600 - 120, 110, 45, startAng, startAng + (outPct / 100) * 2 * Math.PI);
        ctx.stroke();
        startAng += (outPct / 100) * 2 * Math.PI;

        if (t.sms !== undefined && smsPct > 0) {
          ctx.strokeStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(600 - 120, 110, 45, startAng, startAng + (smsPct / 100) * 2 * Math.PI);
          ctx.stroke();
        }
      }
      else if (exportData.day !== undefined && exportData.night !== undefined) {
        // Day/Night
        const t = exportData;
        const dayPct = parseFloat(t.dayPct || '0');
        const nightPct = parseFloat(t.nightPct || '0');

        ctx.fillStyle = '#3ecf8e';
        ctx.fillText(`Day Calls: ${t.day} (${dayPct}%)`, 30, 90);
        ctx.fillStyle = '#8b5cf6';
        ctx.fillText(`Night Calls: ${t.night} (${nightPct}%)`, 30, 120);

        ctx.strokeStyle = '#2e2e2e';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.arc(600 - 120, 110, 45, 0, 2 * Math.PI);
        ctx.stroke();

        let startAng = -Math.PI / 2;
        ctx.strokeStyle = '#3ecf8e';
        ctx.beginPath();
        ctx.arc(600 - 120, 110, 45, startAng, startAng + (dayPct / 100) * 2 * Math.PI);
        ctx.stroke();
        startAng += (dayPct / 100) * 2 * Math.PI;

        ctx.strokeStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(600 - 120, 110, 45, startAng, startAng + (nightPct / 100) * 2 * Math.PI);
        ctx.stroke();
      }
      else if (exportData.calls !== undefined && exportData.sms !== undefined) {
        // Call/SMS Distribution
        const t = exportData;
        const callsPct = parseFloat(t.callsPct || '0');
        const smsPct = parseFloat(t.smsPct || '0');

        ctx.fillStyle = '#3ecf8e';
        ctx.fillText(`Voice Calls: ${t.calls} (${callsPct}%)`, 30, 90);
        ctx.fillStyle = '#8b5cf6';
        ctx.fillText(`SMS Activities: ${t.sms} (${smsPct}%)`, 30, 120);

        ctx.strokeStyle = '#2e2e2e';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.arc(600 - 120, 110, 45, 0, 2 * Math.PI);
        ctx.stroke();

        let startAng = -Math.PI / 2;
        ctx.strokeStyle = '#3ecf8e';
        ctx.beginPath();
        ctx.arc(600 - 120, 110, 45, startAng, startAng + (callsPct / 100) * 2 * Math.PI);
        ctx.stroke();
        startAng += (callsPct / 100) * 2 * Math.PI;

        ctx.strokeStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(600 - 120, 110, 45, startAng, startAng + (smsPct / 100) * 2 * Math.PI);
        ctx.stroke();
      }
    } 
    // Primitive hourly pattern array
    else if (Array.isArray(exportData)) {
      const list = exportData;
      const maxVal = Math.max(...list) || 1;
      const padL = 40;
      const padT = 70;
      const chartW = 600 - padL - 40;
      const chartH = 320 - padT - 50;

      list.forEach((val: number, hr: number) => {
        const w = chartW / list.length;
        const h = (val / maxVal) * chartH;
        const x = padL + hr * w;
        const y = padT + chartH - h;

        ctx.fillStyle = '#3ecf8e';
        ctx.fillRect(x, y, w * 0.7, h);
      });
    }

    // Trigger PNG image download
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
    
    // Dynamically clone all active stylesheets and script tags of the host application
    const styleElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
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
            table { width: 100%; border-collapse: collapse; border: 1px solid #cccccc; }
            th, td { padding: 8px; border: 1px solid #cccccc; text-align: left; color: #000000 !important; }
            th { background-color: #f3f4f6 !important; }
            div, span, h2, h3, strong, p {
              color: #000000 !important;
            }
            .text-white, .text-gray-100, .text-gray-200, .text-gray-300, .text-gray-400 {
              color: #000000 !important;
            }
          </style>
        </head>
        <body>
          <h2 class="text-lg font-bold border-b border-gray-350 pb-3 mb-6">${title}</h2>
          ${cardHtml}
          <script>
            // Wait for stylesheets to finish loading before printing
            setTimeout(() => {
              window.print();
              window.close();
            }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const CardContent = (
    <div ref={containerRef} className="flex-1 flex flex-col justify-between h-full">
      {/* Header section inside wrapper */}
      <div className="flex justify-between items-start mb-2">
        <div className="text-left">
          <h3 className="text-xs font-semibold text-gray-100 uppercase tracking-wider">{title}</h3>
          {subdetails && <div className="mt-1.5">{subdetails}</div>}
        </div>
        
        {/* Actions Button panel */}
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
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left min-h-[320px]">
        {CardContent}
      </div>

      {/* Expand / Maximize Modal overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl w-[96vw] max-w-[96vw] h-[92vh] max-h-[92vh] p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl overflow-y-auto custom-scrollbar">
            {/* Close modal action button */}
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 p-2 bg-[#121212] border border-[#2e2e2e] text-gray-400 hover:text-white hover:border-gray-500 rounded-xl transition-all cursor-pointer z-10"
              title="Close Full Screen"
            >
              <X className="h-4 w-4" />
            </button>
            
            {CardContent}
          </div>
        </div>
      )}
    </>
  );
};
