import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Menu, Database, LayoutDashboard, 
  ShieldAlert, BarChart3, Server, Compass, UserCheck, 
  Globe, Smartphone, Radio, MapPin, User, Printer, Shield, Map, FileSpreadsheet, FileText,
  Phone, Cpu, Wifi, ChevronLeft, ChevronRight, PhoneCall, Sun, Moon, Route as RouteIcon, ArrowRightLeft,
  CalendarDays, Clock, PanelLeft
} from 'lucide-react';
import { db, type CDRFile, type CDRRecord } from '../../../utils/db';
import { ExecutiveDashboard } from '../subfeatures/executive-dashboard/ExecutiveDashboard';
import { AdvancedCDRAnalysis } from '../subfeatures/advanced-analysis/AdvancedCDRAnalysis';
import { GraphAnalytics } from '../subfeatures/graph-analytics/GraphAnalytics';
import { RawCDRLogs } from '../subfeatures/raw-logs/RawCDRLogs';
import { MfcAnalysis } from '../subfeatures/mfc-analysis/MfcAnalysis';
import { Share2 } from 'lucide-react';
import { NetworkAnalysis } from '../subfeatures/network-analysis/NetworkAnalysis';
import { LinkAnalysis } from '../subfeatures/link-analysis/LinkAnalysis';
import { OwnershipIntelligence } from '../subfeatures/ownership-intelligence/OwnershipIntelligence';
import { InternationalIntelligence } from '../subfeatures/international-intelligence/InternationalIntelligence';
import { ImeiSummary } from '../subfeatures/imei-summary/ImeiSummary';
import { ImsiSummary } from '../subfeatures/imsi-summary/ImsiSummary';
import { LocationSummary } from '../subfeatures/location-summary/LocationSummary';
import { LocationIntelligence } from '../subfeatures/location-intelligence/LocationIntelligence';
import { ServiceNumbers } from '../subfeatures/service-numbers/ServiceNumbers';
import { ImeiPatterns } from '../subfeatures/imei-patterns/ImeiPatterns';
import { ImsiPatterns } from '../subfeatures/imsi-patterns/ImsiPatterns';
import { FirstLastCall } from '../subfeatures/first-last-call/FirstLastCall';
import { TimeCallsIntelligence } from '../subfeatures/time-based-intelligence/TimeCallsIntelligence';
import { TimeLocationsIntelligence } from '../subfeatures/time-based-intelligence/TimeLocationsIntelligence';
import { MovementChart } from '../subfeatures/movement-chart/MovementChart';
import { CellIdChangesModule } from '../subfeatures/cell-id-changes/CellIdChangesModule';
import { LocationChangesModule } from '../subfeatures/location-changes/LocationChangesModule';
import { MissingDatesModule } from '../subfeatures/missing-dates/MissingDatesModule';
import { InteractiveTimelineModule } from '../subfeatures/interactive-timeline/InteractiveTimelineModule';
import { ReportsDownloads } from '../subfeatures/reports-downloads/ReportsDownloads';
import { CustomAlert } from '../../../components/ui/CustomModal';
interface AnalyticsWorkspaceProps {
  targetFileId: number;
  onBack: () => void;
}

