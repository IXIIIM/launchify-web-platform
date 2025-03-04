import { useState, useEffect, useCallback } from 'react';
import DocumentService, {
  Document,
  DocumentTemplate,
  DocumentType,
  DocumentStatus,
  DocumentVisibility,
  DocumentFilter,
  DocumentPagination,
  DocumentGenerationOptions,
  Signatory
} from '../services/DocumentService';

// Define the return type for the hook
interface UseDocumentsReturn {
  // Documents state
  documents: Document[];
  documentsLoading: boolean;
  documentsError: Error | null;
  documentsPagination: DocumentPagination;
  
  // Document templates state
  templates: DocumentTemplate[];
  templatesLoading: boolean;
  templatesError: Error | null;
  
  // Current document state
  currentDocument: Document | null;
  currentDocumentLoading: boolean;
  currentDocumentError: Error | null;
  
  // Document filters
  filters: DocumentFilter;
  setFilters: (filters: DocumentFilter) => void;
  
  // Document actions
  getDocuments: (filter?: DocumentFilter, pagination?: Omit<DocumentPagination, 'total'>) => Promise<void>;
  getDocumentById: (documentId: string) => Promise<void>;
  getTemplates: (category?: string) => Promise<void>;
  getTemplateById: (templateId: string) => Promise<DocumentTemplate>;
  createDocument: (options: DocumentGenerationOptions) => Promise<Document>;
  updateDocument: (documentId: string, document: Partial<Document>) => Promise<Document>;
  deleteDocument: (documentId: string) => Promise<void>;
  sendForSignature: (documentId: string, message?: string) => Promise<Document>;
  signDocument: (documentId: string, signatureData: string) => Promise<Document>;
  rejectDocument: (documentId: string, reason: string) => Promise<Document>;
  sendReminder: (documentId: string, userIds?: string[]) => Promise<void>;
  archiveDocument: (documentId: string) => Promise<Document>;
  restoreDocument: (documentId: string) => Promise<Document>;
  downloadDocument: (documentId: string) => Promise<void>;
  uploadDocument: (file: File, metadata: {
    name: string;
    description?: string;
    documentType: DocumentType;
    visibility?: DocumentVisibility;
    signatories?: Omit<Signatory, 'status' | 'signedAt' | 'signatureId' | 'signatureUrl' | 'remindersSent' | 'lastReminderSent'>[];
    tags?: string[];
  }) => Promise<Document>;
  
  // Document statistics
  statistics: {
    totalDocuments: number;
    documentsByType: Record<DocumentType, number>;
    documentsByStatus: Record<DocumentStatus, number>;
    recentActivity: {
      documentId: string;
      documentName: string;
      action: string;
      timestamp: string;
      performedBy: {
        userId: string;
        name: string;
      };
    }[];
  } | null;
  statisticsLoading: boolean;
  statisticsError: Error | null;
  getStatistics: (userId?: string) => Promise<void>;
  
  // Reset states
  resetCurrentDocument: () => void;
  resetErrors: () => void;
}

