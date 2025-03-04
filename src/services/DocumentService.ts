import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Document types
export enum DocumentType {
  NDA = 'NDA',
  INVESTMENT_AGREEMENT = 'INVESTMENT_AGREEMENT',
  TERM_SHEET = 'TERM_SHEET',
  PITCH_DECK = 'PITCH_DECK',
  BUSINESS_PLAN = 'BUSINESS_PLAN',
  FINANCIAL_STATEMENT = 'FINANCIAL_STATEMENT',
  CUSTOM = 'CUSTOM'
}

// Document status
export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

// Document visibility
export enum DocumentVisibility {
  PRIVATE = 'PRIVATE',
  SHARED = 'SHARED',
  PUBLIC = 'PUBLIC'
}

// Document template
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  documentType: DocumentType;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  category: string;
}

// Document
export interface Document {
  id: string;
  name: string;
  description: string;
  documentType: DocumentType;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  expiresAt?: string;
  signatories: Signatory[];
  tags: string[];
  templateId?: string;
  version: number;
  previousVersions?: string[];
  fileUrl?: string;
  fileSize?: number;
  pageCount?: number;
  isTemplate: boolean;
}

// Signatory
export interface Signatory {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: 'PENDING' | 'SIGNED' | 'REJECTED';
  signedAt?: string;
  signatureId?: string;
  signatureUrl?: string;
  order: number;
  remindersSent: number;
  lastReminderSent?: string;
}

// Document filter
export interface DocumentFilter {
  documentType?: DocumentType;
  status?: DocumentStatus;
  visibility?: DocumentVisibility;
  createdBy?: string;
  signedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Document pagination
export interface DocumentPagination {
  page: number;
  limit: number;
  total: number;
}

// Document generation options
export interface DocumentGenerationOptions {
  templateId: string;
  name: string;
  description?: string;
  variables: Record<string, any>;
  signatories: Omit<Signatory, 'status' | 'signedAt' | 'signatureId' | 'signatureUrl' | 'remindersSent' | 'lastReminderSent'>[];
  expiresAt?: string;
  tags?: string[];
  visibility?: DocumentVisibility;
}

// Document service class
export class DocumentService {
  private apiUrl: string;
  private authToken?: string;

  constructor(apiUrl: string, authToken?: string) {
    this.apiUrl = apiUrl;
    this.authToken = authToken;
  }