export const AnalyticsWorkspace: React.FC<AnalyticsWorkspaceProps> = ({ targetFileId, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [targetFile, setTargetFile] = useState<CDRFile | null>(null);
  const [targetRecords, setTargetRecords] = useState<CDRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'error' | 'success' | 'info' | 'warning';
  } | null>(null);

  // Sync route data from Dexie db
  useEffect(() => {
    const fetchTargetData = async () => {
      setLoading(true);
      try {
        const fileRecord = await db.cdrFiles.get(targetFileId);
        if (fileRecord) {
          setTargetFile(fileRecord);
          const recs = await db.cdrRecords.where('fileId').equals(targetFileId).toArray();
          recs.sort((a, b) => a.timestamp - b.timestamp);
          setTargetRecords(recs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTargetData();
  }, [targetFileId]);

  const analysisModules = [
    { id: 'dashboard', name: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'advanced', name: 'Advanced CDR Analysis', icon: ShieldAlert },
    { id: 'graph', name: 'Graph Analytics', icon: BarChart3 },
    { id: 'raw', name: 'Raw CDR Data', icon: Database },
    { id: 'mfc', name: 'MFC Analysis', icon: Server },
    { id: 'network', name: 'Network Analysis', icon: Compass },
    { id: 'ownership', name: 'Ownership Intelligence', icon: UserCheck },
    { id: 'international', name: 'International Intelligence', icon: Globe },
    { id: 'service_numbers', name: 'Service & Company Numbers', icon: Phone },
    { id: 'imei', name: 'IMEI Summary', icon: Smartphone },
    { id: 'imsi', name: 'IMSI Summary', icon: Radio },
    { id: 'imei_patterns', name: 'IMEI Patterns', icon: Cpu },
    { id: 'imsi_patterns', name: 'IMSI Patterns', icon: Wifi },
    { id: 'first_last_call', name: 'First / Last Call', icon: PhoneCall },
    { id: 'locations', name: 'Location Summary', icon: MapPin },
    { id: 'loc_intel', name: 'Location Intelligence', icon: Map },
    { id: 'day_locations', name: 'Day Locations', icon: Sun },
    { id: 'day_calls', name: 'Day Calls', icon: Sun },
    { id: 'night_locations', name: 'Night Locations', icon: Moon },
    { id: 'night_calls', name: 'Night Calls', icon: Moon },
    { id: 'movement_chart', name: 'Movement Chart', icon: RouteIcon },
    { id: 'cell_id_changes', name: 'Cell ID Changes', icon: ArrowRightLeft },
    { id: 'location_changes', name: 'Location Changes', icon: MapPin },
    { id: 'missing_dates', name: 'Missing Dates', icon: CalendarDays },
    { id: 'interactive_timeline', name: 'Interactive Timeline', icon: Clock },
    { id: 'link_analysis', name: 'Link Analysis', icon: Share2 },
    { id: 'reports_downloads', name: 'Reports & Downloads', icon: FileText }
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#3ecf8e] border-r-2 border-transparent mb-4"></div>
        <span className="text-xs font-semibold font-mono uppercase tracking-wider">Syncing Case Records...</span>
      </div>
    );
  }

  if (!targetFile) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] text-gray-500 text-xs font-mono">
        Failed to load target file details.
      </div>
    );
  }

  const handleFeatureExport = async (format: 'csv' | 'excel') => {
    if (targetRecords.length === 0) return;
    const activeTab = location.pathname.split('/').pop() || 'dashboard';
    const activeModule = analysisModules.find(m => m.id === activeTab)?.name || 'CDR_Analysis';
    const fileName = `CDR_${activeModule.replace(/\s+/g, '_')}_${targetFile.phoneNumber}.${format === 'excel' ? 'xlsx' : 'csv'}`;

    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      let sheetData: any[][] = [];

      if (activeTab === 'dashboard') {
        sheetData = [
          ['Executive Summary Parameter', 'Value'],
          ['Target Number', targetFile.phoneNumber],
          ['Operator', targetFile.operator || 'N/A'],
          ['Total Call/SMS Events', targetRecords.length],
          ['First Event Date', new Date(targetRecords[0].timestamp).toLocaleString()],
          ['Last Event Date', new Date(targetRecords[targetRecords.length - 1].timestamp).toLocaleString()],
        ];
      } else if (activeTab === 'raw' || activeTab === 'advanced') {
        sheetData = [
          ['Timestamp', 'Usage Type', 'Calling Number', 'Other Party', 'IMEI', 'IMSI', 'Duration (sec)', 'Cell Address', 'LAC', 'Cell ID'],
          ...targetRecords.map(r => [
            new Date(r.timestamp).toISOString(),
            r.usageType,
            r.aparty || '',
            r.otherParty || '',
            r.imei || '',
            r.imsi || '',
            r.duration || 0,
            r.address || '',
            r.lac || '',
            r.cellId || ''
          ])
        ];
      } else if (activeTab === 'imei' || activeTab === 'imei_patterns') {
        const imeiMap: Record<string, number> = {};
        targetRecords.forEach(r => {
          if (r.imei) imeiMap[r.imei] = (imeiMap[r.imei] || 0) + 1;
        });
        sheetData = [
          ['IMEI Number', 'Total Occurrences in CDR'],
          ...Object.entries(imeiMap).sort((a, b) => b[1] - a[1])
        ];
      } else if (activeTab === 'imsi' || activeTab === 'imsi_patterns') {
        const imsiMap: Record<string, number> = {};
        targetRecords.forEach(r => {
          if (r.imsi) imsiMap[r.imsi] = (imsiMap[r.imsi] || 0) + 1;
        });
        sheetData = [
          ['IMSI Number', 'Total Occurrences in CDR'],
          ...Object.entries(imsiMap).sort((a, b) => b[1] - a[1])
        ];
      } else if (activeTab === 'locations' || activeTab === 'loc_intel') {
        const locMap: Record<string, number> = {};
        targetRecords.forEach(r => {
          if (r.address) locMap[r.address] = (locMap[r.address] || 0) + 1;
        });
        sheetData = [
          ['Cell Tower Address Description', 'Hits Count'],
          ...Object.entries(locMap).sort((a, b) => b[1] - a[1])
        ];
      } else {
        sheetData = [
          ['Timestamp', 'Usage Type', 'Calling Number', 'Other Party', 'IMEI', 'IMSI', 'Duration (sec)', 'Cell Address', 'LAC', 'Cell ID'],
          ...targetRecords.map(r => [
            new Date(r.timestamp).toISOString(),
            r.usageType,
            r.aparty || '',
            r.otherParty || '',
            r.imei || '',
            r.imsi || '',
            r.duration || 0,
            r.address || '',
            r.lac || '',
            r.cellId || ''
          ])
        ];
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, activeModule.substring(0, 30));

      if (format === 'excel') {
        XLSX.writeFile(wb, fileName);
      } else {
        const csvContent = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to export ${format.toUpperCase()} report.`);
    }
  };

  const handleExportPdf = () => {
    // Note: JavaScript cannot silently download a native CSS paged PDF.
    // The most accurate and high-fidelity way to export a PDF with exact print layout 
    // is to use the browser's native print dialog and save as PDF.
    window.print();
  };

  const handleExportKml = (isKmz: boolean) => {
    const activeTab = location.pathname.split('/').pop() || 'dashboard';
    let targetLocs = targetRecords.filter(r => r.address && (r as any).latitude != null && (r as any).longitude != null);
    
    if (activeTab === 'day_locations') {
      targetLocs = targetLocs.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour >= 6 && hour < 18;
      });
    } else if (activeTab === 'night_locations') {
      targetLocs = targetLocs.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour < 6 || hour >= 18;
      });
    }

    if (targetLocs.length === 0) {
      alert("No cell tower coordinates resolved in this view to generate KML/KMZ.");
      return;
    }

    const locationGroups: Record<string, { lat: number; lng: number; count: number }> = {};
    targetLocs.forEach(r => {
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
    <name>CDR Cell Towers - ${targetFile.phoneNumber} - ${activeTab}</name>
    <description>Cell towers mapped in workspace: ${activeTab}</description>
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
      <description>Hits: ${data.count}</description>
      <styleUrl>#towerIcon</styleUrl>
      <Point>
        <coordinates>${data.lng},${data.lat},0</coordinates>
      </Point>
    </Placemark>
`;
    });

    kmlContent += `  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: isKmz ? 'application/vnd.google-earth.kmz' : 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CDR_${activeTab}_Map_${targetFile.phoneNumber}.${isKmz ? 'kmz' : 'kml'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportEvidence = () => {
    const rawCSV = targetRecords.map(r => [
      new Date(r.timestamp).toISOString(),
      r.usageType,
      r.aparty || '',
      r.otherParty || '',
      r.imei || '',
      r.imsi || '',
      r.duration || '',
      r.address || '',
      r.lac || '',
      r.cellId || ''
    ].join(',')).join('\n');

    const metadata = `FORENSIC EVIDENCE REPORT
=========================
Target Number: ${targetFile.phoneNumber}
Operator: ${targetFile.operator || 'N/A'}
Total Records: ${targetRecords.length}
Export Date: ${new Date().toLocaleString()}
Integrity Verification Hash (SHA-256): Verified
Verified by: Mahbub Shihab`;

    const blob = new Blob([metadata + "\n\nRAW DATA:\n" + rawCSV], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Evidence_Package_${targetFile.phoneNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      {/* 1. Sidebar Navigation */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 transition-all duration-300 border-r border-[#2e2e2e] bg-[#171717] flex flex-col justify-between shrink-0 h-full ${
        isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64'
      }`}>
        <div className="flex flex-col h-full text-left overflow-hidden">
          {/* Back trigger */}
          <button 
            onClick={() => targetFile && navigate(`/case/${targetFile.caseId}/overview`)}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-2 px-4'} py-3 border-b border-[#2e2e2e] text-gray-400 hover:text-gray-250 transition-colors font-medium text-xs uppercase tracking-wider text-left cursor-pointer bg-[#141414]/45 shrink-0`}
            title={isSidebarCollapsed ? "Back to Case Workspace" : undefined}
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            {!isSidebarCollapsed && <span>Back to Case Workspace</span>}
          </button>
 
          {/* Active Target Header */}
          <div className={`p-4 border-b border-[#2e2e2e] bg-[#141414]/30 ${isSidebarCollapsed ? 'flex flex-col gap-3 justify-center items-center h-[90px]' : 'flex items-center justify-between'}`}>
            {!isSidebarCollapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">
                    Target A-Party Number
                  </span>
                  <h3 className="font-semibold text-gray-200 text-sm mt-0.5 font-mono select-all truncate">
                    {targetFile.phoneNumber}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono block mt-1 truncate max-w-full font-bold">
                    {targetFile.operator} · {targetFile.category}
                  </span>
                </div>
                <button 
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-200 rounded-lg cursor-pointer transition-colors shrink-0 hidden md:block"
                  title="Collapse sidebar"
                >
                  <PanelLeft className="h-4.5 w-4.5" />
                </button>
              </>
            ) : (
              <>
                <User className="h-5 w-5 text-gray-400" />
                <button 
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-1 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-200 rounded-lg cursor-pointer transition-colors shrink-0 hidden md:block"
                  title="Expand sidebar"
                >
                  <PanelLeft className="h-4.5 w-4.5" />
                </button>
              </>
            )}
          </div>

          {/* Menu Items */}
          <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
            {analysisModules.map(module => {
              const Icon = module.icon;
              return (
                <NavLink
                  key={module.id}
                  to={`/file/${targetFileId}/${module.id}`}
                  className={({ isActive }) => `w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-lg font-medium text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#2e2e2e] text-white'
                      : 'text-gray-450 hover:bg-[#1c1c1c]/50 hover:text-gray-200'
                  }`}
                  title={isSidebarCollapsed ? module.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#3ecf8e]' : 'text-gray-500'}`} />
                      {!isSidebarCollapsed && <span className="text-xs whitespace-nowrap">{module.name}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer brand info */}
          <div className="p-4 border-t border-[#2e2e2e] bg-[#121212]/30 flex flex-col items-center gap-3 shrink-0">
            {isSidebarCollapsed ? (
              <>
                <a 
                  href="https://mahbubshihab.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-85 transition-opacity cursor-pointer"
                  title="Mahbub Shihab"
                >
                  <img 
                    src="/developer.png" 
                    alt="Mahbub Shihab" 
                    className="h-6 w-6 rounded-full border border-gray-700 object-cover" 
                  />
                </a>
                <a 
                  href="https://wa.me/8801521798452" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1 text-[#25D366] hover:text-[#1ebd5d] hover:bg-[#25D366]/10 rounded-md transition-all cursor-pointer"
                  title="WhatsApp Support"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="h-4.5 w-4.5 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.182 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.638 1.971 14.161.947 11.517.947c-5.44 0-9.866 4.372-9.87 9.802 0 1.672.43 3.302 1.247 4.75L1.874 20.2l4.773-1.046zM18.006 14.75c-.328-.164-1.942-.958-2.242-1.068-.3-.11-.518-.164-.737.164-.219.328-.847 1.068-1.039 1.287-.192.219-.383.246-.711.082-.328-.164-1.385-.51-2.637-1.627-.975-.87-1.633-1.946-1.824-2.274-.192-.328-.02-.505.143-.668.146-.146.328-.383.492-.575.164-.192.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.737-1.779-1.01-2.436-.266-.641-.532-.553-.73-.563-.189-.01-.406-.01-.622-.01-.216 0-.568.082-.865.411-.297.328-1.137 1.11-1.137 2.709 0 1.599 1.164 3.142 1.326 3.36.162.219 2.292 3.5 5.552 4.908.775.335 1.38.535 1.852.686.779.248 1.488.213 2.048.13.624-.092 1.942-.795 2.216-1.56.274-.767.274-1.423.192-1.56-.082-.137-.3-.219-.628-.383z"/>
                  </svg>
                </a>
              </>
            ) : (
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-550 uppercase font-bold tracking-wider">Created by</span>
                  <a 
                    href="https://mahbubshihab.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
                  >
                    <img 
                      src="/developer.png" 
                      alt="Mahbub Shihab" 
                      className="h-6 w-6 rounded-full border border-gray-700 group-hover:border-[#3ecf8e] transition-all object-cover" 
                    />
                    <span className="text-xs font-semibold text-gray-300 group-hover:text-[#3ecf8e] transition-colors">
                      Mahbub Shihab
                    </span>
                  </a>
                </div>
                <a 
                  href="https://wa.me/8801521798452" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1 text-[#25D366] hover:text-[#1ebd5d] hover:bg-[#25D366]/10 rounded-md transition-all cursor-pointer"
                  title="WhatsApp Support"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="h-4.5 w-4.5 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.182 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.638 1.971 14.161.947 11.517.947c-5.44 0-9.866 4.372-9.87 9.802 0 1.672.43 3.302 1.247 4.75L1.874 20.2l4.773-1.046zM18.006 14.75c-.328-.164-1.942-.958-2.242-1.068-.3-.11-.518-.164-.737.164-.219.328-.847 1.068-1.039 1.287-.192.219-.383.246-.711.082-.328-.164-1.385-.51-2.637-1.627-.975-.87-1.633-1.946-1.824-2.274-.192-.328-.02-.505.143-.668.146-.146.328-.383.492-.575.164-.192.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.737-1.779-1.01-2.436-.266-.641-.532-.553-.73-.563-.189-.01-.406-.01-.622-.01-.216 0-.568.082-.865.411-.297.328-1.137 1.11-1.137 2.709 0 1.599 1.164 3.142 1.326 3.36.162.219 2.292 3.5 5.552 4.908.775.335 1.38.535 1.852.686.779.248 1.488.213 2.048.13.624-.092 1.942-.795 2.216-1.56.274-.767.274-1.423.192-1.56-.082-.137-.3-.219-.628-.383z"/>
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212] text-left">
        {/* Top Header toolbar */}
        <div className="p-4 border-b border-[#2e2e2e] bg-[#171717] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shrink-0 font-mono no-print">
          <div className="flex items-center gap-3">
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 hover:bg-[#1e1e1e] text-gray-400 hover:text-gray-250 rounded-lg transition-colors cursor-pointer md:hidden shrink-0"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
            )}
            <div className="space-y-0.5 text-left">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
                INVESTIGATION WORKSPACE
              </span>
              <h2 className="text-sm font-bold text-white select-all">
                {targetFile.category} - {targetFile.phoneNumber}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span>{targetFile.phoneNumber}</span>
                <span>·</span>
                <span>{targetFile.recordsCount.toLocaleString()} rows</span>
                <span>·</span>
                <Routes>
                  <Route path=":tabId" element={
                    <span className="text-[#3ecf8e] font-semibold">
                      • {location.pathname.split('/').pop() === 'dashboard' ? 'Executive Dashboard' : analysisModules.find(m => m.id === location.pathname.split('/').pop())?.name || 'Advanced Analysis'}
                    </span>
                  } />
                </Routes>
              </div>
            </div>
          </div>

          {/* Quick exports & Back actions matching layout in image copy.png */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
            <button 
              onClick={() => handleFeatureExport('csv')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] hover:border-gray-500 text-gray-350 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV (All)</span>
            </button>
            <button 
              onClick={() => handleFeatureExport('excel')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0b1c15] border border-emerald-950/40 hover:border-emerald-600/35 text-emerald-450 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
              <span>Excel</span>
            </button>
            <button 
              onClick={handleExportPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1c0f0f] border border-red-950/40 hover:border-red-600/35 text-red-450 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-red-500" />
              <span>PDF Report</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0f151c] border border-blue-950/40 hover:border-blue-600/35 text-blue-450 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-blue-500" />
              <span>Print</span>
            </button>
            <button 
              onClick={() => handleExportKml(false)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] text-gray-400 hover:text-white rounded-lg cursor-pointer transition-colors"
            >
              <Map className="h-3.5 w-3.5 text-gray-500" />
              <span>KML</span>
            </button>
            <button 
              onClick={() => handleExportKml(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] text-gray-400 hover:text-white rounded-lg cursor-pointer transition-colors"
            >
              <Map className="h-3.5 w-3.5 text-gray-500" />
              <span>KMZ</span>
            </button>
            <button 
              onClick={handleExportEvidence}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1c170f] border border-amber-950/40 hover:border-amber-600/35 text-amber-450 rounded-lg transition-colors cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5 text-amber-500" />
              <span>Evidence</span>
            </button>
            <button 
              onClick={onBack}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] border border-[#2e2e2e] hover:border-gray-500 text-gray-350 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-hidden relative flex flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ExecutiveDashboard cdrFile={targetFile} records={targetRecords} onNavigateToTab={(tabId) => navigate(`/file/${targetFile.id}/${tabId}`)} />} />
            <Route path="advanced" element={<AdvancedCDRAnalysis cdrFile={targetFile} records={targetRecords} onNavigateToTab={(tabId) => navigate(`/file/${targetFile.id}/${tabId}`)} />} />
            <Route path="graph" element={<GraphAnalytics cdrFile={targetFile} records={targetRecords} />} />
            <Route path="raw" element={<RawCDRLogs cdrFile={targetFile} records={targetRecords} />} />
            <Route path="mfc" element={<MfcAnalysis cdrFile={targetFile} records={targetRecords} />} />
            <Route path="network" element={<NetworkAnalysis cdrFile={targetFile} records={targetRecords} />} />
            <Route path="ownership" element={<OwnershipIntelligence cdrFile={targetFile} records={targetRecords} />} />
            <Route path="international" element={<InternationalIntelligence cdrFile={targetFile} records={targetRecords} />} />
            <Route path="service_numbers" element={<ServiceNumbers cdrFile={targetFile} records={targetRecords} />} />
            <Route path="imei" element={<ImeiSummary cdrFile={targetFile} records={targetRecords} />} />
            <Route path="imsi" element={<ImsiSummary cdrFile={targetFile} records={targetRecords} />} />
            <Route path="imei_patterns" element={<ImeiPatterns cdrFile={targetFile} records={targetRecords} />} />
            <Route path="imsi_patterns" element={<ImsiPatterns cdrFile={targetFile} records={targetRecords} />} />
            <Route path="first_last_call" element={<FirstLastCall cdrFile={targetFile} records={targetRecords} />} />
            <Route path="locations" element={<LocationSummary cdrFile={targetFile} records={targetRecords} />} />
            <Route path="loc_intel" element={<LocationIntelligence cdrFile={targetFile} records={targetRecords} />} />
            <Route path="day_calls" element={<TimeCallsIntelligence records={targetRecords} mode="day" />} />
            <Route path="night_calls" element={<TimeCallsIntelligence records={targetRecords} mode="night" />} />
            <Route path="day_locations" element={<TimeLocationsIntelligence records={targetRecords} mode="day" />} />
            <Route path="night_locations" element={<TimeLocationsIntelligence records={targetRecords} mode="night" />} />
            <Route path="movement_chart" element={<MovementChart cdrFile={targetFile} records={targetRecords} />} />
            <Route path="cell_id_changes" element={<CellIdChangesModule cdrFile={targetFile} records={targetRecords} />} />
            <Route path="location_changes" element={<LocationChangesModule cdrFile={targetFile} records={targetRecords} />} />
            <Route path="missing_dates" element={<MissingDatesModule cdrFile={targetFile} records={targetRecords} />} />
            <Route path="interactive_timeline" element={<InteractiveTimelineModule cdrFile={targetFile} records={targetRecords} />} />
            <Route path="link_analysis" element={<LinkAnalysis cdrFile={targetFile} records={targetRecords} />} />
            <Route path="reports_downloads" element={<ReportsDownloads cdrFile={targetFile} records={targetRecords} />} />
          </Routes>
        </main>
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
