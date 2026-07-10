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

  // 1. Download Data as JSON
  const handleDownloadData = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${title.toLowerCase().replace(/ /g, '_')}_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Export Card View as SVG Vector Screenshot
  const handleScreenshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    
    const svgElement = containerRef.current.querySelector('svg');
    if (svgElement) {
      // Serialize vector SVG
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const trigger = document.createElement('a');
      trigger.href = url;
      trigger.download = `${title.toLowerCase().replace(/ /g, '_')}_chart.svg`;
      document.body.appendChild(trigger);
      trigger.click();
      trigger.remove();
      URL.revokeObjectURL(url);
    } else {
      // Fallback: download tabular/text log if no SVG is present
      const textStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", textStr);
      downloadAnchor.setAttribute("download", `${title.toLowerCase().replace(/ /g, '_')}_screenshot_log.txt`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  // 3. Print Card Content
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    
    const cardHtml = containerRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - Print View</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { background-color: #121212; color: #ffffff; padding: 40px; font-family: monospace; }
            .no-print-actions { display: none !important; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #2e2e2e; }
            th, td { padding: 8px; border: 1px solid #2e2e2e; text-align: left; }
            th { background-color: #171717; }
          </style>
        </head>
        <body>
          <h2 class="text-lg font-bold border-b border-gray-700 pb-3 mb-6">${title}</h2>
          ${cardHtml}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
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
            title="Download JSON data"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={handleScreenshot} 
            className="p-1 hover:bg-[#2e2e2e] text-gray-300 hover:text-white rounded transition-colors cursor-pointer" 
            title="Export chart screenshot"
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
        <div className="fixed inset-0 z-50 bg-[#121212]/90 backdrop-blur-md flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl w-full max-w-4xl p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl min-h-[500px]">
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
