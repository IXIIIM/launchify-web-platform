// src/server/services/escrow.ts

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const ESCROW_FEE_PERCENTAGE = 0.02; // 2%

export class EscrowService {
  async createEscrowAccount(entrepreneurId: string, funderId: string, amount: number) {
    const escrowFee = amount * ESCROW_FEE_PERCENTAGE;

    return prisma.escrowAccount.create({
      data: {
        entrepreneurId,
        funderId,
        totalAmount: amount,
        escrowFee,
        status: 'PENDING'
      }
    });
  }

  async handleDeposit(escrowAccountId: string, paymentMethodId: string) {
    const escrowAccount = await prisma.escrowAccount.findUnique({
      where: { id: escrowAccountId },
      include: { funder: true }
    });

    if (!escrowAccount) throw new Error('Escrow account not found');

    const totalAmount = escrowAccount.totalAmount + escrowAccount.escrowFee;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      transfer_data: {
        destination: process.env.PLATFORM_STRIPE_ACCOUNT!,
      },
    });

    await prisma.escrowTransaction.create({
      data: {
        escrowAccountId,
        amount: totalAmount,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        stripePaymentId: paymentIntent.id
      }
    });

    return prisma.escrowAccount.update({
      where: { id: escrowAccountId },
      data: { status: 'ACTIVE' }
    });
  }

  async createMilestone(escrowAccountId: string, data: {
    amount: number;
    description: string;
    dueDate: Date;
  }) {
    const escrowAccount = await prisma.escrowAccount.findUnique({
      where: { id: escrowAccountId }
    });

    if (!escrowAccount) throw new Error('Escrow account not found');

    const totalMilestoneAmount = await this.getTotalMilestoneAmount(escrowAccountId);
    if (totalMilestoneAmount + data.amount > escrowAccount.totalAmount) {
      throw new Error('Total milestone amounts exceed escrow amount');
    }

    return prisma.milestone.create({
      data: {
        escrowAccountId,
        amount: data.amount,
        description: data.description,
        dueDate: data.dueDate,
        status: 'PENDING'
      }
    });
  }

  async approveMilestone(milestoneId: string, proofOfWork: string) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { escrowAccount: true }
    });

    if (!milestone) throw new Error('Milestone not found');
    if (milestone.status !== 'PENDING') throw new Error('Milestone not in pending state');

    return prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'APPROVED',
        proofOfWork
      }
    });
  }

  async releaseMilestone(milestoneId: string) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        escrowAccount: {
          include: { entrepreneur: true }
        }
      }
    });

    if (!milestone) throw new Error('Milestone not found');
    if (milestone.status !== 'APPROVED') throw new Error('Milestone not approved');

    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(milestone.amount * 100),
        currency: 'usd',
        destination: milestone.escrowAccount.entrepreneur.stripeConnectId!,
        transfer_group: milestone.escrowAccount.id
      });

      await prisma.$transaction([
        prisma.milestone.update({
          where: { id: milestoneId },
          data: { status: 'RELEASED' }
        }),
        prisma.escrowTransaction.create({
          data: {
            escrowAccountId: milestone.escrowAccount.id,
            amount: milestone.amount,
            type: 'RELEASE',
            status: 'COMPLETED',
            stripePaymentId: transfer.id
          }
        })
      ]);

      // Check if all milestones are released
      await this.checkEscrowCompletion(milestone.escrowAccount.id);

      return milestone;
    } catch (error) {
      console.error('Failed to release milestone:', error);
      throw new Error('Failed to process milestone release');
    }
  }

  async disputeMilestone(milestoneId: string, reason: string) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId }
    });

    if (!milestone) throw new Error('Milestone not found');

    return prisma.$transaction([
      prisma.milestone.update({
        where: { id: milestoneId },
        data: { status: 'DISPUTED' }
      }),
      prisma.escrowAccount.update({
        where: { id: milestone.escrowAccountId },
        data: { status: 'DISPUTED' }
      })
    ]);
  }

  private async getTotalMilestoneAmount(escrowAccountId: string): Promise<number> {
    const milestones = await prisma.milestone.findMany({
      where: { escrowAccountId }
    });

    return milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
  }

  private async checkEscrowCompletion(escrowAccountId: string) {
    const milestones = await prisma.milestone.findMany({
      where: { escrowAccountId }
    });

    const allReleased = milestones.every(m => m.status === 'RELEASED');
    if (allReleased) {
      await prisma.escrowAccount.update({
        where: { id: escrowAccountId },
        data: { status: 'COMPLETED' }
      });
    }
  }
}