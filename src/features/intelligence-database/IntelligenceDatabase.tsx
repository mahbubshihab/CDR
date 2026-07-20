import React, { useState, useEffect } from 'react';
import { db, type IntelligenceItem } from '../../utils/db';
import { Search, Plus, Edit2, Trash2, X, Save, ShieldAlert, Tag, User, Phone } from 'lucide-react';

export function IntelligenceDatabase() {
  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<IntelligenceItem>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const allItems = await db.intelligence.toArray();
      setItems(allItems.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load intelligence items', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.value || !currentItem.name || !currentItem.type) return;

    try {
      const itemToSave = {
        ...currentItem,
        type: currentItem.type as 'Number' | 'IMEI' | 'IMSI',
        value: currentItem.value,
        name: currentItem.name,
        tag: currentItem.tag || 'focus node',
        notes: currentItem.notes || '',
        createdAt: currentItem.id ? currentItem.createdAt! : Date.now(),
      };

      if (currentItem.id) {
        await db.intelligence.update(currentItem.id, itemToSave);
      } else {
        await db.intelligence.add(itemToSave as IntelligenceItem);
      }
      setIsEditing(false);
      setCurrentItem({});
      loadItems();
    } catch (error) {
      console.error('Failed to save item', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this intelligence record?')) {
      try {
        await db.intelligence.delete(id);
        loadItems();
      } catch (error) {
        console.error('Failed to delete item', error);
      }
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-blue-500" />
            Intelligence Database
          </h1>
          <p className="text-slate-400 mt-2">Manage known targets, suspicious nodes, and reference entries.</p>
        </div>
        <button
          onClick={() => {
            setCurrentItem({ type: 'Number', tag: 'suspicious' });
            setIsEditing(true);
          }}
          className="bg-[#3ecf8e] hover:bg-[#2ebd7e] text-gray-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Target
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 mb-6 flex gap-4 items-center">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by number, IMEI, name, tag, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none flex-1 text-slate-200 placeholder-slate-500"
        />
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {currentItem.id ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {currentItem.id ? 'Edit Target' : 'New Target'}
              </h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Identifier Type</label>
                  <select
                    value={currentItem.type || 'Number'}
                    onChange={(e) => setCurrentItem({ ...currentItem, type: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Number">Phone Number</option>
                    <option value="IMEI">IMEI</option>
                    <option value="IMSI">IMSI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Value (Number/IMEI)</label>
                  <input
                    required
                    type="text"
                    value={currentItem.value || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, value: e.target.value })}
                    placeholder="e.g. 01700000000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Owner / Suspect Name</label>
                <input
                  required
                  type="text"
                  value={currentItem.name || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                  placeholder="Name of the target"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Classification Tag</label>
                <select
                  value={currentItem.tag || 'focus node'}
                  onChange={(e) => setCurrentItem({ ...currentItem, tag: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="suspicious">Suspicious</option>
                  <option value="focus node">Focus Node</option>
                  <option value="clean">Clean</option>
                  <option value="known criminal">Known Criminal</option>
                  <option value="informant">Informant</option>
                  <option value="victim">Victim</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Notes / Details</label>
                <textarea
                  value={currentItem.notes || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional context or findings..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#3ecf8e] text-gray-950 font-bold hover:bg-[#2ebd7e] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-12 text-slate-400">Loading intelligence database...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-12 text-center text-slate-400">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No intelligence records found.</p>
          <p className="text-sm mt-2">Add targets to start building your database.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-slate-800/80 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    item.type === 'Number' ? 'bg-blue-500/20 text-blue-400' :
                    item.type === 'IMEI' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {item.type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                    item.tag === 'suspicious' || item.tag === 'known criminal' ? 'bg-red-500/20 text-red-400' :
                    item.tag === 'clean' ? 'bg-green-500/20 text-green-400' :
                    item.tag === 'victim' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-600/50 text-slate-300'
                  }`}>
                    <Tag className="w-3 h-3" />
                    {item.tag.toUpperCase()}
                  </span>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  <button
                    onClick={() => {
                      setCurrentItem(item);
                      setIsEditing(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-400 bg-slate-900 rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id!)}
                    className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-900 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-2xl font-mono font-bold tracking-tight text-white mb-1">
                  {item.value}
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <User className="w-4 h-4 text-slate-500" />
                  {item.name}
                </div>
              </div>
              
              {item.notes && (
                <div className="mt-auto pt-4 border-t border-slate-700/50 text-sm text-slate-400">
                  {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