  // Set auth token
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  // Get headers
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: this.authToken ? `Bearer ${this.authToken}` : '',
    };
  }

  // Get document templates
  async getTemplates(category?: string): Promise<DocumentTemplate[]> {
    try {
      const url = category 
        ? `${this.apiUrl}/document-templates?category=${category}`
        : `${this.apiUrl}/document-templates`;
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error fetching document templates:', error);
      throw error;
    }
  }

  // Get template by ID
  async getTemplateById(templateId: string): Promise<DocumentTemplate> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/document-templates/${templateId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching template with ID ${templateId}:`, error);
      throw error;
    }
  }

  // Create template
  async createTemplate(template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/document-templates`,
        template,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating document template:', error);
      throw error;
    }
  }

  // Update template
  async updateTemplate(templateId: string, template: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    try {
      const response = await axios.put(
        `${this.apiUrl}/document-templates/${templateId}`,
        template,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating template with ID ${templateId}:`, error);
      throw error;
    }
  }

  // Delete template
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.apiUrl}/document-templates/${templateId}`,
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error(`Error deleting template with ID ${templateId}:`, error);
      throw error;
    }
  }

  // Generate document from template
  async generateDocument(options: DocumentGenerationOptions): Promise<Document> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents/generate`,
        options,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating document:', error);
      throw error;
    }
  }

  // Get documents with filtering and pagination
  async getDocuments(
    filter: DocumentFilter = {},
    pagination: Omit<DocumentPagination, 'total'> = { page: 1, limit: 10 }
  ): Promise<{ documents: Document[]; pagination: DocumentPagination }> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter params
      if (filter.documentType) queryParams.append('documentType', filter.documentType);
      if (filter.status) queryParams.append('status', filter.status);
      if (filter.visibility) queryParams.append('visibility', filter.visibility);
      if (filter.createdBy) queryParams.append('createdBy', filter.createdBy);
      if (filter.signedBy) queryParams.append('signedBy', filter.signedBy);
      if (filter.dateFrom) queryParams.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) queryParams.append('dateTo', filter.dateTo);
      if (filter.search) queryParams.append('search', filter.search);
      if (filter.tags && filter.tags.length > 0) {
        filter.tags.forEach(tag => queryParams.append('tags', tag));
      }
      if (filter.sortBy) queryParams.append('sortBy', filter.sortBy);
      if (filter.sortOrder) queryParams.append('sortOrder', filter.sortOrder);
      
      // Add pagination params
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      const response = await axios.get(
        `${this.apiUrl}/documents?${queryParams.toString()}`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  // Get document by ID
  async getDocumentById(documentId: string): Promise<Document> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/documents/${documentId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching document with ID ${documentId}:`, error);
      throw error;
    }
  }

  // Update document
  async updateDocument(documentId: string, document: Partial<Document>): Promise<Document> {
    try {
      const response = await axios.put(
        `${this.apiUrl}/documents/${documentId}`,
        document,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating document with ID ${documentId}:`, error);
      throw error;
    }
  }

  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.apiUrl}/documents/${documentId}`,
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error(`Error deleting document with ID ${documentId}:`, error);
      throw error;
    }
  }

  // Send document for signature
  async sendForSignature(documentId: string, message?: string): Promise<Document> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents/${documentId}/send`,
        { message },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error sending document ${documentId} for signature:`, error);
      throw error;
    }
  }

  // Sign document
  async signDocument(documentId: string, signatureData: string): Promise<Document> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents/${documentId}/sign`,
        { signatureData },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error signing document ${documentId}:`, error);
      throw error;
    }
  }

  // Reject document
  async rejectDocument(documentId: string, reason: string): Promise<Document> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents/${documentId}/reject`,
        { reason },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error rejecting document ${documentId}:`, error);
      throw error;
    }
  }

  // Send reminder to signatories
  async sendReminder(documentId: string, userIds?: string[]): Promise<void> {
    try {
      await axios.post(
        `${this.apiUrl}/documents/${documentId}/remind`,
        { userIds },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error(`Error sending reminder for document ${documentId}:`, error);
      throw error;
    }
  }

  // Archive document
  async archiveDocument(documentId: string): Promise<Document> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents/${documentId}/archive`,
        {},
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error archiving document ${documentId}:`, error);
      throw error;
    }
  }

  // Restore archived document
  async restoreDocument(documentId: string): Promise<Document> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/documents/${documentId}/restore`,
        {},
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error restoring document ${documentId}:`, error);
      throw error;
    }
  }

  // Download document
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/documents/${documentId}/download`,
        { 
          headers: this.getHeaders(),
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error downloading document ${documentId}:`, error);
      throw error;
    }
  }

  // Get document audit trail
  async getDocumentAuditTrail(documentId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/documents/${documentId}/audit-trail`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching audit trail for document ${documentId}:`, error);
      throw error;
    }
  }

  // Upload document
  async uploadDocument(file: File, metadata: {
    name: string;
    description?: string;
    documentType: DocumentType;
    visibility?: DocumentVisibility;
    signatories?: Omit<Signatory, 'status' | 'signedAt' | 'signatureId' | 'signatureUrl' | 'remindersSent' | 'lastReminderSent'>[];
    tags?: string[];
  }): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await axios.post(
        `${this.apiUrl}/documents/upload`,
        formData,
        { 
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // Get document statistics
  async getDocumentStatistics(userId?: string): Promise<{
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
  }> {
    try {
      const url = userId 
        ? `${this.apiUrl}/documents/statistics?userId=${userId}`
        : `${this.apiUrl}/documents/statistics`;
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error fetching document statistics:', error);
      throw error;
    }
  }

  // Mock methods for local development and testing
  // These methods simulate API responses for development purposes

  // Mock get templates
  async mockGetTemplates(category?: string): Promise<DocumentTemplate[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const templates: DocumentTemplate[] = [
      {
        id: '1',
        name: 'Non-Disclosure Agreement',
        description: 'Standard NDA for protecting confidential information',
        documentType: DocumentType.NDA,
        content: 'This Non-Disclosure Agreement ("Agreement") is entered into by and between {{party1}} and {{party2}}...',
        variables: ['party1', 'party2', 'effectiveDate', 'term', 'jurisdiction'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
        category: 'Legal'
      },
      {
        id: '2',
        name: 'Investment Agreement',
        description: 'Standard investment agreement for seed funding',
        documentType: DocumentType.INVESTMENT_AGREEMENT,
        content: 'This Investment Agreement ("Agreement") is entered into by and between {{investor}} and {{company}}...',
        variables: ['investor', 'company', 'amount', 'equity', 'closingDate', 'jurisdiction'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
        category: 'Investment'
      },
      {
        id: '3',
        name: 'Term Sheet',
        description: 'Standard term sheet for investment negotiations',
        documentType: DocumentType.TERM_SHEET,
        content: 'This Term Sheet outlines the terms and conditions of the proposed investment by {{investor}} in {{company}}...',
        variables: ['investor', 'company', 'amount', 'valuation', 'equity', 'closingDate'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
        category: 'Investment'
      }
    ];
    
    if (category) {
      return templates.filter(template => template.category === category);
    }
    
    return templates;
  }

  // Mock generate document
  async mockGenerateDocument(options: DocumentGenerationOptions): Promise<Document> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const now = new Date().toISOString();
    
    return {
      id: uuidv4(),
      name: options.name,
      description: options.description || '',
      documentType: DocumentType.NDA, // Assuming template type
      content: 'Generated document content based on template and variables',
      createdBy: 'current-user-id',
      createdAt: now,
      updatedAt: now,
      status: DocumentStatus.DRAFT,
      visibility: options.visibility || DocumentVisibility.PRIVATE,
      signatories: options.signatories.map((signatory, index) => ({
        ...signatory,
        status: 'PENDING',
        remindersSent: 0,
        order: index + 1
      })) as Signatory[],
      tags: options.tags || [],
      templateId: options.templateId,
      version: 1,
      fileUrl: 'https://example.com/documents/sample.pdf',
      fileSize: 1024 * 1024, // 1MB
      pageCount: 5,
      isTemplate: false
    };
  }

  // Mock get documents
  async mockGetDocuments(
    filter: DocumentFilter = {},
    pagination: Omit<DocumentPagination, 'total'> = { page: 1, limit: 10 }
  ): Promise<{ documents: Document[]; pagination: DocumentPagination }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    
    const documents: Document[] = [
      {
        id: '1',
        name: 'NDA with Investor XYZ',
        description: 'Confidentiality agreement for project discussion',
        documentType: DocumentType.NDA,
        content: 'Document content...',
        createdBy: 'user-1',
        createdAt: now,
        updatedAt: now,
        status: DocumentStatus.PENDING_SIGNATURE,
        visibility: DocumentVisibility.SHARED,
        signatories: [
          {
            userId: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Entrepreneur',
            status: 'SIGNED',
            signedAt: now,
            signatureId: 'sig-1',
            signatureUrl: 'https://example.com/signatures/sig-1.png',
            order: 1,
            remindersSent: 0
          },
          {
            userId: 'user-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'Investor',
            status: 'PENDING',
            order: 2,
            remindersSent: 1,
            lastReminderSent: yesterday
          }
        ],
        tags: ['important', 'nda'],
        templateId: '1',
        version: 1,
        fileUrl: 'https://example.com/documents/nda-xyz.pdf',
        fileSize: 512 * 1024, // 512KB
        pageCount: 3,
        isTemplate: false
      },
      {
        id: '2',
        name: 'Investment Agreement - Seed Round',
        description: 'Seed round investment agreement',
        documentType: DocumentType.INVESTMENT_AGREEMENT,
        content: 'Document content...',
        createdBy: 'user-1',
        createdAt: yesterday,
        updatedAt: yesterday,
        status: DocumentStatus.DRAFT,
        visibility: DocumentVisibility.PRIVATE,
        signatories: [],
        tags: ['investment', 'draft'],
        templateId: '2',
        version: 1,
        isTemplate: false
      }
    ];
    
    // Apply filters
    let filteredDocuments = [...documents];
    
    if (filter.documentType) {
      filteredDocuments = filteredDocuments.filter(doc => doc.documentType === filter.documentType);
    }
    
    if (filter.status) {
      filteredDocuments = filteredDocuments.filter(doc => doc.status === filter.status);
    }
    
    if (filter.visibility) {
      filteredDocuments = filteredDocuments.filter(doc => doc.visibility === filter.visibility);
    }
    
    if (filter.createdBy) {
      filteredDocuments = filteredDocuments.filter(doc => doc.createdBy === filter.createdBy);
    }
    
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.name.toLowerCase().includes(searchLower) || 
        (doc.description && doc.description.toLowerCase().includes(searchLower))
      );
    }
    
    if (filter.tags && filter.tags.length > 0) {
      filteredDocuments = filteredDocuments.filter(doc => 
        filter.tags!.some(tag => doc.tags.includes(tag))
      );
    }
    
    // Apply pagination
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);
    
    return {
      documents: paginatedDocuments,
      pagination: {
        ...pagination,
        total: filteredDocuments.length
      }
    };
  }
}

export default DocumentService; 