import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  type User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { setDatabaseUser } from '../utils/db';

interface AuthContextType {
  currentUser: User | null;
  role: 'owner' | 'user' | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  validUntil: Timestamp | null;
  maxCases: number;
  maxFiles: number;
  createdCasesCount: number;
  uploadedFilesCount: number;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OWNER_EMAILS = [
  'cdroreco@gmail.com',
  'xlshihab9@gmail.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<'owner' | 'user' | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [validUntil, setValidUntil] = useState<Timestamp | null>(null);
  
  // Custom user limits and stats from separate collections
  const [maxCases, setMaxCases] = useState<number>(0);
  const [maxFiles, setMaxFiles] = useState<number>(0);
  const [createdCasesCount, setCreatedCasesCount] = useState<number>(0);
  const [uploadedFilesCount, setUploadedFilesCount] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFromUserDoc: (() => void) | null = null;
    let unsubscribeFromLimitDoc: (() => void) | null = null;
    let unsubscribeFromStatsDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous user document/limits/stats subscriptions if any
      if (unsubscribeFromUserDoc) {
        unsubscribeFromUserDoc();
        unsubscribeFromUserDoc = null;
      }
      if (unsubscribeFromLimitDoc) {
        unsubscribeFromLimitDoc();
        unsubscribeFromLimitDoc = null;
      }
      if (unsubscribeFromStatsDoc) {
        unsubscribeFromStatsDoc();
        unsubscribeFromStatsDoc = null;
      }

      try {
        if (user) {
          setDatabaseUser(user.uid);
          const emailLower = user.email?.toLowerCase() || '';
          const isOwner = OWNER_EMAILS.includes(emailLower);
          const userDocRef = doc(db, 'users', user.uid);

          if (isOwner) {
            // If Owner, immediately set/update their document to guarantee access
            const ownerData = {
              uid: user.uid,
              name: user.displayName || 'Owner',
              email: emailLower,
              photoURL: user.photoURL || '',
              role: 'owner' as const,
              status: 'approved' as const,
              lastLogin: serverTimestamp()
            };
            
            await setDoc(userDocRef, ownerData, { merge: true });
            
            setCurrentUser(user);
            setRole('owner');
            setStatus('approved');
            setValidUntil(null);
            setMaxCases(0);
            setMaxFiles(0);
            setCreatedCasesCount(0);
            setUploadedFilesCount(0);
            setLoading(false);
          } else {
            // Non-owner user
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
              // Register a new access request
              const newUserData = {
                uid: user.uid,
                name: user.displayName || 'New Investigator',
                email: emailLower,
                photoURL: user.photoURL || '',
                role: 'user' as const,
                status: 'pending' as const,
                requestedAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                validUntil: null
              };

              await setDoc(userDocRef, newUserData);
              
              // Notify all system Owners of the new access request
              try {
                const ownersQuery = query(collection(db, 'users'), where('role', '==', 'owner'));
                const ownersSnap = await getDocs(ownersQuery);
                const batch = writeBatch(db);
                ownersSnap.forEach((ownerDoc) => {
                  const notifRef = doc(collection(db, 'users', ownerDoc.id, 'notifications'));
                  batch.set(notifRef, {
                    title: 'New Access Request',
                    message: `${user.displayName || 'New Investigator'} (${emailLower}) has requested platform access.`,
                    createdAt: serverTimestamp(),
                    read: false,
                    type: 'request'
                  });
                });
                await batch.commit();
              } catch (err) {
                console.error("Error creating owner notifications on registration:", err);
              }
              
              setCurrentUser(user);
              setRole('user');
              setStatus('pending');
              setValidUntil(null);
              setMaxCases(0);
              setMaxFiles(0);
              setCreatedCasesCount(0);
              setUploadedFilesCount(0);
              setLoading(false);
            } else {
              // Existing user, setup real-time listener for status/expiry changes
              setCurrentUser(user);
              
              // Keep track of logins
              await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });

              // 1. Listen to the main user profile
              unsubscribeFromUserDoc = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  setRole(data.role || 'user');
                  setStatus(data.status || 'pending');
                }
              }, (error) => {
                console.error("Error listening to user document:", error);
              });

              // 2. Listen to user limits (Owner writes only)
              const limitDocRef = doc(db, 'limits', user.uid);
              unsubscribeFromLimitDoc = onSnapshot(limitDocRef, (docSnap) => {
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  setValidUntil(data.validUntil || null);
                  setMaxCases(data.maxCases || 0);
                  setMaxFiles(data.maxFiles || 0);
                } else {
                  setValidUntil(null);
                  setMaxCases(0);
                  setMaxFiles(0);
                }
              }, (error) => {
                console.error("Error listening to user limits:", error);
              });

              // 3. Listen to user metrics/stats (Read & Write by User & Owner)
              const statsDocRef = doc(db, 'userStats', user.uid);
              unsubscribeFromStatsDoc = onSnapshot(statsDocRef, (docSnap) => {
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  setCreatedCasesCount(data.createdCasesCount || 0);
                  setUploadedFilesCount(data.uploadedFilesCount || 0);
                } else {
                  setCreatedCasesCount(0);
                  setUploadedFilesCount(0);
                }
                setLoading(false);
              }, (error) => {
                console.error("Error listening to user stats:", error);
                setLoading(false);
              });
            }
          }
        } else {
          // No user authenticated
          setDatabaseUser('');
          setCurrentUser(null);
          setRole(null);
          setStatus(null);
          setValidUntil(null);
          setMaxCases(0);
          setMaxFiles(0);
          setCreatedCasesCount(0);
          setUploadedFilesCount(0);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setDatabaseUser('');
        // Clean state on failure to avoid infinite loader
        setCurrentUser(null);
        setRole(null);
        setStatus(null);
        setValidUntil(null);
        setMaxCases(0);
        setMaxFiles(0);
        setCreatedCasesCount(0);
        setUploadedFilesCount(0);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFromUserDoc) unsubscribeFromUserDoc();
      if (unsubscribeFromLimitDoc) unsubscribeFromLimitDoc();
      if (unsubscribeFromStatsDoc) unsubscribeFromStatsDoc();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setLoading(false);
      throw error;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-Out Error:", error);
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      role,
      status,
      validUntil,
      maxCases,
      maxFiles,
      createdCasesCount,
      uploadedFilesCount,
      loading,
      signInWithGoogle,
      signOutUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
