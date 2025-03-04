// Comment out axios import since we're not using it yet
// import axios from 'axios';

// Verification level definitions
export enum VerificationLevel {
  NONE = 0,
  BASIC = 1,
  ADVANCED = 2,
  PREMIUM = 3
}

// Verification status types
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

// Verification type definitions
export enum VerificationType {
  IDENTITY = 'identity',
  BUSINESS = 'business',
  FINANCIAL = 'financial',
  BACKGROUND = 'background',
  PROFESSIONAL = 'professional'
}

// Verification request interface
export interface VerificationRequest {
  id: string;
  userId: string;
  type: VerificationType;
  status: VerificationStatus;
  submittedAt: string;
  updatedAt: string;
  expiresAt?: string;
  documentIds: string[];
  notes?: string;
  rejectionReason?: string;
}

// User verification status interface
export interface UserVerificationStatus {
  userId: string;
  currentLevel: VerificationLevel;
  verifications: {
    [key in VerificationType]?: {
      status: VerificationStatus;
      lastUpdated: string;
      expiresAt?: string;
      documentIds: string[];
    }
  };
  overallStatus: VerificationStatus;
  nextRequirements?: VerificationType[];
}

// Document interface
export interface VerificationDocument {
  id: string;
  userId: string;
  verificationType: VerificationType;
  filename: string;
  fileType: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

// Requirements for each verification level
export const VERIFICATION_REQUIREMENTS: Record<VerificationLevel, VerificationType[]> = {
  [VerificationLevel.NONE]: [],
  [VerificationLevel.BASIC]: [VerificationType.IDENTITY],
  [VerificationLevel.ADVANCED]: [VerificationType.IDENTITY, VerificationType.BUSINESS],
  [VerificationLevel.PREMIUM]: [
    VerificationType.IDENTITY, 
    VerificationType.BUSINESS, 
    VerificationType.FINANCIAL
  ]
};

// Mock verification data for development
const MOCK_VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: 'vr-001',
    userId: 'user-001',
    type: VerificationType.IDENTITY,
    status: 'approved',
    submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    documentIds: ['doc-001', 'doc-002'],
  },
  {
    id: 'vr-002',
    userId: 'user-001',
    type: VerificationType.BUSINESS,
    status: 'approved',
    submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    documentIds: ['doc-003'],
  },
  {
    id: 'vr-003',
    userId: 'user-001',
    type: VerificationType.FINANCIAL,
    status: 'pending',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    documentIds: ['doc-004', 'doc-005'],
  },
  {
    id: 'vr-004',
    userId: 'user-002',
    type: VerificationType.IDENTITY,
    status: 'approved',
    submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    documentIds: ['doc-006'],
  },
  {
    id: 'vr-005',
    userId: 'user-002',
    type: VerificationType.BUSINESS,
    status: 'rejected',
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    documentIds: ['doc-007'],
    rejectionReason: 'Documents provided are outdated. Please provide current business registration.',
  }
];

const MOCK_DOCUMENTS: VerificationDocument[] = [
  {
    id: 'doc-001',
    userId: 'user-001',
    verificationType: VerificationType.IDENTITY,
    filename: 'passport.jpg',
    fileType: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'approved',
  },
  {
    id: 'doc-002',
    userId: 'user-001',
    verificationType: VerificationType.IDENTITY,
    filename: 'drivers_license.jpg',
    fileType: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'approved',
  },
  {
    id: 'doc-003',
    userId: 'user-001',
    verificationType: VerificationType.BUSINESS,
    filename: 'business_registration.pdf',
    fileType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'approved',
  },
  {
    id: 'doc-004',
    userId: 'user-001',
    verificationType: VerificationType.FINANCIAL,
    filename: 'bank_statement.pdf',
    fileType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'doc-005',
    userId: 'user-001',
    verificationType: VerificationType.FINANCIAL,
    filename: 'tax_return.pdf',
    fileType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'doc-006',
    userId: 'user-002',
    verificationType: VerificationType.IDENTITY,
    filename: 'national_id.jpg',
    fileType: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'approved',
  },
  {
    id: 'doc-007',
    userId: 'user-002',
    verificationType: VerificationType.BUSINESS,
    filename: 'business_license.pdf',
    fileType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'rejected',
    notes: 'Document is expired. Please provide current business registration.',
  }
];

