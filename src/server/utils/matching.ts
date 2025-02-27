// src/server/utils/matching.ts

import { PrismaClient } from '@prisma/client';
import { getDistance } from 'geolib';

const prisma = new PrismaClient();

interface MatchFactors {
  industryAlignment: number;
  investmentAlignment: number;
  experienceAlignment: number;
  geographicAlignment: number;
  verificationScore: number;
  fraudRiskScore: number;
}

export const calculateCompatibility = async (user1: any, user2: any): Promise<{ score: number; factors: MatchFactors }> => {
  const factors: MatchFactors = {
    industryAlignment: await calculateIndustryAlignment(user1, user2),
    investmentAlignment: calculateInvestmentAlignment(user1, user2),
    experienceAlignment: calculateExperienceAlignment(user1, user2),
    geographicAlignment: await calculateGeographicAlignment(user1, user2),
    verificationScore: calculateVerificationScore(user1, user2),
    fraudRiskScore: await calculateFraudRiskScore(user1, user2)
  };

  // Weight factors based on importance
  const weights = {
    industryAlignment: 0.25,
    investmentAlignment: 0.25,
    experienceAlignment: 0.15,
    geographicAlignment: 0.10,
    verificationScore: 0.15,
    fraudRiskScore: 0.10
  };

  const score = Object.entries(factors).reduce((total, [factor, value]) => {
    return total + (value * weights[factor as keyof typeof weights]);
  }, 0);

  return { score, factors };
};

const calculateIndustryAlignment = async (user1: any, user2: any): Promise<number> => {
  const industries1 = user1.type === 'entrepreneur' ? 
    user1.entrepreneurProfile.industries : 
    user1.funderProfile.areasOfInterest;

  const industries2 = user2.type === 'entrepreneur' ?
    user2.entrepreneurProfile.industries :
    user2.funderProfile.areasOfInterest;

  // Get industry expertise levels from historical data
  const expertise1 = await getIndustryExpertise(user1.id, industries1);
  const expertise2 = await getIndustryExpertise(user2.id, industries2);

  let alignmentScore = 0;
  let totalPossible = 0;

  industries1.forEach(industry => {
    if (industries2.includes(industry)) {
      const expertiseScore = (expertise1[industry] + expertise2[industry]) / 2;
      alignmentScore += expertiseScore;
    }
    totalPossible++;
  });

  return alignmentScore / (totalPossible || 1);
};

const calculateInvestmentAlignment = (user1: any, user2: any): number => {
  const entrepreneur = user1.type === 'entrepreneur' ? user1 : user2;
  const funder = user1.type === 'funder' ? user1 : user2;

  const desiredAmount = entrepreneur.entrepreneurProfile.desiredInvestment.amount;
  const { minAmount, maxAmount } = funder.funderProfile.investmentPreferences;

  if (desiredAmount < minAmount) {
    return Math.max(0, 1 - (minAmount - desiredAmount) / minAmount);
  }

  if (desiredAmount > maxAmount) {
    return Math.max(0, 1 - (desiredAmount - maxAmount) / maxAmount);
  }

  // Perfect range match
  return 1;
};

const calculateExperienceAlignment = (user1: any, user2: any): number => {
  const experience1 = user1.type === 'entrepreneur' ?
    user1.entrepreneurProfile.yearsExperience :
    user1.funderProfile.yearsExperience;

  const experience2 = user2.type === 'entrepreneur' ?
    user2.entrepreneurProfile.yearsExperience :
    user2.funderProfile.yearsExperience;

  // Consider experience gap differently based on roles
  if (user1.type !== user2.type) {
    // For entrepreneur-funder matches, some experience gap is acceptable
    const gap = Math.abs(experience1 - experience2);
    return Math.max(0, 1 - (gap / 15)); // Scale down score for gaps up to 15 years
  }

  // For same-type matches, prefer closer experience levels
  const gap = Math.abs(experience1 - experience2);
  return Math.max(0, 1 - (gap / 5)); // More stringent for peer matches
};

