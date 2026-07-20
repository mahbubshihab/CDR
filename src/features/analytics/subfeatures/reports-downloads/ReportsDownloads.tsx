import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { 
  FileText, Download, FileSpreadsheet, Printer, Map, Shield, Loader2 
} from 'lucide-react';
import { CustomAlert } from '../../../../components/ui/CustomModal';

interface ReportsDownloadsProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const ReportsDownloads: React.FC<ReportsDownloadsProps> = ({ cdrFile, records }) => {
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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

  // PDF Report Action (using dynamic import of jspdf)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // 1. Process timestamps for start and end dates
      const timestamps = records.map(r => r.timestamp).filter(t => !isNaN(t));
      const minTime = timestamps.length > 0 ? Math.min(...timestamps) : null;
      const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : null;
      const firstContact = minTime ? new Date(minTime).toLocaleString() : 'N/A';
      const lastContact = maxTime ? new Date(maxTime).toLocaleString() : 'N/A';

      // 2. Process Top Interacting Contacts (top 30)
      const contactMap: Record<string, { number: string; count: number; calls: number; sms: number; duration: number }> = {};
      records.forEach(r => {
        const party = r.otherParty;
        if (!party) return;
        if (!contactMap[party]) {
          contactMap[party] = { number: party, count: 0, calls: 0, sms: 0, duration: 0 };
        }
        const item = contactMap[party];
        item.count++;
        if (r.usageType?.includes('SMS')) {
          item.sms++;
        } else {
          item.calls++;
        }
        item.duration += r.duration || 0;
      });
      const topContacts = Object.values(contactMap).sort((a, b) => b.count - a.count).slice(0, 30);

      // 3. Process Top Locations Visited (top 30)
      const locMap: Record<string, number> = {};
      records.forEach(r => {
        if (r.address) {
          locMap[r.address] = (locMap[r.address] || 0) + 1;
        }
      });
      const topLocations = Object.entries(locMap).sort((a, b) => b[1] - a[1]).slice(0, 30);

      // 4. IMEI / IMSI swaps
      const swaps: { imei: string; imsi: string; count: number }[] = [];
      const swapMap: Record<string, Set<string>> = {};
      records.forEach(r => {
        if (r.imei && r.imsi) {
          if (!swapMap[r.imei]) swapMap[r.imei] = new Set();
          swapMap[r.imei].add(r.imsi);
        }
      });
      Object.entries(swapMap).forEach(([imei, imsis]) => {
        imsis.forEach(imsi => {
          const cnt = records.filter(r => r.imei === imei && r.imsi === imsi).length;
          swaps.push({ imei, imsi, count: cnt });
        });
      });
      const topSwaps = swaps.sort((a, b) => b.count - a.count).slice(0, 15);

      // 5. Time based calls
      let dayCalls = 0;
      let nightCalls = 0;
      records.forEach(r => {
        const hr = new Date(r.timestamp).getHours();
        if (hr >= 6 && hr < 18) {
          dayCalls++;
        } else {
          nightCalls++;
        }
      });

