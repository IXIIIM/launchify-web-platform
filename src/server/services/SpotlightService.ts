// src/server/services/SpotlightService.ts

import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

const BOOST_DURATIONS = {
  BOOST: 3, // 3 days
  SUPER_BOOST: 7 // 7 days
};

const BOOST_CREDITS = {
  BOOST: 1,
  SUPER_BOOST: 2
};

export class SpotlightService {
  async createSpotlight(userId: string, type: 'BOOST' | 'SUPER_BOOST') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { boostCredits: true }
    });

    if (!user || user.boostCredits < BOOST_CREDITS[type]) {
      throw new Error('Insufficient boost credits');
    }

    const startDate = new Date();
    const endDate = addDays(startDate, BOOST_DURATIONS[type]);

    return prisma.$transaction([
      prisma.spotlight.create({
        data: {
          userId,
          type,
          startDate,
          endDate,
          status: 'ACTIVE'
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { boostCredits: { decrement: BOOST_CREDITS[type] } }
      })
    ]);
  }

  async getActiveSpotlights() {
    return prisma.spotlight.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      },
      include: {
        user: {
          include: {
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      }
    });
  }

  async updateMatchingAlgorithm(userId: string) {
    const activeSpotlight = await prisma.spotlight.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      }
    });

    if (!activeSpotlight) return 1;

    return activeSpotlight.type === 'SUPER_BOOST' ? 3 : 2;
  }

  async checkAndExpireSpotlights() {
    const expiredSpotlights = await prisma.spotlight.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: new Date() }
      }
    });

    await prisma.spotlight.updateMany({
      where: { id: { in: expiredSpotlights.map(s => s.id) } },
      data: { status: 'EXPIRED' }
    });
  }

  async purchaseBoostCredits(userId: string, amount: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { boostCredits: { increment: amount } }
    });
  }
}