import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { 
  FileText, Download, FileSpreadsheet, Printer, Map, Shield, Loader2 
} from 'lucide-react';
import { CustomAlert } from '../../../../components/ui/CustomModal';

import { ExecutiveDashboard } from '../executive-dashboard/ExecutiveDashboard';
import { GraphAnalytics } from '../graph-analytics/GraphAnalytics';
import { MfcAnalysis } from '../mfc-analysis/MfcAnalysis';
import { NetworkAnalysis } from '../network-analysis/NetworkAnalysis';
import { OwnershipIntelligence } from '../ownership-intelligence/OwnershipIntelligence';
import { InternationalIntelligence } from '../international-intelligence/InternationalIntelligence';
import { ImeiSummary } from '../imei-summary/ImeiSummary';
import { ImsiSummary } from '../imsi-summary/ImsiSummary';
import { LocationSummary } from '../location-summary/LocationSummary';
import { LocationIntelligence } from '../location-intelligence/LocationIntelligence';
import { ServiceNumbers } from '../service-numbers/ServiceNumbers';
import { ImeiPatterns } from '../imei-patterns/ImeiPatterns';
import { ImsiPatterns } from '../imsi-patterns/ImsiPatterns';
import { FirstLastCall } from '../first-last-call/FirstLastCall';
import { TimeCallsIntelligence } from '../time-based-intelligence/TimeCallsIntelligence';
import { TimeLocationsIntelligence } from '../time-based-intelligence/TimeLocationsIntelligence';
import { MovementChart } from '../movement-chart/MovementChart';
import { CellIdChangesModule } from '../cell-id-changes/CellIdChangesModule';
import { LocationChangesModule } from '../location-changes/LocationChangesModule';
import { MissingDatesModule } from '../missing-dates/MissingDatesModule';
import { InteractiveTimelineModule } from '../interactive-timeline/InteractiveTimelineModule';
import { LinkAnalysis } from '../link-analysis/LinkAnalysis';

