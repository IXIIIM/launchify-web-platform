import { Document, Signatory } from './DocumentService';
import { API_BASE_URL } from '../config/constants';
import { SignatureRequest, SignatureData, SignatureVerification, AuditEvent } from '../types/signature';

export type { SignatureRequest, SignatureData, SignatureVerification, AuditEvent };

export class SignatureService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/signatures`;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
  }

  async createSignatureRequest(
    documentId: string,
    signatories: string[],
    expirationDate?: Date
  ): Promise<SignatureRequest> {
    try {
      // For development/testing, return mock data
      return this.mockCreateSignatureRequest(documentId, signatories, expirationDate);

      // For production:
      // const response = await fetch(`${this.baseUrl}/requests`, {
      //   method: 'POST',
      //   headers: this.headers,
      //   body: JSON.stringify({
      //     documentId,
      //     signatories,
      //     expirationDate: expirationDate?.toISOString()
      //   })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to create signature request: ${response.statusText}`);
      // }
      // 
      // return await response.json();
    } catch (error) {
      console.error('Error creating signature request:', error);
      throw error;
    }
  }

  async getSignatureRequests(status: 'pending' | 'completed' | 'canceled' | 'expired' | 'all' = 'all'): Promise<SignatureRequest[]> {
    try {
      // For development/testing, return mock data
      return this.mockGetSignatureRequests(status);

      // For production:
      // const response = await fetch(`${this.baseUrl}/requests?status=${status}`, {
      //   method: 'GET',
      //   headers: this.headers
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to fetch signature requests: ${response.statusText}`);
      // }
      // 
      // return await response.json();
    } catch (error) {
      console.error('Error fetching signature requests:', error);
      throw error;
    }
  }

  async getSignatureRequestById(requestId: string): Promise<SignatureRequest> {
    try {
      // For development/testing, return mock data
      return this.mockGetSignatureRequestById(requestId);

      // For production:
      // const response = await fetch(`${this.baseUrl}/requests/${requestId}`, {
      //   method: 'GET',
      //   headers: this.headers
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to fetch signature request: ${response.statusText}`);
      // }
      // 
      // return await response.json();
    } catch (error) {
      console.error(`Error fetching signature request ${requestId}:`, error);
      throw error;
    }
  }

  async cancelSignatureRequest(requestId: string): Promise<boolean> {
    try {
      // For development/testing, return mock data
      return this.mockCancelSignatureRequest(requestId);

      // For production:
      // const response = await fetch(`${this.baseUrl}/requests/${requestId}/cancel`, {
      //   method: 'POST',
      //   headers: this.headers
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to cancel signature request: ${response.statusText}`);
      // }
      // 
      // return true;
    } catch (error) {
      console.error(`Error canceling signature request ${requestId}:`, error);
      throw error;
    }
  }

  async sendReminder(requestId: string, signatoryEmail: string): Promise<boolean> {
    try {
      // For development/testing, return mock data
      return this.mockSendReminder(requestId, signatoryEmail);

      // For production:
      // const response = await fetch(`${this.baseUrl}/requests/${requestId}/remind`, {
      //   method: 'POST',
      //   headers: this.headers,
      //   body: JSON.stringify({ email: signatoryEmail })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to send reminder: ${response.statusText}`);
      // }
      // 
      // return true;
    } catch (error) {
      console.error(`Error sending reminder for request ${requestId}:`, error);
      throw error;
    }
  }

  async signDocument(
    requestId: string,
    signatureData: SignatureData,
    verificationCode?: string
  ): Promise<boolean> {
    try {
      // For development/testing, return mock data
      return this.mockSignDocument(requestId, signatureData, verificationCode);

      // For production:
      // const response = await fetch(`${this.baseUrl}/requests/${requestId}/sign`, {
      //   method: 'POST',
      //   headers: this.headers,
      //   body: JSON.stringify({
      //     signatureData,
      //     verificationCode
      //   })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to sign document: ${response.statusText}`);
      // }
      // 
      // return true;
    } catch (error) {
      console.error(`Error signing document for request ${requestId}:`, error);
      throw error;
    }
  }

  async declineToSign(requestId: string, reason: string): Promise<boolean> {
    try {
      // For development/testing, return mock data
      return this.mockDeclineToSign(requestId, reason);

      // For production:
      // const response = await fetch(`${this.baseUrl}/requests/${requestId}/decline`, {
      //   method: 'POST',
      //   headers: this.headers,
      //   body: JSON.stringify({ reason })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to decline signature: ${response.statusText}`);
      // }
      // 
      // return true;
    } catch (error) {
      console.error(`Error declining signature for request ${requestId}:`, error);
      throw error;
    }
  }

  async sendVerificationCode(requestId: string, signatoryEmail: string): Promise<boolean> {
    try {
      // For development/testing, return mock data
      return this.mockSendVerificationCode(requestId, signatoryEmail);

      // For production:
      // const response = await fetch(`${this.baseUrl}/requests/${requestId}/verify/send`, {
      //   method: 'POST',
      //   headers: this.headers,
      //   body: JSON.stringify({ email: signatoryEmail })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to send verification code: ${response.statusText}`);
      // }
      // 
      // return true;
    } catch (error) {
      console.error(`Error sending verification code for request ${requestId}:`, error);
      throw error;
    }
  }

  async verifyCode(requestId: string, code: string): Promise<SignatureVerification> {
    try {
      // For development/testing, return mock data
      return this.mockVerifyCode(requestId, code);

      // For production:
      // const response = await fetch(`${this.baseUrl}/requests/${requestId}/verify/check`, {
      //   method: 'POST',
      //   headers: this.headers,
      //   body: JSON.stringify({ code })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to verify code: ${response.statusText}`);
      // }
      // 
      // return await response.json();
    } catch (error) {
      console.error(`Error verifying code for request ${requestId}:`, error);
      throw error;
    }
  }

  async getAuditTrail(documentId: string): Promise<AuditEvent[]> {
    try {
      // For development/testing, return mock data
      return this.mockGetAuditTrail(documentId);

      // For production:
      // const response = await fetch(`${this.baseUrl}/documents/${documentId}/audit`, {
      //   method: 'GET',
      //   headers: this.headers
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to fetch audit trail: ${response.statusText}`);
      // }
      // 
      // return await response.json();
    } catch (error) {
      console.error(`Error fetching audit trail for document ${documentId}:`, error);
      throw error;
    }
  }

  async downloadSignedDocument(documentId: string): Promise<void> {
    try {
      // For development/testing, mock the download
      this.mockDownloadSignedDocument(documentId);

      // For production:
      // const response = await fetch(`${this.baseUrl}/documents/${documentId}/download`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Failed to download document: ${response.statusText}`);
      // }
      // 
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `document-${documentId}.pdf`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
    } catch (error) {
      console.error(`Error downloading document ${documentId}:`, error);
      throw error;
    }
  }

  // Mock implementations for development/testing
  private mockCreateSignatureRequest(
    documentId: string,
    signatories: string[],
    expirationDate?: Date
  ): SignatureRequest {
    const now = new Date();
    const expires = expirationDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    return {
      id: `sig-req-${Math.random().toString(36).substring(2, 11)}`,
      documentId,
      documentTitle: `Document ${documentId}`,
      status: 'pending',
      createdAt: now,
      expiresAt: expires,
      signatories: signatories.map(email => ({
        email,
        name: email.split('@')[0],
        status: 'pending'
      }))
    };
  }

  private mockGetSignatureRequests(status: string): SignatureRequest[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const mockRequests: SignatureRequest[] = [
      {
        id: 'sig-req-1',
        documentId: 'doc-1',
        documentTitle: 'Investment Agreement',
        status: 'pending',
        createdAt: yesterday,
        expiresAt: nextWeek,
        signatories: [
          { email: 'investor@example.com', name: 'John Investor', status: 'pending' },
          { email: 'founder@example.com', name: 'Jane Founder', status: 'signed', signedAt: now }
        ]
      },
      {
        id: 'sig-req-2',
        documentId: 'doc-2',
        documentTitle: 'NDA Agreement',
        status: 'completed',
        createdAt: yesterday,
        signatories: [
          { email: 'partner@example.com', name: 'Partner Corp', status: 'signed', signedAt: now },
          { email: 'founder@example.com', name: 'Jane Founder', status: 'signed', signedAt: now }
        ]
      },
      {
        id: 'sig-req-3',
        documentId: 'doc-3',
        documentTitle: 'Term Sheet',
        status: 'canceled',
        createdAt: yesterday,
        expiresAt: tomorrow,
        signatories: [
          { email: 'investor@example.com', name: 'John Investor', status: 'pending' },
          { email: 'founder@example.com', name: 'Jane Founder', status: 'pending' }
        ]
      },
      {
        id: 'sig-req-4',
        documentId: 'doc-4',
        documentTitle: 'SAFE Agreement',
        status: 'expired',
        createdAt: yesterday,
        expiresAt: yesterday,
        signatories: [
          { email: 'investor@example.com', name: 'John Investor', status: 'pending' },
          { email: 'founder@example.com', name: 'Jane Founder', status: 'pending' }
        ]
      }
    ];

    if (status === 'all') {
      return mockRequests;
    }

    return mockRequests.filter(req => req.status === status);
  }

  private mockGetSignatureRequestById(requestId: string): SignatureRequest {
    const mockRequests = this.mockGetSignatureRequests('all');
    const request = mockRequests.find(req => req.id === requestId);

    if (!request) {
      throw new Error(`Signature request with ID ${requestId} not found`);
    }

    return request;
  }

  private mockCancelSignatureRequest(requestId: string): boolean {
    // In a real implementation, this would update the database
    console.log(`Canceling signature request ${requestId}`);
    return true;
  }

  private mockSendReminder(requestId: string, signatoryEmail: string): boolean {
    // In a real implementation, this would send an email
    console.log(`Sending reminder for request ${requestId} to ${signatoryEmail}`);
    return true;
  }

  private mockSignDocument(
    requestId: string,
    signatureData: SignatureData,
    verificationCode?: string
  ): boolean {
    // In a real implementation, this would update the document with the signature
    console.log(`Signing document for request ${requestId} with ${signatureData.type} signature`);
    return true;
  }

  private mockDeclineToSign(requestId: string, reason: string): boolean {
    // In a real implementation, this would update the signature request status
    console.log(`Declining to sign request ${requestId} with reason: ${reason}`);
    return true;
  }

  private mockSendVerificationCode(requestId: string, signatoryEmail: string): boolean {
    // In a real implementation, this would send a verification code via email or SMS
    console.log(`Sending verification code for request ${requestId} to ${signatoryEmail}`);
    return true;
  }

  private mockVerifyCode(requestId: string, code: string): SignatureVerification {
    // In a real implementation, this would check the code against the database
    // For testing, we'll accept "123456" as a valid code
    const isValid = code === '123456';
    
    return {
      verified: isValid,
      message: isValid ? 'Verification successful' : 'Invalid verification code',
      expiresAt: isValid ? new Date(Date.now() + 15 * 60 * 1000) : undefined // 15 minutes
    };
  }

  private mockGetAuditTrail(documentId: string): AuditEvent[] {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    return [
      {
        id: `audit-1-${documentId}`,
        timestamp: threeHoursAgo,
        type: 'created',
        user: {
          id: 'user-1',
          name: 'Jane Founder',
          email: 'founder@example.com'
        },
        ipAddress: '192.168.1.1'
      },
      {
        id: `audit-2-${documentId}`,
        timestamp: twoHoursAgo,
        type: 'sent',
        user: {
          id: 'user-1',
          name: 'Jane Founder',
          email: 'founder@example.com'
        },
        details: 'Signature request sent to investor@example.com',
        ipAddress: '192.168.1.1'
      },
      {
        id: `audit-3-${documentId}`,
        timestamp: oneHourAgo,
        type: 'viewed',
        user: {
          id: 'user-2',
          name: 'John Investor',
          email: 'investor@example.com'
        },
        ipAddress: '192.168.1.2'
      },
      {
        id: `audit-4-${documentId}`,
        timestamp: now,
        type: 'signed',
        user: {
          id: 'user-2',
          name: 'John Investor',
          email: 'investor@example.com'
        },
        details: 'Signed using drawn signature',
        ipAddress: '192.168.1.2'
      }
    ];
  }

  private mockDownloadSignedDocument(documentId: string): void {
    // In a real implementation, this would download the actual document
    console.log(`Downloading signed document ${documentId}`);
    
    // Create a simple PDF-like blob for testing
    const blob = new Blob(['Mock signed document content'], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed-document-${documentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
} 