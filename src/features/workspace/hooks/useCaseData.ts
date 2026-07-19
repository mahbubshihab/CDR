import { useState, useEffect } from 'react';
import { db, type CDRFile, type CDRRecord } from '../../../utils/db';

export function useCaseData(caseId?: number) {
  const [files, setFiles] = useState<CDRFile[]>([]);
  const [records, setRecords] = useState<CDRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [caseFiles, caseRecords] = await Promise.all([
          db.cdrFiles.where('caseId').equals(caseId).toArray(),
          db.cdrRecords.where('caseId').equals(caseId).toArray()
        ]);
        
        // Sort records by timestamp
        caseRecords.sort((a, b) => a.timestamp - b.timestamp);
        
        setFiles(caseFiles);
        setRecords(caseRecords);
      } catch (err) {
        console.error('Failed to load case data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [caseId]);

  return { files, records, loading };
}