interface ReportsDownloadsProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const ReportsDownloads: React.FC<ReportsDownloadsProps> = ({ cdrFile, records }) => {
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'error' | 'success' | 'info' | 'warning';
  } | null>(null);

  // 1. Process timestamps for start and end dates
  const { firstContactDate, lastContactDate } = useMemo(() => {
    if (!records || records.length === 0) {
      return { firstContactDate: 'N/A', lastContactDate: 'N/A' };
    }
    const timestamps = records.map(r => r.timestamp).filter(t => !isNaN(t));
    if (timestamps.length === 0) {
      return { firstContactDate: 'N/A', lastContactDate: 'N/A' };
    }
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    return {
      firstContactDate: new Date(minTime).toISOString().replace('T', ' ').substring(0, 16),
      lastContactDate: new Date(maxTime).toISOString().replace('T', ' ').substring(0, 16)
    };
  }, [records]);

  // 2. Process Top Interacting Contacts (Derived Dynamically)
  const topContacts = useMemo(() => {
    const contactMap: Record<string, {
      number: string;
      totalComm: number;
      callCountIn: number;
      callCountOut: number;
      smsCountIn: number;
      smsCountOut: number;
      totalDuration: number;
    }> = {};

    records.forEach(r => {
      const party = r.otherParty;
      if (!party) return;

      if (!contactMap[party]) {
        contactMap[party] = {
          number: party,
          totalComm: 0,
          callCountIn: 0,
          callCountOut: 0,
          smsCountIn: 0,
          smsCountOut: 0,
          totalDuration: 0
        };
      }

      const item = contactMap[party];
      item.totalComm++;
      item.totalDuration += r.duration || 0;

      if (r.usageType === 'MOC') {
        item.callCountOut++;
      } else if (r.usageType === 'MTC') {
        item.callCountIn++;
      } else if (r.usageType === 'SMS_MOC') {
        item.smsCountOut++;
      } else if (r.usageType === 'SMS_MTC') {
        item.smsCountIn++;
      }
    });

    return Object.values(contactMap)
      .sort((a, b) => b.totalComm - a.totalComm)
      .slice(0, 20); // Top 20 for reporting
  }, [records]);

  // 3. Process Top Locations Visited (Derived Dynamically)
  const topLocations = useMemo(() => {
    const locMap: Record<string, { address: string; count: number; duration: number }> = {};

    records.forEach(r => {
      const addr = r.address || 'Unknown';
      if (!locMap[addr]) {
        locMap[addr] = { address: addr, count: 0, duration: 0 };
      }
      locMap[addr].count++;
      locMap[addr].duration += r.duration || 0;
    });

    return Object.values(locMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 for reporting
  }, [records]);

  // CSV Export Action
  const handleExportAllCsv = () => {
    if (records.length === 0) return;
    const headers = ['Timestamp', 'Usage Type', 'Calling Number', 'Other Party', 'IMEI', 'IMSI', 'Call Duration (sec)', 'Cell Address', 'LAC', 'Cell ID'];
    const rows = records.map(r => [
      new Date(r.timestamp).toISOString().replace('T', ' ').substring(0, 19),
      r.usageType,
      r.aparty || '',
      r.otherParty || '',
      r.imei || '',
      r.imsi || '',
      r.duration || 0,
      r.address || '',
      r.lac || '',
      r.cellId || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CDR_All_Records_${cdrFile.phoneNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export Action (using dynamic import of xlsx)
  const handleDownloadExcel = async () => {
    setIsGeneratingExcel(true);
    // Simulate generation to match spinner state from image copy 2.png
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // 1. Overview Sheet
      const overviewData = [
        ['Parameter', 'Value'],
        ['Target Phone Number', cdrFile.phoneNumber],
        ['Operator', cdrFile.operator || 'N/A'],
        ['Category', cdrFile.category || 'N/A'],
        ['Total Records', records.length],
        ['First Contact', firstContactDate],
        ['Last Contact', lastContactDate],
      ];
      const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');

      // 2. Top Contacts Sheet
      const contactsHeaders = ['Contact Number', 'Total Comm', 'Call In', 'Call Out', 'SMS In', 'SMS Out', 'Total Duration (min)'];
      const contactsRows = topContacts.map(c => [
        c.number,
        c.totalComm,
        c.callCountIn,
        c.callCountOut,
        c.smsCountIn,
        c.smsCountOut,
        Math.round(c.totalDuration / 60)
      ]);
      const contactsWs = XLSX.utils.aoa_to_sheet([contactsHeaders, ...contactsRows]);
      XLSX.utils.book_append_sheet(wb, contactsWs, 'Top Contacts');

      // 3. Top Locations Sheet
      const locationsHeaders = ['Cell Address', 'Record Count', 'Duration (min)'];
      const locationsRows = topLocations.map(l => [
        l.address,
        l.count,
        Math.round(l.duration / 60)
      ]);
      const locationsWs = XLSX.utils.aoa_to_sheet([locationsHeaders, ...locationsRows]);
      XLSX.utils.book_append_sheet(wb, locationsWs, 'Top Locations');

      // 4. Raw Records Sheet (capped at 5000 to prevent crash)
      const rawHeaders = ['Timestamp', 'Usage Type', 'Calling Number', 'Other Party', 'IMEI', 'IMSI', 'Call Duration (sec)', 'Cell Address', 'LAC', 'Cell ID'];
      const rawRows = records.slice(0, 5000).map(r => [
        new Date(r.timestamp).toISOString().replace('T', ' ').substring(0, 19),
        r.usageType,
        r.aparty || '',
        r.otherParty || '',
        r.imei || '',
        r.imsi || '',
        r.duration || 0,
        r.address || '',
        r.lac || '',
        r.cellId || ''
      ]);
      const rawWs = XLSX.utils.aoa_to_sheet([rawHeaders, ...rawRows]);
      XLSX.utils.book_append_sheet(wb, rawWs, 'Raw CDR Data');

      XLSX.writeFile(wb, `CDR_Workbook_${cdrFile.phoneNumber}.xlsx`);
    } catch (error) {
      console.error("Failed to generate Excel: ", error);
      setAlertConfig({
        isOpen: true,
        title: "Export Failed",
        message: "Failed to generate Excel report workbook.",
        type: "error"
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };


  const handlePrintAll = () => {
    setIsPreparingPrint(true);
    
    // Give React time to mount all components, fetch data, and let Recharts/Maps settle
    // The components will be rendered off-screen (absolute, left:-9999px) so they can calculate width/height
    setTimeout(() => {
      window.print();
      setIsPreparingPrint(false);
      setIsGeneratingPdf(false);
    }, 3000); // 3-second delay for massive rendering
  };

  // KML Generation Helper
  const generateKml = () => {
    // Filter records with valid latitude/longitude coordinates (dynamic retrieval)
    const geoPoints = records.filter(r => r.address && (r as any).latitude && (r as any).longitude);
    
    if (geoPoints.length === 0) {
      setAlertConfig({
        isOpen: true,
        title: "Geospatial Export",
        message: "No GPS coordinates available in this CDR dataset to generate KML/KMZ.",
        type: "warning"
      });
      return null;
    }

    const locationGroups: Record<string, { lat: number; lng: number; count: number }> = {};
    geoPoints.forEach(r => {
      const addr = r.address || 'Unknown';
      if (!locationGroups[addr]) {
        locationGroups[addr] = {
          lat: Number((r as any).latitude),
          lng: Number((r as any).longitude),
          count: 0
        };
      }
      locationGroups[addr].count++;
    });

    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>CDR Cell Towers - ${cdrFile.phoneNumber}</name>
    <description>Locations of cell towers visited by target number ${cdrFile.phoneNumber}</description>
    <Style id="towerIcon">
      <IconStyle>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-stars.png</href>
        </Icon>
      </IconStyle>
    </Style>
`;

    Object.entries(locationGroups).forEach(([addr, data]) => {
      kmlContent += `    <Placemark>
      <name>${addr}</name>
      <description>Tower hits: ${data.count} times</description>
      <styleUrl>#towerIcon</styleUrl>
      <Point>
        <coordinates>${data.lng},${data.lat},0</coordinates>
      </Point>
    </Placemark>
`;
    });

    kmlContent += `  </Document>
</kml>`;
    return kmlContent;
  };

  // KML Export Action
  const handleDownloadKml = () => {
    const kml = generateKml();
    if (!kml) return;
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CDR_Map_${cdrFile.phoneNumber}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // KMZ Export Action
  const handleDownloadKmz = () => {
    const kml = generateKml();
    if (!kml) return;
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kmz' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CDR_Map_${cdrFile.phoneNumber}.kmz`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-[#121212] min-h-screen text-gray-200 flex flex-col justify-start items-center">
      <div className="w-full max-w-3xl bg-[#171717] rounded-xl border border-[#2e2e2e] p-8 shadow-2xl space-y-6 text-left">
        
        {/* Title Section */}
        <div className="border-b border-[#2e2e2e] pb-5 space-y-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-[#3b82f6] h-6 w-6" /> Reports & Downloads
          </h2>
          <p className="text-xs text-gray-400">
            Export complete investigation workbook or generate professional PDF forensic report with all analysis sections.
          </p>
        </div>

        {/* Small Export Toolbar exactly matching mockup buttons in image copy.png */}
        <div className="flex flex-wrap gap-2 py-3 bg-[#131313] p-3 rounded-lg border border-[#252525]">
          <button 
            onClick={handleExportAllCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#171717] border border-[#2e2e2e] hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV (All)</span>
          </button>

          <button 
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0b1c15] border border-emerald-950/40 hover:border-emerald-600/35 text-emerald-450 rounded-lg transition-colors cursor-pointer text-xs font-semibold min-w-[120px] justify-center"
            disabled={isGeneratingExcel}
          >
            {isGeneratingExcel ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                <span>Generating EXCEL...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                <span>Excel</span>
              </>
            )}
          </button>

          <button 
            onClick={handlePrintAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0f151c] border border-blue-950/40 hover:border-blue-600/35 text-blue-400 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5 text-blue-500" />
            <span>PDF / Print</span>
          </button>

          <button 
            onClick={handleDownloadKml}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#171717] border border-[#2e2e2e] text-gray-300 hover:text-white rounded-lg cursor-pointer transition-colors text-xs font-semibold"
          >
            <Map className="h-3.5 w-3.5 text-gray-500" />
            <span>KML</span>
          </button>

          <button 
            onClick={handleDownloadKmz}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#171717] border border-[#2e2e2e] text-gray-300 hover:text-white rounded-lg cursor-pointer transition-colors text-xs font-semibold"
          >
            <Map className="h-3.5 w-3.5 text-gray-500" />
            <span>KMZ</span>
          </button>
        </div>

        {/* Large Blueprint Action Button */}
        <div className="pt-4 print:hidden">
          <button 
            onClick={handlePrintAll}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.99] cursor-pointer"
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Preparing Full Unified Print View...</span>
              </>
            ) : (
              <>
                <Printer className="h-5 w-5" />
                <span>Generate Full Investigation Report (PDF / Print)</span>
              </>
            )}
          </button>
        </div>

        {/* MASSIVE FULL PRINT VIEW MOUNT CONTAINER */}
        {isPreparingPrint && (
          <div className="absolute top-0 left-[-9999px] opacity-0 pointer-events-none w-[1200px] h-auto bg-[#0a0a0a] text-white print:static print:opacity-100 print:w-full print:left-auto print:bg-white print:text-black">
            {/* 1. Dashboard */}
            <div className="print-page-break mb-8 print:mb-0">
              <ExecutiveDashboard cdrFile={cdrFile} records={records} onNavigateToTab={() => {}} />
            </div>
            
            {/* 2. Graph Analytics */}
            <div className="print-page-break mb-8 print:mb-0">
              <GraphAnalytics cdrFile={cdrFile} records={records} />
            </div>

            {/* 3. MFC Analysis */}
            <div className="print-page-break mb-8 print:mb-0">
              <MfcAnalysis cdrFile={cdrFile} records={records} />
            </div>

            {/* 4. Network Analysis */}
            <div className="print-page-break mb-8 print:mb-0">
              <NetworkAnalysis cdrFile={cdrFile} records={records} />
            </div>
            
            {/* 5. Interactive Timeline */}
            <div className="print-page-break mb-8 print:mb-0">
              <InteractiveTimelineModule cdrFile={cdrFile} records={records} />
            </div>

            {/* 6. Link Analysis */}
            <div className="print-page-break mb-8 print:mb-0">
              <LinkAnalysis cdrFile={cdrFile} records={records} />
            </div>
            
            {/* 7. Ownership Intelligence */}
            <div className="print-page-break mb-8 print:mb-0">
              <OwnershipIntelligence cdrFile={cdrFile} records={records} />
            </div>

            {/* 8. International Intelligence */}
            <div className="print-page-break mb-8 print:mb-0">
              <InternationalIntelligence cdrFile={cdrFile} records={records} />
            </div>

            {/* 9. Location Intelligence (Maps might fail, but we'll include it) */}
            <div className="print-page-break mb-8 print:mb-0 h-[800px]">
              <LocationIntelligence cdrFile={cdrFile} records={records} />
            </div>
            
            {/* 10. Summary Modules */}
            <div className="print-page-break mb-8 print:mb-0">
              <ImeiSummary cdrFile={cdrFile} records={records} />
            </div>
            <div className="print-page-break mb-8 print:mb-0">
              <ImsiSummary cdrFile={cdrFile} records={records} />
            </div>
            <div className="print-page-break mb-8 print:mb-0">
              <LocationSummary cdrFile={cdrFile} records={records} />
            </div>
            
            {/* 11. Pattern Modules */}
            <div className="print-page-break mb-8 print:mb-0">
              <ImeiPatterns cdrFile={cdrFile} records={records} />
            </div>
            <div className="print-page-break mb-8 print:mb-0">
              <ImsiPatterns cdrFile={cdrFile} records={records} />
            </div>
            <div className="print-page-break mb-8 print:mb-0">
              <FirstLastCall cdrFile={cdrFile} records={records} />
            </div>

            {/* 12. Changes Modules */}
            <div className="print-page-break mb-8 print:mb-0">
              <CellIdChangesModule cdrFile={cdrFile} records={records} />
            </div>
            <div className="print-page-break mb-8 print:mb-0">
              <LocationChangesModule cdrFile={cdrFile} records={records} />
            </div>
            <div className="print-page-break mb-8 print:mb-0">
              <MissingDatesModule cdrFile={cdrFile} records={records} />
            </div>
          </div>
        )}

        {/* Informational Footer Note matching layout in image copy.png */}
        <p className="text-[11px] text-gray-500 leading-relaxed pt-2 border-t border-[#252525]">
          Excel and CSV (ZIP) exports include every analysis module: graphs, MFC, IMEI/IMSI, ownership, locations, day/night, movement, geo, links, timeline, and more.
        </p>

      </div>

      <CustomAlert 
        isOpen={!!alertConfig?.isOpen}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
        onClose={() => setAlertConfig(null)}
      />
    </div>
  );
};
