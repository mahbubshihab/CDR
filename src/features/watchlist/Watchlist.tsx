import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, Edit2, Search, AlertTriangle } from 'lucide-react';
import { db, type WatchlistItem, type CDRRecord } from '../../utils/db';

export const Watchlist: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [matches, setMatches] = useState<(CDRRecord & { caseTitle: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formType, setFormType] = useState<'Number' | 'IMEI' | 'IMSI'>('Number');
  const [formValue, setFormValue] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    loadWatchlistAndMatches();
  }, []);

  const loadWatchlistAndMatches = async () => {
    setLoading(true);
    try {
      const items = await db.watchlist.toArray();
      setWatchlist(items);

      const allCases = await db.cases.toArray();
      const caseMap = new Map(allCases.map(c => [c.id, c.title]));
      
      const matchedRecords: (CDRRecord & { caseTitle: string })[] = [];
      
      if (items.length > 0) {
        for (const item of items) {
          if (!item.value) continue;
          
          let records: CDRRecord[] = [];
          if (item.type === 'Number') {
            records = await db.cdrRecords.where('otherParty').equals(item.value).toArray();
          } else if (item.type === 'IMEI') {
            records = await db.cdrRecords.where('imei').equals(item.value).toArray();
          } else if (item.type === 'IMSI') {
            records = await db.cdrRecords.where('imsi').equals(item.value).toArray();
          }
          
          records.forEach(r => {
            matchedRecords.push({ ...r, caseTitle: caseMap.get(r.caseId) || 'Unknown Case' });
          });
        }
      }
      
      const uniqueMatches = Array.from(new Map(matchedRecords.map(item => [item.id, item])).values());
      uniqueMatches.sort((a, b) => b.timestamp - a.timestamp);
      
      setMatches(uniqueMatches);
    } catch (err) {
      console.error('Error loading watchlist', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formValue.trim()) return;
    
    const newItem = {
      type: formType,
      value: formValue.trim(),
      notes: formNotes.trim(),
      createdAt: Date.now()
    };

    if (editId) {
      await db.watchlist.update(editId, newItem);
    } else {
      await db.watchlist.add(newItem as WatchlistItem);
    }
    
    setFormValue('');
    setFormNotes('');
    setShowForm(false);
    setEditId(null);
    loadWatchlistAndMatches();
  };

  const handleEdit = (item: WatchlistItem) => {
    setEditId(item.id!);
    setFormType(item.type);
    setFormValue(item.value);
    setFormNotes(item.notes);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    await db.watchlist.delete(id);
    loadWatchlistAndMatches();
  };

  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#121212] animate-in fade-in duration-300 overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">Watchlist Monitor</h2>
          <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
            Track high-risk targets and detect matches
          </p>
        </div>
        <button 
          onClick={() => { setShowForm(true); setEditId(null); setFormValue(''); setFormNotes(''); }} 
          className="flex items-center gap-2 px-4 py-2 bg-[#3ecf8e]/10 hover:bg-[#3ecf8e]/20 text-[#3ecf8e] rounded-lg text-xs font-semibold transition-colors border border-[#3ecf8e]/20"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="w-1/3 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between bg-[#1a1a1a]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#3ecf8e]" /> Target List
            </h3>
            <span className="text-xs font-mono text-gray-500">{watchlist.length} Targets</span>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {showForm && (
              <div className="bg-[#121212] p-4 rounded-lg border border-[#3ecf8e]/30 mb-4">
                <h4 className="text-xs font-semibold text-gray-300 mb-3">{editId ? 'Edit' : 'Add'} Watchlist Item</h4>
                <div className="space-y-3">
                  <select 
                    value={formType} 
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full bg-[#1e1e1e] border border-[#2e2e2e] text-gray-200 text-xs rounded p-2 outline-none focus:border-[#3ecf8e]"
                  >
                    <option value="Number">Phone Number</option>
                    <option value="IMEI">IMEI</option>
                    <option value="IMSI">IMSI</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Value (e.g. 8801700000000)" 
                    value={formValue}
                    onChange={e => setFormValue(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2e2e2e] text-gray-200 text-xs rounded p-2 outline-none focus:border-[#3ecf8e]"
                  />
                  <input 
                    type="text" 
                    placeholder="Notes (Optional)" 
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2e2e2e] text-gray-200 text-xs rounded p-2 outline-none focus:border-[#3ecf8e]"
                  />
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} className="flex-1 bg-[#3ecf8e] text-black text-xs font-semibold py-2 rounded hover:bg-[#32ad75] transition-colors">Save</button>
                    <button onClick={() => setShowForm(false)} className="flex-1 bg-[#2e2e2e] text-gray-300 text-xs font-semibold py-2 rounded hover:bg-[#3e3e3e] transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            )}
            
            {loading ? (
               <div className="text-center p-4 text-xs text-gray-500">Loading...</div>
            ) : watchlist.length === 0 && !showForm ? (
               <div className="text-center p-8 text-xs text-gray-500 flex flex-col items-center">
                 <ShieldAlert className="w-8 h-8 mb-2 opacity-30" />
                 N/A
               </div>
            ) : (
              watchlist.map(item => (
                <div key={item.id} className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-3 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-[#3ecf8e] uppercase px-1.5 py-0.5 bg-[#3ecf8e]/10 rounded mb-1 inline-block">{item.type}</span>
                      <p className="text-sm font-semibold text-gray-200 font-mono mt-1">{item.value}</p>
                      {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item.id!)} className="text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-2/3 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between bg-[#1a1a1a]">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${matches.length > 0 ? 'text-yellow-500' : 'text-gray-500'}`} /> 
              Matched Records
            </h3>
            <span className={`text-xs font-mono font-semibold px-2 py-1 rounded ${matches.length > 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-500'}`}>
              {matches.length} Matches Found
            </span>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : matches.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                <Search className="w-10 h-10 opacity-30" />
                <p className="text-sm font-semibold">N/A</p>
                <p className="text-xs">No matching records found in CDR files</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((record: any) => (
                  <div key={record.id} className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-200">
                        {record.otherParty || 'N/A'} 
                        <span className="text-xs text-gray-500 ml-2 font-normal">({record.usageType})</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        {new Date(record.timestamp * 1000).toLocaleString()}
                      </p>
                      <div className="flex gap-3 mt-2">
                        {record.imei && <span className="text-[10px] text-gray-400">IMEI: <span className="text-gray-300">{record.imei}</span></span>}
                        {record.imsi && <span className="text-[10px] text-gray-400">IMSI: <span className="text-gray-300">{record.imsi}</span></span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#3ecf8e] bg-[#3ecf8e]/10 px-2 py-1 rounded-full whitespace-nowrap">
                        {record.caseTitle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
