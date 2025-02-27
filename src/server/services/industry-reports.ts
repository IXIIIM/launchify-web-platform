// src/server/services/industry-reports.ts

import { PrismaClient } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

const prisma = new PrismaClient();

interface IndustryMetrics {
  totalInvestments: number;
  averageInvestment: number;
  successRate: number;
  growthRate: number;
  activeProjects: number;
  topSubsectors: string[];
}

export class IndustryReportsService {
  async generateIndustryReport(industry: string): Promise<IndustryMetrics> {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const [investments, completedProjects] = await Promise.all([
      this.getIndustryInvestments(industry, lastYear),
      this.getCompletedProjects(industry, lastYear)
    ]);

    const metrics = {
      totalInvestments: investments.reduce((sum, inv) => sum + inv.amount, 0),
      averageInvestment: investments.length > 0 
        ? investments.reduce((sum, inv) => sum + inv.amount, 0) / investments.length 
        : 0,
      successRate: this.calculateSuccessRate(completedProjects),
      growthRate: await this.calculateGrowthRate(industry, lastYear),
      activeProjects: await this.getActiveProjectsCount(industry),
      topSubsectors: await this.getTopSubsectors(industry)
    };

    await this.cacheIndustryReport(industry, metrics);
    return metrics;
  }

  private async getIndustryInvestments(industry: string, since: Date) {
    return prisma.escrowAccount.findMany({
      where: {
        entrepreneur: {
          entrepreneurProfile: {
            industries: {
              has: industry
            }
          }
        },
        status: 'COMPLETED',
        createdAt: { gte: since }
      },
      include: {
        milestones: true
      }
    });
  }

  private async getCompletedProjects(industry: string, since: Date) {
    return prisma.match.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: since },
        user: {
          entrepreneurProfile: {
            industries: {
              has: industry
            }
          }
        }
      }
    });
  }

  private calculateSuccessRate(projects: any[]): number {
    if (projects.length === 0) return 0;
    const successful = projects.filter(p => p.outcome === 'SUCCESS').length;
    return (successful / projects.length) * 100;
  }

  private async calculateGrowthRate(industry: string, since: Date): Promise<number> {
    const [previousPeriod, currentPeriod] = await Promise.all([
      this.getTotalInvestment(industry, since, new Date()),
      this.getTotalInvestment(
        industry,
        new Date(since.getTime() - 365 * 24 * 60 * 60 * 1000),
        since
      )
    ]);

    if (currentPeriod === 0 || previousPeriod === 0) return 0;
    return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  }

  private async getTotalInvestment(industry: string, startDate: Date, endDate: Date): Promise<number> {
    const investments = await prisma.escrowAccount.findMany({
      where: {
        entrepreneur: {
          entrepreneurProfile: {
            industries: {
              has: industry
            }
          }
        },
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      },
      select: {
        totalAmount: true
      }
    });

    return investments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  }

  private async getActiveProjectsCount(industry: string): Promise<number> {
    return prisma.match.count({
      where: {
        status: 'ACTIVE',
        user: {
          entrepreneurProfile: {
            industries: {
              has: industry
            }
          }
        }
      }
    });
  }

  private async getTopSubsectors(industry: string): Promise<string[]> {
    const projects = await prisma.entrepreneurProfile.findMany({
      where: {
        industries: {
          has: industry
        }
      },
      select: {
        subIndustries: true
      }
    });

    const subsectorCounts = projects.reduce((acc, project) => {
      project.subIndustries.forEach(sub => {
        acc[sub] = (acc[sub] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(subsectorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([subsector]) => subsector);
  }

  private async cacheIndustryReport(industry: string, metrics: IndustryMetrics): Promise<void> {
    await prisma.industryReport.create({
      data: {
        industry,
        metrics,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // Cache for 24 hours
      }
    });
  }

  async getIndustryReport(industry: string): Promise<IndustryMetrics> {
    // Check cache first
    const cachedReport = await prisma.industryReport.findFirst({
      where: {
        industry,
        validUntil: { gt: new Date() }
      }
    });

    if (cachedReport) {
      return cachedReport.metrics as IndustryMetrics;
    }

    return this.generateIndustryReport(industry);
  }
}