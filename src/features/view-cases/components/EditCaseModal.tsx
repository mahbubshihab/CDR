import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { db, type Case } from '../../../utils/db';

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: Case | null;
  onSave: () => void;
}

export const EditCaseModal: React.FC<EditCaseModalProps> = ({ isOpen, onClose, caseData, onSave }) => {
  const [caseIdString, setCaseIdString] = useState('');
  const [title, setTitle] = useState('');
  const [caseType, setCaseType] = useState('Murder');
  const [policeStation, setPoliceStation] = useState('');
  const [investigatorName, setInvestigatorName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Active' | 'Completed'>('Pending');

  useEffect(() => {
    if (caseData) {
      setCaseIdString(caseData.caseIdString || '');
      setTitle(caseData.title || '');
      setCaseType(caseData.caseType || 'Murder');
      setPoliceStation(caseData.policeStation || '');
      setInvestigatorName(caseData.investigatorName || '');
      setDescription(caseData.description || '');
      setStatus(caseData.status || 'Pending');
    }
  }, [caseData]);

  if (!isOpen || !caseData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseIdString.trim() || !title.trim()) return;

    try {
      if (caseData.id) {
        await db.cases.update(caseData.id, {
          caseIdString: caseIdString.trim(),
          title: title.trim(),
          caseType,
          policeStation: policeStation.trim(),
          investigatorName: investigatorName.trim(),
          description: description.trim(),
          status
        });
        onSave();
        onClose();
      }
    } catch (err) {
      console.error('Failed to update case:', err);
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
            <h3 className="text-sm font-bold text-gray-200">Edit case</h3>
            <p className="text-sm text-gray-500 mt-0.5">Update investigation case details</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

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
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
