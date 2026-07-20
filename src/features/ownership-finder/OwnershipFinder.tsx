import React, { useState } from 'react';
import { db, type CDRFile } from '../../utils/db';
import { Search, FileText, User, MapPin, Building2, Calendar, Phone } from 'lucide-react';

export function OwnershipFinder() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [fileMatches, setFileMatches] = useState<CDRFile[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setFileMatches([]);

    const query = phoneNumber.trim().replace(/\s+/g, '');

    try {
      // Look up ownership in cdrFiles (metadata mapped to numbers)
      const allFiles = await db.cdrFiles.toArray();
      const matches = allFiles.filter(f => f.phoneNumber && f.phoneNumber.includes(query));
      
      setFileMatches(matches);
    } catch (error) {
      console.error('Error searching ownership:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="p-6 text-slate-200 min-h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-10 text-center max-w-3xl mx-auto pt-8">
        <div className="inline-flex items-center justify-center p-4 bg-purple-500/20 rounded-full mb-6 ring-4 ring-purple-500/10">
          <User className="w-12 h-12 text-purple-400" />
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">
          Ownership & Subscriber Finder
        </h1>
        <p className="text-slate-400 text-lg">
          Query registered ownership, metadata, and subscriber details extracted from uploaded CDR cover pages and registry data.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-12 w-full max-w-2xl mx-auto">
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-2 flex gap-2 items-center shadow-2xl focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all">
          <Search className="w-6 h-6 text-slate-400 ml-4" />
          <input
            type="text"
            placeholder="Enter MSISDN to find ownership info..."
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 text-xl text-white placeholder-slate-500 px-4 py-4"
          />
          <button
            type="submit"
            disabled={isSearching || !phoneNumber.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-10 py-4 rounded-xl font-bold text-lg transition-colors flex items-center gap-2"
          >
            {isSearching ? 'Querying...' : 'Find Owner'}
          </button>
        </div>
      </form>

      {hasSearched && !isSearching && fileMatches.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center mt-8">
          <FileText className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-2xl font-semibold text-white mb-2">No Ownership Records</h3>
          <p className="text-slate-400 text-center max-w-md">
            No subscriber details or file metadata were found for <span className="font-mono text-purple-400">{phoneNumber}</span> in the database.
          </p>
          <p className="text-slate-500 text-sm mt-4 border border-slate-700/50 bg-slate-800/50 p-3 rounded-lg inline-flex items-center gap-2">
            <strong>Policy Strict:</strong> Cannot simulate missing data. Result is purely from dataset.
          </p>
        </div>
      )}

      {fileMatches.length > 0 && (
        <div className="max-w-5xl mx-auto w-full space-y-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
              {fileMatches.length}
            </span>
            Registry Matches Found
          </h2>

          {fileMatches.map((file, idx) => (
            <div key={idx} className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-slate-700 p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">{file.ownerName || 'Not available in CDR file'}</h3>
                  <div className="flex items-center gap-3 text-purple-300 font-mono text-lg">
                    <Phone className="w-5 h-5" />
                    {file.phoneNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                    file.category === 'Suspect' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    file.category === 'Victim' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    file.category === 'Witness' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {file.category || 'Uncategorized'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Service Provider</div>
                      <div className="text-lg text-slate-200">{file.operator || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Registered Address</div>
                      <div className="text-lg text-slate-200">Not available in CDR file</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Source File Details</div>
                      <div className="text-slate-300">{file.fileName}</div>
                      <div className="text-sm text-slate-400 mt-1">{file.recordsCount} records parsed</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ingestion Date</div>
                      <div className="text-slate-300">{formatDate(file.uploadDate)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {(file.description || file.notes) && (
                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Registry Notes</div>
                  <p className="text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    {file.description} {file.notes && `| ${file.notes}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
