import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Database, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { CustomConfirm } from '../../components/ui/CustomModal';
import { db } from '../../utils/db';
import { exportDB, importInto } from 'dexie-export-import';

export const Settings: React.FC = () => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearDatabase = async () => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      await db.cases.clear();
      await db.cdrFiles.clear();
      await db.cdrRecords.clear();
      await db.watchlist.clear();
      await db.intelligence.clear();
      setStatusMsg({ type: 'success', text: 'Database cleared successfully.' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to clear database.' });
    } finally {
      setIsProcessing(false);
      setConfirmClear(false);
    }
  };

  const handleExportDB = async () => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const blob = await exportDB(db, { prettyJson: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cdr_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Backup exported successfully.' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to export backup.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg(null);
    try {
      await importInto(db, file, { 
        overwriteValues: true,
        clearTablesBeforeImport: true 
      });
      setStatusMsg({ type: 'success', text: 'Database restored successfully.' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: `Failed to restore database: ${err.message}` });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#0f0f11] animate-in fade-in duration-300 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-[#3ecf8e]" />
          System Settings
        </h2>
        <p className="text-sm text-gray-400 mt-2 font-mono">
          Manage local database, backups, and system configuration
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {statusMsg && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${statusMsg.type === 'success' ? 'bg-[#3ecf8e]/10 border-[#3ecf8e]/30 text-[#3ecf8e]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {statusMsg.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="text-sm font-mono">{statusMsg.text}</span>
          </div>
        )}

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#27272a]">
            <div className="p-2 bg-blue-400/10 border border-blue-400/20 rounded-lg">
              <Database className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-200">Data Management</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">Manage your local IndexedDB storage (Zero-footprint)</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Export Backup */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300">Export Database Backup</h4>
                <p className="text-xs text-gray-500 font-mono mt-1 max-w-md">
                  Download a complete JSON snapshot of all cases, CDR files, records, watchlist, and intelligence data.
                </p>
              </div>
              <button 
                onClick={handleExportDB}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-gray-200 text-sm font-medium rounded-lg border border-[#3f3f46] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>
            </div>

            {/* Import Restore */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300">Import Database Restore</h4>
                <p className="text-xs text-gray-500 font-mono mt-1 max-w-md">
                  Restore database from a previously exported JSON backup file. This will overwrite existing data.
                </p>
              </div>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImportDB}
                  disabled={isProcessing}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-gray-200 text-sm font-medium rounded-lg border border-[#3f3f46] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Restore JSON
                </button>
              </div>
            </div>

            {/* Clear Database */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#27272a]">
              <div>
                <h4 className="text-sm font-semibold text-red-400">Clear Database</h4>
                <p className="text-xs text-gray-500 font-mono mt-1 max-w-md">
                  Permanently delete all local data. This action cannot be undone unless you have a backup.
                </p>
              </div>
              <button 
                onClick={() => setConfirmClear(true)}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4" />
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <CustomConfirm
        isOpen={confirmClear}
        title="Clear Entire Database?"
        message="Are you completely sure you want to delete all cases, CDR files, records, and intelligence data? This action cannot be undone."
        confirmText="Yes, Clear Data"
        cancelText="Cancel"
        onConfirm={handleClearDatabase}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
};