const calculateGeographicAlignment = async (user1: any, user2: any): Promise<number> => {
  const location1 = await getUserLocation(user1.id);
  const location2 = await getUserLocation(user2.id);

  if (!location1 || !location2) return 1; // Default to full score if locations unavailable

  const distance = getDistance(
    { latitude: location1.latitude, longitude: location1.longitude },
    { latitude: location2.latitude, longitude: location2.longitude }
  );

  // Scale based on preference - example assumes 1000km as max preferred distance
  const maxDistance = 1000000; // 1000km in meters
  return Math.max(0, 1 - (distance / maxDistance));
};

const calculateVerificationScore = (user1: any, user2: any): number => {
  const verificationLevels = ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment', 'AppUXUI', 'FiscalAnalysis'];
  
  const score1 = verificationLevels.indexOf(user1.verificationLevel) / (verificationLevels.length - 1);
  const score2 = verificationLevels.indexOf(user2.verificationLevel) / (verificationLevels.length - 1);

  return (score1 + score2) / 2;
};

const calculateFraudRiskScore = async (user1: any, user2: any): Promise<number> => {
  const [risk1, risk2] = await Promise.all([
    assessFraudRisk(user1),
    assessFraudRisk(user2)
  ]);

  // Convert risk scores to safety scores (inverse)
  const safety1 = 1 - risk1;
  const safety2 = 1 - risk2;

  return Math.min(safety1, safety2); // Use lower safety score
};

async function assessFraudRisk(user: any): Promise<number> {
  let riskScore = 0;

  // Check profile completeness
  const profileCompleteness = await calculateProfileCompleteness(user);
  riskScore += (1 - profileCompleteness) * 0.3;

  // Check verification status
  if (!user.emailVerified) riskScore += 0.2;
  if (!user.phoneVerified) riskScore += 0.2;

  // Check activity patterns
  const suspiciousActivity = await checkSuspiciousActivity(user.id);
  riskScore += suspiciousActivity * 0.3;

  return Math.min(1, riskScore);
}

async function calculateProfileCompleteness(user: any): Promise<number> {
  const profile = user.type === 'entrepreneur' ? user.entrepreneurProfile : user.funderProfile;
  const requiredFields = ['photo', 'industries', 'yearsExperience'];
  
  const completedFields = requiredFields.filter(field => !!profile[field]);
  return completedFields.length / requiredFields.length;
}

async function checkSuspiciousActivity(userId: string): Promise<number> {
  const recentActivity = await prisma.match.findMany({
    where: {
      OR: [
        { userId },
        { matchedWithId: userId }
      ],
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  });

  // Check for rapid matching patterns
  const matchRate = recentActivity.length / 24;
  if (matchRate > 20) return 1; // More than 20 matches per hour is suspicious
  if (matchRate > 10) return 0.5;
  
  return 0;
}

async function getUserLocation(userId: string) {
  const location = await prisma.userLocation.findUnique({
    where: { userId }
  });
  return location;
}

async function getIndustryExpertise(userId: string, industries: string[]): Promise<Record<string, number>> {
  const expertise: Record<string, number> = {};
  
  // Get user's profile and activity data
  const [profile, matches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
      }
    }),
    prisma.match.findMany({
      where: {
        OR: [
          { userId },
          { matchedWithId: userId }
        ],
        status: 'accepted'
      }
    })
  ]);

  industries.forEach(industry => {
    let score = 0;
    
    // Base score from years of experience
    const yearsExperience = profile?.entrepreneurProfile?.yearsExperience || 
                           profile?.funderProfile?.yearsExperience || 0;
    score += Math.min(1, yearsExperience / 10);

    // Bonus for successful matches in industry
    const successfulMatches = matches.length;
    score += Math.min(0.5, successfulMatches / 20);

    expertise[industry] = Math.min(1, score);
  });

  return expertise;
}