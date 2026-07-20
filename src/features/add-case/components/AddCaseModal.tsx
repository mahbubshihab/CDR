import React, { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { db, type Case } from '../../../utils/db';
import { useAuth } from '../../../contexts/AuthContext';
import { db as dbFirestore } from '../../../firebase';
import { doc, setDoc, increment } from 'firebase/firestore';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const AddCaseModal: React.FC<AddCaseModalProps> = ({ isOpen, onClose, onSave }) => {
  const { currentUser, role, maxCases, createdCasesCount } = useAuth();
  const [caseIdString, setCaseIdString] = useState('CASE-2026-001');
  const [title, setTitle] = useState('');
  const [caseType, setCaseType] = useState('Murder');
  const [policeStation, setPoliceStation] = useState('');
  const [investigatorName, setInvestigatorName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Active' | 'Completed'>('Pending');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseIdString.trim() || !title.trim()) return;
    setError(null);

    // Validate connection and limits for non-owners
    if (role !== 'owner') {
      if (!navigator.onLine) {
        setError("Internet connection is required to verify account limits. Please connect to the internet and try again.");
        return;
      }
      
      if (createdCasesCount >= maxCases) {
        setError(`Case limit exceeded (${createdCasesCount}/${maxCases} cases used). Please contact the system administrator to upgrade your limits.`);
        return;
      }
    }

    try {
      await db.cases.add({
        caseIdString: caseIdString.trim(),
        title: title.trim(),
        caseType,
        policeStation: policeStation.trim(),
        investigatorName: investigatorName.trim(),
        description: description.trim(),
        status,
        createdAt: Date.now()
      });

      // Increment createdCasesCount in Firestore
      if (currentUser && role !== 'owner') {
        const statsDocRef = doc(dbFirestore, 'userStats', currentUser.uid);
        await setDoc(statsDocRef, {
          createdCasesCount: increment(1)
        }, { merge: true });
      }

      onSave();
      onClose();
      // Reset
      setCaseIdString(`CASE-2026-${Math.floor(100 + Math.random() * 900)}`);
      setTitle('');
      setPoliceStation('');
      setInvestigatorName('');
      setDescription('');
      setStatus('Pending');
      setError(null);
    } catch (err) {
      console.error('Failed to save case:', err);
      setError("Failed to save the case to local database. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-xl bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left text-sm animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2e2e2e]">
          <div>
            <h3 className="text-sm font-bold text-gray-200">Add new case</h3>
            <p className="text-sm text-gray-500 mt-0.5">Register a forensic investigation case</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                Case ID *
              </label>
              <input
                type="text"
                required
                value={caseIdString}
                onChange={e => setCaseIdString(e.target.value)}
                placeholder="CASE-2026-001"
                className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                Case name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Case title"
                className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                Case type
              </label>
              <select
                value={caseType}
                onChange={e => setCaseType(e.target.value)}
                className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 focus:outline-none focus:border-[#3ecf8e]"
              >
                {['Murder', 'Theft', 'Robbery', 'Fraud', 'Cyber Crime', 'Kidnapping', 'Terrorism', 'Narcotics', 'Other'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                Police station
              </label>
              <input
                type="text"
                value={policeStation}
                onChange={e => setPoliceStation(e.target.value)}
                placeholder="Police station"
                className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
              Investigator name
            </label>
            <input
              type="text"
              value={investigatorName}
              onChange={e => setInvestigatorName(e.target.value)}
              placeholder="Investigator name"
              className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description details..."
              rows={3}
              className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 focus:outline-none focus:border-[#3ecf8e]"
            >
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2e2e2e]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent border border-[#2e2e2e] rounded-lg text-gray-400 font-bold hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#046a38] text-white font-medium border border-[#3ecf8e] hover:bg-[#00522c] rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              Save case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
