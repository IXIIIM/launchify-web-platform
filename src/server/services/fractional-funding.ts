// src/server/services/fractional-funding.ts

import { PrismaClient } from '@prisma/client';
import { StripeService } from './stripe';

const prisma = new PrismaClient();
const stripeService = new StripeService();

interface FundingShare {
  funderId: string;
  percentage: number;
  amount: number;
}

export class FractionalFundingService {
  async createTeam(name: string, leaderId: string, members: string[]) {
    return prisma.funderTeam.create({
      data: {
        name,
        leaderId,
        members: {
          create: members.map(memberId => ({
            userId: memberId,
            role: memberId === leaderId ? 'LEADER' : 'MEMBER'
          }))
        }
      }
    });
  }

  async addTeamMember(teamId: string, memberId: string) {
    return prisma.teamMember.create({
      data: {
        teamId,
        userId: memberId,
        role: 'MEMBER'
      }
    });
  }

  async createFundingPool(teamId: string, data: {
    targetAmount: number;
    minContribution: number;
    maxContribution: number;
    deadline: Date;
  }) {
    return prisma.fundingPool.create({
      data: {
        teamId,
        ...data,
        status: 'OPEN',
        currentAmount: 0,
        contributions: []
      }
    });
  }

  async contribute(poolId: string, funderId: string, amount: number) {
    const pool = await prisma.fundingPool.findUnique({
      where: { id: poolId }
    });

    if (!pool) throw new Error('Funding pool not found');
    if (pool.status !== 'OPEN') throw new Error('Pool is not open for contributions');
    if (amount < pool.minContribution || amount > pool.maxContribution) {
      throw new Error('Contribution amount outside allowed range');
    }

    // Process payment
    await stripeService.createPaymentIntent(amount, funderId, `Pool Contribution: ${poolId}`);

    // Update pool
    const updatedPool = await prisma.fundingPool.update({
      where: { id: poolId },
      data: {
        currentAmount: { increment: amount },
        contributions: {
          push: {
            funderId,
            amount,
            timestamp: new Date()
          }
        }
      }
    });

    // Check if target reached
    if (updatedPool.currentAmount >= updatedPool.targetAmount) {
      await this.finalizeFundingPool(poolId);
    }

    return updatedPool;
  }

  private async finalizeFundingPool(poolId: string) {
    const pool = await prisma.fundingPool.findUnique({
      where: { id: poolId },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    });

    if (!pool) throw new Error('Pool not found');

    const shares = this.calculateShares(pool.contributions);
    await prisma.fundingPool.update({
      where: { id: poolId },
      data: {
        status: 'FINALIZED',
        shares
      }
    });
  }

  private calculateShares(contributions: any[]): FundingShare[] {
    const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
    
    return contributions.map(contribution => ({
      funderId: contribution.funderId,
      amount: contribution.amount,
      percentage: (contribution.amount / totalAmount) * 100
    }));
  }

  async getTeamStats(teamId: string) {
    const [team, pools] = await Promise.all([
      prisma.funderTeam.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      }),
      prisma.fundingPool.findMany({
        where: { teamId }
      })
    ]);

    return {
      memberCount: team?.members.length || 0,
      totalPoolsCreated: pools.length,
      totalFundsRaised: pools.reduce((sum, pool) => sum + pool.currentAmount, 0),
      activePoolsCount: pools.filter(p => p.status === 'OPEN').length
    };
  }
}