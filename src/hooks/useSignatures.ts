import { useState, useCallback } from 'react';
import { SignatureService } from '../services/SignatureService';
import { DocumentService } from '../services/DocumentService';
import { SignatureRequest, SignatureData, SignatureVerification, AuditEvent } from '../types/signature';

export interface UseSignaturesProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export interface UseSignaturesReturn {
  signatureRequests: SignatureRequest[];
  currentRequest: SignatureRequest | null;
  loading: boolean;
  error: string | null;
  createSignatureRequest: (documentId: string, signatories: string[], expirationDate?: Date) => Promise<SignatureRequest>;
  getSignatureRequestsByStatus: (status: 'pending' | 'completed' | 'canceled' | 'expired' | 'all') => Promise<SignatureRequest[]>;
  getSignatureRequestById: (requestId: string) => Promise<SignatureRequest>;
  cancelSignatureRequest: (requestId: string) => Promise<boolean>;
  sendReminder: (requestId: string, signatoryEmail: string) => Promise<boolean>;
  signDocument: (requestId: string, signatureData: SignatureData, verificationCode?: string) => Promise<boolean>;
  declineToSign: (requestId: string, reason: string) => Promise<boolean>;
  sendVerificationCode: (requestId: string, signatoryEmail: string) => Promise<boolean>;
  verifyCode: (requestId: string, code: string) => Promise<SignatureVerification>;
  getAuditTrail: (documentId: string) => Promise<AuditEvent[]>;
  downloadSignedDocument: (documentId: string) => Promise<void>;
}

export const useSignatures = ({ onSuccess, onError }: UseSignaturesProps = {}): UseSignaturesReturn => {
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<SignatureRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const signatureService = new SignatureService();
  const documentService = new DocumentService();

  const createSignatureRequest = useCallback(
    async (documentId: string, signatories: string[], expirationDate?: Date): Promise<SignatureRequest> => {
      try {
        setLoading(true);
        const request = await signatureService.createSignatureRequest(documentId, signatories, expirationDate);
        setSignatureRequests((prev) => [...prev, request]);
        setCurrentRequest(request);
        if (onSuccess) onSuccess('Signature request created successfully');
        return request;
      } catch (err) {
        const errorMessage = 'Failed to create signature request';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const getSignatureRequestsByStatus = useCallback(
    async (status: 'pending' | 'completed' | 'canceled' | 'expired' | 'all'): Promise<SignatureRequest[]> => {
      try {
        setLoading(true);
        const requests = await signatureService.getSignatureRequests(status);
        setSignatureRequests(requests);
        return requests;
      } catch (err) {
        const errorMessage = `Failed to fetch signature requests with status: ${status}`;
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onError]
  );

  const getSignatureRequestById = useCallback(
    async (requestId: string): Promise<SignatureRequest> => {
      try {
        setLoading(true);
        const request = await signatureService.getSignatureRequestById(requestId);
        setCurrentRequest(request);
        return request;
      } catch (err) {
        const errorMessage = `Failed to fetch signature request with ID: ${requestId}`;
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onError]
  );

  const cancelSignatureRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      try {
        setLoading(true);
        const success = await signatureService.cancelSignatureRequest(requestId);
        if (success) {
          setSignatureRequests((prev) =>
            prev.map((req) =>
              req.id === requestId ? { ...req, status: 'canceled' } : req
            )
          );
          if (currentRequest?.id === requestId) {
            setCurrentRequest({ ...currentRequest, status: 'canceled' });
          }
          if (onSuccess) onSuccess('Signature request canceled successfully');
        }
        return success;
      } catch (err) {
        const errorMessage = `Failed to cancel signature request with ID: ${requestId}`;
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [currentRequest, onSuccess, onError]
  );

  const sendReminder = useCallback(
    async (requestId: string, signatoryEmail: string): Promise<boolean> => {
      try {
        setLoading(true);
        const success = await signatureService.sendReminder(requestId, signatoryEmail);
        if (success && onSuccess) {
          onSuccess(`Reminder sent to ${signatoryEmail} successfully`);
        }
        return success;
      } catch (err) {
        const errorMessage = `Failed to send reminder to ${signatoryEmail}`;
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const signDocument = useCallback(
    async (requestId: string, signatureData: SignatureData, verificationCode?: string): Promise<boolean> => {
      try {
        setLoading(true);
        const success = await signatureService.signDocument(requestId, signatureData, verificationCode);
        if (success) {
          // Update the local state if needed
          if (onSuccess) onSuccess('Document signed successfully');
        }
        return success;
      } catch (err) {
        const errorMessage = 'Failed to sign document';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const declineToSign = useCallback(
    async (requestId: string, reason: string): Promise<boolean> => {
      try {
        setLoading(true);
        const success = await signatureService.declineToSign(requestId, reason);
        if (success && onSuccess) {
          onSuccess('Signature request declined');
        }
        return success;
      } catch (err) {
        const errorMessage = 'Failed to decline signature request';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const sendVerificationCode = useCallback(
    async (requestId: string, signatoryEmail: string): Promise<boolean> => {
      try {
        setLoading(true);
        const success = await signatureService.sendVerificationCode(requestId, signatoryEmail);
        if (success && onSuccess) {
          onSuccess('Verification code sent successfully');
        }
        return success;
      } catch (err) {
        const errorMessage = 'Failed to send verification code';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const verifyCode = useCallback(
    async (requestId: string, code: string): Promise<SignatureVerification> => {
      try {
        setLoading(true);
        const verification = await signatureService.verifyCode(requestId, code);
        if (verification.verified && onSuccess) {
          onSuccess('Verification code validated successfully');
        }
        return verification;
      } catch (err) {
        const errorMessage = 'Failed to verify code';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const getAuditTrail = useCallback(
    async (documentId: string): Promise<AuditEvent[]> => {
      try {
        setLoading(true);
        const auditTrail = await signatureService.getAuditTrail(documentId);
        return auditTrail;
      } catch (err) {
        const errorMessage = `Failed to fetch audit trail for document: ${documentId}`;
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onError]
  );

  const downloadSignedDocument = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        setLoading(true);
        await signatureService.downloadSignedDocument(documentId);
        if (onSuccess) onSuccess('Document downloaded successfully');
      } catch (err) {
        const errorMessage = `Failed to download signed document: ${documentId}`;
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  return {
    signatureRequests,
    currentRequest,
    loading,
    error,
    createSignatureRequest,
    getSignatureRequestsByStatus,
    getSignatureRequestById,
    cancelSignatureRequest,
    sendReminder,
    signDocument,
    declineToSign,
    sendVerificationCode,
    verifyCode,
    getAuditTrail,
    downloadSignedDocument
  };
}; 