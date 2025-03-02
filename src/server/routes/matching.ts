// src/server/routes/matching.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';
import { advancedMatchingRoutes } from '../controllers/advanced-matching.controller';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for matching endpoints
const matchingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many matching requests, please try again later'
});

// Basic matching routes (existing)
router.get('/potential', authenticateToken, matchingLimiter, checkFeatureAccess('canAccessMatching'), 
  advancedMatchingRoutes.findMatches
);

// Advanced matching routes (new)
router.get(
  '/insights/:matchId',
  authenticateToken,
  checkFeatureAccess('canAccessAdvancedInsights'),
  advancedMatchingRoutes.getMatchInsights
);

router.post(
  '/feedback/:matchId',
  authenticateToken,
  checkFeatureAccess('canProvideFeedback'),
  advancedMatchingRoutes.provideFeedback
);

router.get(
  '/stats',
  authenticateToken,
  checkFeatureAccess('canAccessAnalytics'),
  advancedMatchingRoutes.getMatchingStats
);

// Specialized matching endpoints
router.get(
  '/recommendations',
  authenticateToken,
  checkFeatureAccess('canAccessPremiumMatching'),
  async (req, res) => {
    try {
      const matches = await advancedMatchingRoutes.findMatches(req, res);
      if (matches) {
        // Filter and enhance recommendations based on user's subscription tier
        const enhancedMatches = await enhanceMatchRecommendations(matches, req.user);
        res.json(enhancedMatches);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ message: 'Error getting recommendations' });
    }
  }
);

router.get(
  '/industry-insights',
  authenticateToken,
  checkFeatureAccess('canAccessIndustryInsights'),
  async (req, res) => {
    try {
      const { industries } = req.query;
      const insights = await generateIndustryInsights(
        industries as string[],
        req.user.id
      );
      res.json(insights);
    } catch (error) {
      console.error('Error getting industry insights:', error);
      res.status(500).json({ message: 'Error getting industry insights' });
    }
  }
);

// Helper functions for route handlers
async function enhanceMatchRecommendations(matches: any[], user: any) {
  // Add premium insights based on subscription tier
  const enhancedMatches = await Promise.all(matches.map(async (match) => {
    const enhancements: any = {
      ...match,
      detailedInsights: {}
    };

    if (user.subscriptionTier === 'Platinum' || user.subscriptionTier === 'Gold') {
      enhancements.detailedInsights = {
        marketAnalysis: await generateMarketAnalysis(match),
        competitorInsights: await generateCompetitorInsights(match),
        investmentTrends: await generateInvestmentTrends(match)
      };
    }

    if (user.subscriptionTier === 'Platinum') {
      enhancements.detailedInsights.customizedStrategy = 
        await generateCustomStrategy(match, user);
    }

    return enhancements;
  }));

  return enhancedMatches;
}

async function generateIndustryInsights(industries: string[], userId: string) {
  const insights = {
    trends: await analyzeIndustryTrends(industries),
    opportunities: await findIndustryOpportunities(industries),
    risks: await assessIndustryRisks(industries),
    competitors: await analyzeCompetitors(industries),
    marketSize: await calculateMarketSize(industries)
  };

  return insights;
}

async function generateMarketAnalysis(match: any) {
  // Implementation of market analysis logic
  return {
    marketSize: 'Calculate market size',
    growthRate: 'Calculate growth rate',
    keyTrends: 'Identify key trends'
  };
}

async function generateCompetitorInsights(match: any) {
  // Implementation of competitor analysis
  return {
    directCompetitors: 'List direct competitors',
    competitiveAdvantages: 'Identify competitive advantages',
    marketPosition: 'Analyze market position'
  };
}

async function generateInvestmentTrends(match: any) {
  // Implementation of investment trend analysis
  return {
    historicalInvestments: 'Analyze historical investments',
    currentTrends: 'Identify current trends',
    futurePredictions: 'Make future predictions'
  };
}

async function generateCustomStrategy(match: any, user: any) {
  // Implementation of custom strategy generation
  return {
    approachStrategy: 'Generate approach strategy',
    negotiationPoints: 'Identify key negotiation points',
    riskMitigation: 'Suggest risk mitigation strategies'
  };
}

async function analyzeIndustryTrends(industries: string[]) {
  // Implementation of industry trend analysis
  return {
    currentTrends: 'Analyze current trends',
    growthRate: 'Calculate growth rate',
    marketConditions: 'Assess market conditions'
  };
}

async function findIndustryOpportunities(industries: string[]) {
  // Implementation of opportunity analysis
  return {
    gaps: 'Identify market gaps',
    emergingMarkets: 'Identify emerging markets',
    innovationAreas: 'Identify areas for innovation'
  };
}

async function assessIndustryRisks(industries: string[]) {
  // Implementation of risk assessment
  return {
    marketRisks: 'Assess market risks',
    regulatoryRisks: 'Assess regulatory risks',
    competitiveRisks: 'Assess competitive risks'
  };
}

async function analyzeCompetitors(industries: string[]) {
  // Implementation of competitor analysis
  return {
    majorPlayers: 'Identify major players',
    marketShare: 'Calculate market share',
    competitiveAdvantages: 'Analyze competitive advantages'
  };
}

async function calculateMarketSize(industries: string[]) {
  // Implementation of market size calculation
  return {
    totalAddressableMarket: 'Calculate TAM',
    servicableAddressableMarket: 'Calculate SAM',
    servicableObtainableMarket: 'Calculate SOM'
  };
}

export default router;