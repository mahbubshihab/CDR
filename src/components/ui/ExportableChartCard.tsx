import React, { useState, useRef, useId } from 'react';
import { Download, Camera, Printer, Maximize2, X } from 'lucide-react';

export interface ExportableChartCardProps {
  id?: string;
  title: string;
  subdetails?: React.ReactNode;
  exportData?: any; // If provided, shows CSV download button
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const ExportableChartCard: React.FC<ExportableChartCardProps> = ({
  id: providedId,
  title,
  subdetails,
  exportData,
  children,
  className = "",
  contentClassName = "min-h-[250px]"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const generatedId = useId().replace(/:/g, '');
  const id = providedId || `chart-${generatedId}`;

  // 1. Download Data as CSV
  const handleDownloadData = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!exportData) return;

    const convertToCSV = (data: any): string => {
      if (Array.isArray(data)) {
        if (data.length === 0) return '';
        const first = data[0];
        
        // Array of arrays (e.g., heatmaps)
        if (Array.isArray(first)) {
          return data.map(row => row.join(',')).join('\n');
        } 
        // Array of objects
        else if (typeof first === 'object' && first !== null) {
          const headers = Object.keys(first);
          const rows = data.map(row => 
            headers.map(h => {
              const val = row[h];
              // check if row contains an array (like hourly data in MFC)
              if (Array.isArray(val)) {
                return `"${val.join(',')}"`;
              }
              return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : String(val ?? '');
            }).join(',')
          );
          return [headers.join(','), ...rows].join('\n');
        } 
        // Array of primitives
        else {
          return 'Index,Value\n' + data.map((val, idx) => `${idx},${val}`).join('\n');
        }
      } 
      // Single object
      else if (typeof data === 'object' && data !== null) {
        const entries = Object.entries(data);
        return 'Metric,Value\n' + entries.map(([k, v]) => {
            const valStr = Array.isArray(v) ? `"${v.join(',')}"` : v;
            return `"${k}",${valStr}`;
        }).join('\n');
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
  const handleScreenshot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // We target the current container, which is either the normal card or the expanded modal card.
    // However, if we're in expanded mode, we want to capture the expanded content.
    const targetEl = document.getElementById(isExpanded ? `${id}-expanded` : id);
    if (!targetEl) return;

    try {
      // Temporarily hide the action buttons during screenshot
      const actionsEl = targetEl.querySelector('.no-print-actions') as HTMLElement;
      if (actionsEl) actionsEl.style.display = 'none';

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(targetEl, { 
        backgroundColor: '#1e293b', 
        scale: 2 // High resolution
      });
      
      if (actionsEl) actionsEl.style.display = 'flex'; // Restore actions

      const img = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = img;
      a.download = `${title.toLowerCase().replace(/ /g, '_')}_screenshot.png`;
      a.click();
    } catch (err) {
      console.error('Failed to take screenshot', err);
    }
  };

  // 3. Print Card Content
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetEl = document.getElementById(isExpanded ? `${id}-expanded` : id);
    if (!targetEl) return;
    
    const cardHtml = targetEl.innerHTML;
    
    // Convert dark mode classes to light mode for printing
    const printHtml = cardHtml
      .replace(/bg-\[#[a-f0-9]+\]/gi, 'bg-white')
      .replace(/border-\[#[a-f0-9]+\]/gi, 'border-gray-300')
      .replace(/text-white/gi, 'text-black')
      .replace(/text-gray-[1234]00/gi, 'text-gray-900')
      .replace(/text-gray-500/gi, 'text-gray-500');
    
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
              font-family: sans-serif; 
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

  const ActionsPanel = ({ isModal = false }: { isModal?: boolean }) => (
    <div className={`flex items-center gap-1.5 shrink-0 opacity-50 hover:opacity-100 transition-opacity no-print-actions ${isModal ? 'mr-12 opacity-100' : ''}`}>
      {exportData && (
        <button 
          onClick={handleDownloadData} 
          className={`hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded transition-colors cursor-pointer ${isModal ? 'flex items-center gap-1.5 px-3 py-1.5 bg-[#2e2e2e] border border-gray-700 text-xs shadow-sm' : 'p-1'}`}
          title="Download CSV datasheet"
        >
          <Download className="h-3.5 w-3.5" />
          {isModal && <span>CSV</span>}
        </button>
      )}
      <button 
        onClick={handleScreenshot} 
        className={`hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded transition-colors cursor-pointer ${isModal ? 'flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-gray-200 border border-transparent text-xs font-semibold shadow-sm' : 'p-1'}`}
        title="Export PNG screenshot"
      >
        <Camera className="h-3.5 w-3.5" />
        {isModal && <span>PNG</span>}
      </button>
      <button 
        onClick={handlePrint} 
        className={`hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded transition-colors cursor-pointer ${isModal ? 'flex items-center gap-1.5 px-3 py-1.5 bg-[#2e2e2e] border border-gray-700 text-xs shadow-sm' : 'p-1'}`}
        title="Print view"
      >
        <Printer className="h-3.5 w-3.5" />
        {isModal && <span>Print</span>}
      </button>
      {!isModal && (
        <button 
          onClick={() => setIsExpanded(true)} 
          className="p-1 hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded transition-colors cursor-pointer" 
          title="Full screen view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Standard Card View */}
      <div id={id} className={`bg-[#1e293b] border border-[#334155] rounded-xl flex flex-col overflow-hidden text-left ${className}`}>
        <div className="flex justify-between items-center px-4 py-3 border-b border-[#334155] bg-[#1e293b]">
          <div className="text-left">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{title}</h3>
            {subdetails && <div className="mt-1">{subdetails}</div>}
          </div>
          <ActionsPanel />
        </div>
        <div className={`p-4 flex-1 relative bg-[#1e293b] ${contentClassName}`}>
          {children}
        </div>
      </div>

      {/* Expanded Modal View */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] bg-[#0b1121]/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div id={`${id}-expanded`} className="bg-[#1e293b] border border-[#334155] rounded-2xl w-[96vw] max-w-[96vw] h-[92vh] max-h-[92vh] flex flex-col relative shadow-2xl overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center p-6 border-b border-[#334155]">
              <div>
                <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wider">{title}</h2>
                {subdetails && <div className="mt-1">{subdetails}</div>}
              </div>
              <ActionsPanel isModal={true} />
            </div>

            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 p-2 bg-[#0f172a] border border-[#334155] text-gray-400 hover:text-white hover:border-gray-500 rounded-xl transition-all cursor-pointer z-10 no-print-actions"
              title="Close Full Screen"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className={`flex-1 p-6 flex flex-col relative ${contentClassName || ''}`}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
