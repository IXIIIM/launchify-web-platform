// src/types/escrow.ts

export type EscrowStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DISPUTED';
export type MilestoneStatus = 'PENDING' | 'APPROVED' | 'RELEASED' | 'DISPUTED';

export interface Milestone {
  id: string;
  escrowAccountId: string;
  amount: number;
  description: string;
  dueDate: Date;
  status: MilestoneStatus;
  proofOfWork?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowAccount {
  id: string;
  entrepreneurId: string;
  funderId: string;
  totalAmount: number;
  escrowFee: number;
  status: EscrowStatus;
  stripeAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
  milestones: Milestone[];
}

export interface EscrowTransaction {
  id: string;
  escrowAccountId: string;
  amount: number;
  type: 'DEPOSIT' | 'RELEASE' | 'REFUND' | 'FEE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  stripePaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}