// Create the hook
export const useDocuments = (apiUrl: string, authToken?: string): UseDocumentsReturn => {
  // Initialize the document service
  const documentService = new DocumentService(apiUrl, authToken);
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState<boolean>(false);
  const [documentsError, setDocumentsError] = useState<Error | null>(null);
  const [documentsPagination, setDocumentsPagination] = useState<DocumentPagination>({
    page: 1,
    limit: 10,
    total: 0
  });
  
  // Document templates state
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(false);
  const [templatesError, setTemplatesError] = useState<Error | null>(null);
  
  // Current document state
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentDocumentLoading, setCurrentDocumentLoading] = useState<boolean>(false);
  const [currentDocumentError, setCurrentDocumentError] = useState<Error | null>(null);
  
  // Document filters
  const [filters, setFilters] = useState<DocumentFilter>({});
  
  // Document statistics
  const [statistics, setStatistics] = useState<{
    totalDocuments: number;
    documentsByType: Record<DocumentType, number>;
    documentsByStatus: Record<DocumentStatus, number>;
    recentActivity: {
      documentId: string;
      documentName: string;
      action: string;
      timestamp: string;
      performedBy: {
        userId: string;
        name: string;
      };
    }[];
  } | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState<boolean>(false);
  const [statisticsError, setStatisticsError] = useState<Error | null>(null);
  
  // Set auth token when it changes
  useEffect(() => {
    if (authToken) {
      documentService.setAuthToken(authToken);
    }
  }, [authToken]);
  
  // Get documents
  const getDocuments = useCallback(async (
    filter: DocumentFilter = {},
    pagination: Omit<DocumentPagination, 'total'> = { page: 1, limit: 10 }
  ) => {
    setDocumentsLoading(true);
    setDocumentsError(null);
    
    try {
      // For development, use mock data
      const response = await documentService.mockGetDocuments(filter, pagination);
      setDocuments(response.documents);
      setDocumentsPagination(response.pagination);
      setFilters(filter);
    } catch (error) {
      setDocumentsError(error as Error);
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  }, []);
  
  // Get document by ID
  const getDocumentById = useCallback(async (documentId: string) => {
    setCurrentDocumentLoading(true);
    setCurrentDocumentError(null);
    
    try {
      const document = await documentService.getDocumentById(documentId);
      setCurrentDocument(document);
    } catch (error) {
      setCurrentDocumentError(error as Error);
      console.error(`Error fetching document with ID ${documentId}:`, error);
    } finally {
      setCurrentDocumentLoading(false);
    }
  }, []);
  
  // Get templates
  const getTemplates = useCallback(async (category?: string) => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    
    try {
      // For development, use mock data
      const templates = await documentService.mockGetTemplates(category);
      setTemplates(templates);
    } catch (error) {
      setTemplatesError(error as Error);
      console.error('Error fetching templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);
  
  // Get template by ID
  const getTemplateById = useCallback(async (templateId: string) => {
    try {
      return await documentService.getTemplateById(templateId);
    } catch (error) {
      console.error(`Error fetching template with ID ${templateId}:`, error);
      throw error;
    }
  }, []);
  
  // Create document
  const createDocument = useCallback(async (options: DocumentGenerationOptions) => {
    try {
      // For development, use mock data
      const document = await documentService.mockGenerateDocument(options);
      return document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }, []);
  
  // Update document
  const updateDocument = useCallback(async (documentId: string, document: Partial<Document>) => {
    try {
      const updatedDocument = await documentService.updateDocument(documentId, document);
      
      // Update current document if it's the one being updated
      if (currentDocument && currentDocument.id === documentId) {
        setCurrentDocument(updatedDocument);
      }
      
      // Update documents list if it contains the updated document
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.id === documentId ? updatedDocument : doc
        )
      );
      
      return updatedDocument;
    } catch (error) {
      console.error(`Error updating document with ID ${documentId}:`, error);
      throw error;
    }
  }, [currentDocument]);
  
  // Delete document
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId);
      
      // Remove from documents list
      setDocuments(prevDocuments => 
        prevDocuments.filter(doc => doc.id !== documentId)
      );
      
      // Reset current document if it's the one being deleted
      if (currentDocument && currentDocument.id === documentId) {
        setCurrentDocument(null);
      }
    } catch (error) {
      console.error(`Error deleting document with ID ${documentId}:`, error);
      throw error;
    }
  }, [currentDocument]);
  
  // Send for signature
  const sendForSignature = useCallback(async (documentId: string, message?: string) => {
    try {
      const updatedDocument = await documentService.sendForSignature(documentId, message);
      
      // Update current document if it's the one being sent
      if (currentDocument && currentDocument.id === documentId) {
        setCurrentDocument(updatedDocument);
      }
      
      // Update documents list if it contains the updated document
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.id === documentId ? updatedDocument : doc
        )
      );
      
      return updatedDocument;
    } catch (error) {
      console.error(`Error sending document ${documentId} for signature:`, error);
      throw error;
    }
  }, [currentDocument]);
  
  // Sign document
  const signDocument = useCallback(async (documentId: string, signatureData: string) => {
    try {
      const updatedDocument = await documentService.signDocument(documentId, signatureData);
      
      // Update current document if it's the one being signed
      if (currentDocument && currentDocument.id === documentId) {
        setCurrentDocument(updatedDocument);
      }
      
      // Update documents list if it contains the updated document
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.id === documentId ? updatedDocument : doc
        )
      );
      
      return updatedDocument;
    } catch (error) {
      console.error(`Error signing document ${documentId}:`, error);
      throw error;
    }
  }, [currentDocument]);
  
  // Reject document
  const rejectDocument = useCallback(async (documentId: string, reason: string) => {
    try {
      const updatedDocument = await documentService.rejectDocument(documentId, reason);
      
      // Update current document if it's the one being rejected
      if (currentDocument && currentDocument.id === documentId) {
        setCurrentDocument(updatedDocument);
      }
      
      // Update documents list if it contains the updated document
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.id === documentId ? updatedDocument : doc
        )
      );
      
      return updatedDocument;
    } catch (error) {
      console.error(`Error rejecting document ${documentId}:`, error);
      throw error;
    }
  }, [currentDocument]);
  
  // Send reminder
  const sendReminder = useCallback(async (documentId: string, userIds?: string[]) => {
    try {
      await documentService.sendReminder(documentId, userIds);
    } catch (error) {
      console.error(`Error sending reminder for document ${documentId}:`, error);
      throw error;
    }
  }, []);
  
  // Archive document
  const archiveDocument = useCallback(async (documentId: string) => {
    try {
      const updatedDocument = await documentService.archiveDocument(documentId);
      
      // Update current document if it's the one being archived
      if (currentDocument && currentDocument.id === documentId) {
        setCurrentDocument(updatedDocument);
      }
      
      // Update documents list if it contains the updated document
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.id === documentId ? updatedDocument : doc
        )
      );
      
      return updatedDocument;
    } catch (error) {
      console.error(`Error archiving document ${documentId}:`, error);
      throw error;
    }
  }, [currentDocument]);
  
  // Restore document
  const restoreDocument = useCallback(async (documentId: string) => {
    try {
      const updatedDocument = await documentService.restoreDocument(documentId);
      
      // Update current document if it's the one being restored
      if (currentDocument && currentDocument.id === documentId) {
        setCurrentDocument(updatedDocument);
      }
      
      // Update documents list if it contains the updated document
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.id === documentId ? updatedDocument : doc
        )
      );
      
      return updatedDocument;
    } catch (error) {
      console.error(`Error restoring document ${documentId}:`, error);
      throw error;
    }
  }, [currentDocument]);
  
  // Download document
  const downloadDocument = useCallback(async (documentId: string) => {
    try {
      const blob = await documentService.downloadDocument(documentId);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // Get the document name from the current document or use a default
      const documentName = currentDocument && currentDocument.id === documentId
        ? currentDocument.name
        : `document-${documentId}`;
      
      // Set the download attribute with the document name
      link.setAttribute('download', `${documentName}.pdf`);
      
      // Append the link to the body
      document.body.appendChild(link);
      
      // Click the link to start the download
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading document ${documentId}:`, error);
      throw error;
    }
  }, [currentDocument]);
  
  // Upload document
  const uploadDocument = useCallback(async (file: File, metadata: {
    name: string;
    description?: string;
    documentType: DocumentType;
    visibility?: DocumentVisibility;
    signatories?: Omit<Signatory, 'status' | 'signedAt' | 'signatureId' | 'signatureUrl' | 'remindersSent' | 'lastReminderSent'>[];
    tags?: string[];
  }) => {
    try {
      const document = await documentService.uploadDocument(file, metadata);
      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }, []);
  
  // Get statistics
  const getStatistics = useCallback(async (userId?: string) => {
    setStatisticsLoading(true);
    setStatisticsError(null);
    
    try {
      const stats = await documentService.getDocumentStatistics(userId);
      setStatistics(stats);
    } catch (error) {
      setStatisticsError(error as Error);
      console.error('Error fetching document statistics:', error);
    } finally {
      setStatisticsLoading(false);
    }
  }, []);
  
  // Reset current document
  const resetCurrentDocument = useCallback(() => {
    setCurrentDocument(null);
    setCurrentDocumentLoading(false);
    setCurrentDocumentError(null);
  }, []);
  
  // Reset errors
  const resetErrors = useCallback(() => {
    setDocumentsError(null);
    setTemplatesError(null);
    setCurrentDocumentError(null);
    setStatisticsError(null);
  }, []);
  
  return {
    // Documents state
    documents,
    documentsLoading,
    documentsError,
    documentsPagination,
    
    // Document templates state
    templates,
    templatesLoading,
    templatesError,
    
    // Current document state
    currentDocument,
    currentDocumentLoading,
    currentDocumentError,
    
    // Document filters
    filters,
    setFilters,
    
    // Document actions
    getDocuments,
    getDocumentById,
    getTemplates,
    getTemplateById,
    createDocument,
    updateDocument,
    deleteDocument,
    sendForSignature,
    signDocument,
    rejectDocument,
    sendReminder,
    archiveDocument,
    restoreDocument,
    downloadDocument,
    uploadDocument,
    
    // Document statistics
    statistics,
    statisticsLoading,
    statisticsError,
    getStatistics,
    
    // Reset states
    resetCurrentDocument,
    resetErrors
  };
};

export default useDocuments; 