// Verification service class
class VerificationService {
  // Get user verification status
  async getUserVerificationStatus(userId: string): Promise<UserVerificationStatus> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get(`/api/verification/status/${userId}`);
      // return response.data;
      
      // For development, use mock data
      const requests = MOCK_VERIFICATION_REQUESTS.filter(req => req.userId === userId);
      
      // Calculate current verification level
      let currentLevel = VerificationLevel.NONE;
      
      const verifications: UserVerificationStatus['verifications'] = {};
      
      // Process each verification type
      Object.values(VerificationType).forEach((type: VerificationType) => {
        const typeRequests = requests.filter(req => req.type === type);
        if (typeRequests.length > 0) {
          // Get the most recent request
          const latestRequest = typeRequests.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          
          verifications[type] = {
            status: latestRequest.status,
            lastUpdated: latestRequest.updatedAt,
            expiresAt: latestRequest.expiresAt,
            documentIds: latestRequest.documentIds
          };
        }
      });
      
      // Determine current level based on approved verifications
      if (verifications[VerificationType.IDENTITY]?.status === 'approved') {
        currentLevel = VerificationLevel.BASIC;
        
        if (verifications[VerificationType.BUSINESS]?.status === 'approved') {
          currentLevel = VerificationLevel.ADVANCED;
          
          if (verifications[VerificationType.FINANCIAL]?.status === 'approved') {
            currentLevel = VerificationLevel.PREMIUM;
          }
        }
      }
      
      // Determine overall status
      let overallStatus: VerificationStatus = 'pending';
      const statuses = Object.values(verifications).map(v => v.status);
      
      if (statuses.length === 0) {
        overallStatus = 'pending';
      } else if (statuses.some(s => s === 'rejected')) {
        overallStatus = 'rejected';
      } else if (statuses.every(s => s === 'approved')) {
        overallStatus = 'approved';
      } else if (statuses.some(s => s === 'expired')) {
        overallStatus = 'expired';
      } else {
        overallStatus = 'pending';
      }
      
      // Determine next requirements
      const nextRequirements: VerificationType[] = [];
      
      if (currentLevel < VerificationLevel.PREMIUM) {
        const nextLevel = currentLevel + 1 as VerificationLevel;
        const requirements = VERIFICATION_REQUIREMENTS[nextLevel];
        
        requirements.forEach((type: VerificationType) => {
          if (!verifications[type] || verifications[type]?.status !== 'approved') {
            nextRequirements.push(type);
          }
        });
      }
      
