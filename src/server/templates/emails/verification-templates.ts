// src/server/templates/emails/verification-templates.ts
import { verificationApprovedTemplate } from './verification-approved';
import { verificationRejectedTemplate } from './verification-rejected';
import { verificationInfoRequestedTemplate } from './verification-info-requested';
import { verificationRequestAdminTemplate } from './verification-request-admin';

export const verificationTemplates = {
  approved: verificationApprovedTemplate,
  rejected: verificationRejectedTemplate,
  infoRequested: verificationInfoRequestedTemplate,
  adminNotification: verificationRequestAdminTemplate
};

export interface VerificationEmailData {
  name: string;
  type: string;
  notes?: string;
  benefits?: string[];
  message?: string;
  requiredDocuments?: string[];
  uploadUrl?: string;
  verificationGuideUrl?: string;
  profileUrl?: string;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    size: string;
  }>;
  metadata?: any;
  requestId?: string;
  submittedAt?: string;
  userEmail?: string;
  userType?: string;
  subscription?: string;
  isPriority?: boolean;
  userHistory?: {
    accountStatus: 'active' | 'warning' | 'blocked';
    memberSince: string;
    previousVerifications: number;
    lastVerificationAttempt?: string;
    reportedIssues: number;
  };
  reviewUrl?: string;
  userProfileUrl?: string;
}

export const getVerificationEmailTemplate = (
  type: keyof typeof verificationTemplates,
  data: VerificationEmailData
) => {
  const template = verificationTemplates[type];
  if (!template) {
    throw new Error(`Invalid verification email template type: ${type}`);
  }
  return template;
};