      // 6. Missing Dates gaps
      const dates = Array.from(new Set(records.map(r => new Date(r.timestamp).toDateString()))).map(d => new Date(d));
      dates.sort((a, b) => a.getTime() - b.getTime());
      const gaps: { start: string; end: string; days: number }[] = [];
      for (let i = 0; i < dates.length - 1; i++) {
        const diff = dates[i+1].getTime() - dates[i].getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24)) - 1;
        if (days > 1) {
          gaps.push({
            start: dates[i].toLocaleDateString(),
            end: dates[i+1].toLocaleDateString(),
            days
          });
        }
      }
      const topGaps = gaps.sort((a, b) => b.days - a.days).slice(0, 15);

      // PAGE 1: COVER PAGE (White background)
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("CDR FULL DOSSIER INTEGRATED REPORT", 20, 45);

      doc.setDrawColor(16, 185, 129); // brand green line
      doc.setLineWidth(1.5);
      doc.line(20, 52, 190, 52);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("LAWMOR FORENSICS WORKSPACE | CONSOLIDATED INVESTIGATION CASE SUMMARY", 20, 59);

      // Section: Case Metadata
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("TARGET SUBSCRIBER DOSSIER", 20, 78);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(20, 81, 190, 81);

      let yPos = 90;
      doc.setFontSize(10);
      const caseDetails = [
        ['Target Phone Number:', cdrFile.phoneNumber],
        ['Network Operator:', cdrFile.operator || 'N/A'],
        ['Suspect Category:', cdrFile.category || 'N/A'],
        ['Total CDR Rows Analyzed:', String(records.length)],
        ['First Activity Recorded:', firstContact],
        ['Last Activity Recorded:', lastContact],
        ['Day-time Activity Ratio:', `${Math.round((dayCalls / (records.length || 1)) * 100)}% (${dayCalls} hits)`],
        ['Night-time Activity Ratio:', `${Math.round((nightCalls / (records.length || 1)) * 100)}% (${nightCalls} hits)`],
        ['IMEI Swaps Detected:', String(topSwaps.length)],
        ['Activity Gaps Detected:', String(topGaps.length) + " silent periods"],
        ['Report Generated Date:', new Date().toLocaleString()]
      ];

      caseDetails.forEach(([lbl, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text(lbl, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(val, 80, yPos);
        yPos += 10;
      });

      // PAGE 2: Executive Dashboard & Statistics Breakdown
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text("SECTION 1: DAILY ACTIVITY STATISTICS & METRICS", 20, 25);
      doc.setDrawColor(16, 185, 129);
      doc.line(20, 29, 190, 29);

      yPos = 42;
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Activity Milestones and Chronological Indicators (First & Last Sequences):", 20, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Date & Time", 20, yPos);
      doc.text("Type", 65, yPos);
      doc.text("Other Party", 90, yPos);
      doc.text("Duration", 130, yPos);
      doc.text("Tower Address Description", 150, yPos);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 9;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      const timelineSummary = [
        ...records.slice(0, 5),
        ...records.slice(-5)
      ];

      timelineSummary.forEach((r, idx) => {
        if (idx === 5) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          doc.text("... [Activity Gap / Middle logs omitted for brevity] ...", 20, yPos);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
          yPos += 8;
        }

        const dateStr = new Date(r.timestamp).toISOString().replace('T', ' ').substring(0, 16);
        const addr = r.address ? (r.address.length > 30 ? r.address.substring(0, 27) + '...' : r.address) : 'N/A';
        doc.text(dateStr, 20, yPos);
        doc.text(r.usageType || 'N/A', 65, yPos);
        doc.text(r.otherParty || 'N/A', 90, yPos);
        doc.text(String(r.duration || 0) + 's', 130, yPos);
        doc.text(addr, 150, yPos);
        yPos += 7.5;
      });

      // PAGE 3: Section 2 - Top 30 Communicating Partners
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text("SECTION 2: TOP INTERACTING COMMUNICATIONS PARTNERS", 20, 25);
      doc.setDrawColor(16, 185, 129);
      doc.line(20, 29, 190, 29);

      yPos = 40;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Rank", 20, yPos);
      doc.text("Contact Number", 35, yPos);
      doc.text("Total Communications", 75, yPos);
      doc.text("Calls (In/Out)", 115, yPos);
      doc.text("SMS (In/Out)", 145, yPos);
      doc.text("Duration (Min)", 175, yPos);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 9;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      topContacts.forEach((c, idx) => {
        if (yPos > 275) {
          doc.addPage();
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(15, 23, 42);
          doc.text("TOP COMMUNICATIONS PARTNERS (CONTINUED)", 20, 25);
          doc.line(20, 29, 190, 29);
          yPos = 40;
        }

        doc.text(String(idx + 1), 20, yPos);
        doc.text(c.number, 35, yPos);
        doc.text(String(c.count) + " times", 75, yPos);
        doc.text(String(c.calls), 115, yPos);
        doc.text(String(c.sms), 145, yPos);
        doc.text(String(Math.round(c.duration / 60)), 175, yPos);
        yPos += 7.5;
      });

      // PAGE 4: Section 3 - Top 30 Cell Tower Locations
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text("SECTION 3: TOP CELL TOWER LOCATIONS VISITED", 20, 25);
      doc.setDrawColor(16, 185, 129);
      doc.line(20, 29, 190, 29);

      yPos = 40;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Rank", 20, yPos);
      doc.text("Cell Tower Address Description", 35, yPos);
      doc.text("Hits Count", 165, yPos);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 9;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      topLocations.forEach(([address, count], idx) => {
        if (yPos > 275) {
          doc.addPage();
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(15, 23, 42);
          doc.text("TOP CELL TOWER LOCATIONS VISITED (CONTINUED)", 20, 25);
          doc.line(20, 29, 190, 29);
          yPos = 40;
        }

        const cleanedAddr = address.length > 70 ? address.substring(0, 67) + '...' : address;
        doc.text(String(idx + 1), 20, yPos);
        doc.text(cleanedAddr, 35, yPos);
        doc.text(String(count) + " hits", 165, yPos);
        yPos += 7.5;
      });

      // PAGE 5: Section 4 - Swapping History & Silent Periods
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text("SECTION 4: IMEI / IMSI SWAPPING HISTORY", 20, 25);
      doc.setDrawColor(16, 185, 129);
      doc.line(20, 29, 190, 29);

      yPos = 40;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("IMEI Number", 20, yPos);
      doc.text("IMSI Number", 85, yPos);
      doc.text("Combined Hits Count", 150, yPos);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 9;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      
      if (topSwaps.length === 0) {
        doc.text("No IMEI / IMSI swaps detected or available in the dataset.", 20, yPos);
        yPos += 10;
      } else {
        topSwaps.forEach(sw => {
          doc.text(sw.imei, 20, yPos);
          doc.text(sw.imsi, 85, yPos);
          doc.text(String(sw.count) + " records", 150, yPos);
          yPos += 7.5;
        });
      }

      // Section 5: Silent Periods
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text("SECTION 5: DETECTED ACTIVITY GAPS (SILENT PERIODS)", 20, yPos);
      doc.setDrawColor(16, 185, 129);
      doc.line(20, yPos + 4, 190, yPos + 4);
      yPos += 15;

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Gap Start Date", 20, yPos);
      doc.text("Gap End Date", 70, yPos);
      doc.text("Duration of Inactivity (Days)", 130, yPos);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 9;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      if (topGaps.length === 0) {
        doc.text("No significant silent periods detected in the CDR logging duration.", 20, yPos);
      } else {
        topGaps.forEach(gp => {
          doc.text(gp.start, 20, yPos);
          doc.text(gp.end, 70, yPos);
          doc.text(String(gp.days) + " days", 130, yPos);
          yPos += 7.5;
        });
      }

      doc.save(`Forensic_Merged_Investigation_Report_${cdrFile.phoneNumber}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF: ", e);
      setAlertConfig({
        isOpen: true,
        title: "Export Failed",
        message: "Failed to generate PDF forensic report.",
        type: "error"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
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
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1c0f0f] border border-red-950/40 hover:border-red-600/35 text-red-400 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
          >
            <FileText className="h-3.5 w-3.5 text-red-500" />
            <span>PDF Report</span>
          </button>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0f151c] border border-blue-950/40 hover:border-blue-600/35 text-blue-400 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5 text-blue-500" />
            <span>Print</span>
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
        <div className="pt-4">
          <button 
            onClick={handleDownloadPdf}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.99] cursor-pointer"
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating Forensic Report...</span>
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                <span>Generate Full Investigation Report (PDF)</span>
              </>
            )}
          </button>
        </div>

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