      return {
        userId,
        currentLevel,
        verifications,
        overallStatus,
        nextRequirements: nextRequirements.length > 0 ? nextRequirements : undefined
      };
    } catch (error) {
      console.error('Error fetching verification status:', error);
      throw error;
    }
  }
  
  // Get verification requests for a user
  async getVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get(`/api/verification/requests/${userId}`);
      // return response.data;
      
      // For development, use mock data
      return MOCK_VERIFICATION_REQUESTS.filter(req => req.userId === userId);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      throw error;
    }
  }
  
  // Get a specific verification request
  async getVerificationRequest(requestId: string): Promise<VerificationRequest | null> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get(`/api/verification/request/${requestId}`);
      // return response.data;
      
      // For development, use mock data
      const request = MOCK_VERIFICATION_REQUESTS.find(req => req.id === requestId);
      return request || null;
    } catch (error) {
      console.error('Error fetching verification request:', error);
      throw error;
    }
  }
  
  // Submit a new verification request
  async submitVerificationRequest(
    userId: string, 
    type: VerificationType, 
    documentIds: string[]
  ): Promise<VerificationRequest> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.post('/api/verification/request', {
      //   userId,
      //   type,
      //   documentIds
      // });
      // return response.data;
      
      // For development, create a mock request
      const newRequest: VerificationRequest = {
        id: `vr-${Math.floor(Math.random() * 1000)}`,
        userId,
        type,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentIds,
      };
      
      // In a real app, this would be saved to the database
      MOCK_VERIFICATION_REQUESTS.push(newRequest);
      
      return newRequest;
    } catch (error) {
      console.error('Error submitting verification request:', error);
      throw error;
    }
  }
  
  // Upload a document for verification
  async uploadDocument(
    userId: string,
    verificationType: VerificationType,
    file: File
  ): Promise<VerificationDocument> {
    try {
      // In a real app, this would be an API call with file upload
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('userId', userId);
      // formData.append('verificationType', verificationType);
      // 
      // const response = await axios.post('/api/verification/document/upload', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data'
      //   }
      // });
      // return response.data;
      
      // For development, create a mock document
      const newDocument: VerificationDocument = {
        id: `doc-${Math.floor(Math.random() * 1000)}`,
        userId,
        verificationType,
        filename: file.name,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'pending'
      };
      
      // In a real app, this would be saved to the database
      MOCK_DOCUMENTS.push(newDocument);
      
      return newDocument;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }
  
  // Get documents for a user
  async getUserDocuments(userId: string): Promise<VerificationDocument[]> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get(`/api/verification/documents/${userId}`);
      // return response.data;
      
      // For development, use mock data
      return MOCK_DOCUMENTS.filter(doc => doc.userId === userId);
    } catch (error) {
      console.error('Error fetching user documents:', error);
      throw error;
    }
  }
  
  // Get documents for a specific verification request
  async getRequestDocuments(requestId: string): Promise<VerificationDocument[]> {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get(`/api/verification/request/${requestId}/documents`);
      // return response.data;
      
      // For development, use mock data
      const request = MOCK_VERIFICATION_REQUESTS.find(req => req.id === requestId);
      if (!request) {
        return [];
      }
      
      return MOCK_DOCUMENTS.filter(doc => request.documentIds.includes(doc.id));
    } catch (error) {
      console.error('Error fetching request documents:', error);
      throw error;
    }
  }
  
  // Get verification level name
  getVerificationLevelName(level: VerificationLevel): string {
    switch (level) {
      case VerificationLevel.NONE:
        return 'Not Verified';
      case VerificationLevel.BASIC:
        return 'Basic Verification';
      case VerificationLevel.ADVANCED:
        return 'Advanced Verification';
      case VerificationLevel.PREMIUM:
        return 'Premium Verification';
      default:
        return 'Unknown';
    }
  }
  
  // Get verification type name
  getVerificationTypeName(type: VerificationType): string {
    switch (type) {
      case VerificationType.IDENTITY:
        return 'Identity Verification';
      case VerificationType.BUSINESS:
        return 'Business Verification';
      case VerificationType.FINANCIAL:
        return 'Financial Verification';
      case VerificationType.BACKGROUND:
        return 'Background Check';
      case VerificationType.PROFESSIONAL:
        return 'Professional Credentials';
      default:
        return 'Unknown';
    }
  }
  
  // Get verification requirements description
  getVerificationRequirements(type: VerificationType): string[] {
    switch (type) {
      case VerificationType.IDENTITY:
        return [
          'Government-issued photo ID (passport, driver\'s license, or national ID)',
          'Proof of address (utility bill, bank statement, etc.)',
          'Selfie with ID document'
        ];
      case VerificationType.BUSINESS:
        return [
          'Business registration certificate',
          'Tax identification documents',
          'Proof of business address',
          'Articles of incorporation or equivalent'
        ];
      case VerificationType.FINANCIAL:
        return [
          'Bank statements (last 3 months)',
          'Financial statements or tax returns',
          'Proof of funds or investment capability',
          'Credit report or equivalent'
        ];
      case VerificationType.BACKGROUND:
        return [
          'Criminal background check consent',
          'Employment history verification',
          'Education verification'
        ];
      case VerificationType.PROFESSIONAL:
        return [
          'Professional licenses or certifications',
          'Industry association memberships',
          'References from industry professionals'
        ];
      default:
        return ['Requirements not specified'];
    }
  }
}

export default new VerificationService(); 