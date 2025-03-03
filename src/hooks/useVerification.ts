import { useState, useEffect, useCallback } from 'react';
import VerificationService, { 
  UserVerificationStatus, 
  VerificationRequest, 
  VerificationDocument, 
  VerificationType 
} from '../services/VerificationService';
import { useAuth } from './useAuth';

interface UseVerificationReturn {
  verificationStatus: UserVerificationStatus | null;
  verificationRequests: VerificationRequest[];
  documents: VerificationDocument[];
  loading: boolean;
  error: Error | null;
  activeRequest: VerificationRequest | null;
  submitVerificationRequest: (type: VerificationType, documentIds: string[]) => Promise<void>;
  uploadDocument: (type: VerificationType, file: File) => Promise<VerificationDocument>;
  viewRequest: (requestId: string) => Promise<void>;
  clearActiveRequest: () => void;
  refreshVerificationStatus: () => Promise<void>;
}

export const useVerification = (): UseVerificationReturn => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<UserVerificationStatus | null>(null);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);

  // Fetch verification status
  const fetchVerificationStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const status = await VerificationService.getUserVerificationStatus(user.id);
      setVerificationStatus(status);
      setError(null);
    } catch (err) {
      console.error('Error fetching verification status:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch verification requests
  const fetchVerificationRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const requests = await VerificationService.getVerificationRequests(user.id);
      setVerificationRequests(requests);
      setError(null);
    } catch (err) {
      console.error('Error fetching verification requests:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch user documents
  const fetchUserDocuments = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const docs = await VerificationService.getUserDocuments(user.id);
      setDocuments(docs);
      setError(null);
    } catch (err) {
      console.error('Error fetching user documents:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchVerificationStatus(),
        fetchVerificationRequests(),
        fetchUserDocuments()
      ]);
    }
  }, [user, fetchVerificationStatus, fetchVerificationRequests, fetchUserDocuments]);

  // Submit verification request
  const submitVerificationRequest = async (type: VerificationType, documentIds: string[]) => {
    if (!user) return;
    
    try {
      setLoading(true);
      await VerificationService.submitVerificationRequest(user.id, type, documentIds);
      
      // Refresh data
      await Promise.all([
        fetchVerificationStatus(),
        fetchVerificationRequests()
      ]);
      
      setError(null);
    } catch (err) {
      console.error('Error submitting verification request:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload document
  const uploadDocument = async (type: VerificationType, file: File) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      const document = await VerificationService.uploadDocument(user.id, type, file);
      
      // Refresh documents
      await fetchUserDocuments();
      
      setError(null);
      return document;
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // View verification request
  const viewRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const request = await VerificationService.getVerificationRequest(requestId);
      
      if (request) {
        setActiveRequest(request);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error viewing verification request:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear active request
  const clearActiveRequest = () => {
    setActiveRequest(null);
  };

  // Refresh verification status
  const refreshVerificationStatus = async () => {
    try {
      await Promise.all([
        fetchVerificationStatus(),
        fetchVerificationRequests(),
        fetchUserDocuments()
      ]);
    } catch (err) {
      console.error('Error refreshing verification status:', err);
      throw err;
    }
  };

  return {
    verificationStatus,
    verificationRequests,
    documents,
    loading,
    error,
    activeRequest,
    submitVerificationRequest,
    uploadDocument,
    viewRequest,
    clearActiveRequest,
    refreshVerificationStatus
  };
};

export default useVerification; 