export interface SignatureRequest {
  id: string;
  documentId: string;
  documentTitle: string;
  status: 'pending' | 'completed' | 'canceled' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  signatories: {
    email: string;
    name: string;
    status: 'pending' | 'signed' | 'declined';
    signedAt?: Date;
    declinedReason?: string;
  }[];
}

export interface SignatureData {
  type: 'drawn' | 'typed' | 'uploaded';
  data: string; // Base64 encoded image for drawn/uploaded, or text for typed
  position?: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SignatureVerification {
  verified: boolean;
  message?: string;
  expiresAt?: Date;
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: 'created' | 'viewed' | 'edited' | 'signed' | 'declined' | 'sent' | 'canceled' | 'reminded';
  user: {
    id: string;
    name: string;
    email: string;
  };
  details?: string;
  ipAddress?: string;
} 