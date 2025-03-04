import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MatchingService } from '../services/matching/MatchingService';
import { UsageService } from '../services/usage/UsageService';
import { WebSocketService } from '../services/websocket';

const prisma = new PrismaClient();
const usageService = new UsageService();
const matchingService = new MatchingService(usageService);
const wsService = new WebSocketService();

interface AuthRequest extends Request {
  user: {
    id: string;
    userType: 'entrepreneur' | 'funder';
    subscriptionTier: string;
  };
}

export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const { id: userId } = req.user;
    const { 
      industries, 
      investmentMin, 
      investmentMax, 
      experience,
      verificationLevel,
      businessType,
      marketSize,
      timeline,
      verifiedOnly
    } = req.query;

    // Build criteria object from query parameters
    const criteria: any = {};

    if (industries) {
      criteria.industries = Array.isArray(industries) 
        ? industries 
        : [industries as string];
    }

    if (investmentMin || investmentMax) {
      criteria.investmentRange = {
        min: investmentMin ? parseInt(investmentMin as string, 10) : 0,
        max: investmentMax ? parseInt(investmentMax as string, 10) : Number.MAX_SAFE_INTEGER
      };
    }

    if (experience) {
      criteria.experienceYears = parseInt(experience as string, 10);
    }

    if (verificationLevel) {
      criteria.verificationLevel = verificationLevel as string;
    }

    if (businessType) {
      criteria.businessType = Array.isArray(businessType)
        ? businessType
        : [businessType as string];
    }

    if (marketSize) {
      criteria.marketSize = marketSize as string;
    }

    if (timeline) {
      criteria.timeline = timeline as string;
    }

    if (verifiedOnly === 'true') {
      criteria.includeVerifiedOnly = true;
    }

    const matches = await matchingService.findMatches(userId, criteria);

    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch matches',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id: userId } = req.user;
    const { matchedWithId } = req.body;

    if (!matchedWithId) {
      return res.status(400).json({ error: 'matchedWithId is required' });
    }

    // Check if users can match based on subscription tiers
    const canMatch = await checkMatchingPermissions(userId, matchedWithId);
    if (!canMatch.allowed) {
      return res.status(403).json({ error: canMatch.reason });
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          {
            userId,
            matchedWithId
          },
          {
            userId: matchedWithId,
            matchedWithId: userId
          }
        ]
      }
    });

    if (existingMatch) {
      return res.status(409).json({ error: 'Match already exists' });
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        userId,
        matchedWithId,
        status: 'PENDING',
        initiatedBy: userId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        },
        matchedWith: {
          select: {
            id: true,
            email: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      }
    });

    // Create notification for the matched user
    await prisma.notification.create({
      data: {
        userId: matchedWithId,
        type: 'NEW_MATCH_REQUEST',
        content: `You have a new match request from ${match.user.userType === 'entrepreneur' 
          ? match.user.entrepreneurProfile?.companyName 
          : match.user.funderProfile?.name}`,
        metadata: {
          matchId: match.id,
          userId: match.user.id
        }
      }
    });

    // Send real-time notification
    wsService.sendNotification(matchedWithId, {
      type: 'NEW_MATCH_REQUEST',
      matchId: match.id,
      userId: match.user.id
    });

    res.status(201).json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
};

export const respondToMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id: userId } = req.user;
    const { matchId } = req.params;
    const { accept } = req.body;

    if (typeof accept !== 'boolean') {
      return res.status(400).json({ error: 'accept parameter must be a boolean' });
    }

    // Find the match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        },
        matchedWith: {
          select: {
            id: true,
            email: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Verify the user is the one being matched with
    if (match.matchedWithId !== userId) {
      return res.status(403).json({ error: 'Not authorized to respond to this match' });
    }

    // Update match status
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: accept ? 'ACCEPTED' : 'REJECTED',
        respondedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userType: true
          }
        },
        matchedWith: {
          select: {
            id: true,
            email: true,
            userType: true
          }
        }
      }
    });

    // Create notification for the initiator
    await prisma.notification.create({
      data: {
        userId: match.userId,
        type: accept ? 'MATCH_ACCEPTED' : 'MATCH_REJECTED',
        content: accept 
          ? `Your match request has been accepted!` 
          : `Your match request was not accepted.`,
        metadata: {
          matchId: match.id,
          userId: match.matchedWith.id
        }
      }
    });

    // Send real-time notification
    wsService.sendNotification(match.userId, {
      type: accept ? 'MATCH_ACCEPTED' : 'MATCH_REJECTED',
      matchId: match.id,
      userId: match.matchedWith.id
    });

    // If accepted, create a chat room
    if (accept) {
      const chatRoom = await prisma.chatRoom.create({
        data: {
          matchId: match.id,
          participants: {
            connect: [
              { id: match.userId },
              { id: match.matchedWithId }
            ]
          }
        }
      });

      // Generate NDA documents if needed
      await generateMatchDocuments(match.id);
    }

    res.json(updatedMatch);
  } catch (error) {
    console.error('Error responding to match:', error);
    res.status(500).json({ error: 'Failed to respond to match' });
  }
};

export const getUserMatches = async (req: AuthRequest, res: Response) => {
  try {
    const { id: userId } = req.user;
    const { status } = req.query;

    const statusFilter = status 
      ? { status: status as string }
      : {};

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userId, ...statusFilter },
          { matchedWithId: userId, ...statusFilter }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        },
        matchedWith: {
          select: {
            id: true,
            email: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        },
        chatRoom: {
          select: {
            id: true,
            createdAt: true
          }
        },
        documents: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the response to make it more user-friendly
    const transformedMatches = matches.map(match => {
      const isInitiator = match.userId === userId;
      const otherUser = isInitiator ? match.matchedWith : match.user;
      
      return {
        id: match.id,
        status: match.status,
        createdAt: match.createdAt,
        respondedAt: match.respondedAt,
        isInitiator,
        otherUser,
        chatRoom: match.chatRoom,
        documents: match.documents
      };
    });

    res.json(transformedMatches);
  } catch (error) {
    console.error('Error fetching user matches:', error);
    res.status(500).json({ error: 'Failed to fetch user matches' });
  }
};

// Helper function to check if users can match based on subscription tiers
async function checkMatchingPermissions(userId: string, matchedWithId: string) {
  const [user, matchedWith] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, userType: true }
    }),
    prisma.user.findUnique({
      where: { id: matchedWithId },
      select: { subscriptionTier: true, userType: true }
    })
  ]);

  if (!user || !matchedWith) {
    return { allowed: false, reason: 'One or both users not found' };
  }

  // Check daily match limit for Basic users
  if (user.subscriptionTier === 'Basic') {
    const dailyMatches = await usageService.getDailyMatchCount(userId);
    if (dailyMatches >= 5) {
      return { allowed: false, reason: 'Daily match limit reached for Basic subscription' };
    }
  }

  // Check tier access permissions
  const tierHierarchy = ['Basic', 'Chrome', 'Bronze', 'Silver', 'Gold', 'Platinum'];
  const userTierIndex = tierHierarchy.indexOf(user.subscriptionTier);
  const matchedTierIndex = tierHierarchy.indexOf(matchedWith.subscriptionTier);

  if (userTierIndex === -1 || matchedTierIndex === -1) {
    return { allowed: false, reason: 'Invalid subscription tier' };
  }

  // Users can only match with users of their tier or lower
  if (matchedTierIndex > userTierIndex) {
    return { 
      allowed: false, 
      reason: `Your ${user.subscriptionTier} subscription does not allow matching with ${matchedWith.subscriptionTier} users`
    };
  }

  // Basic entrepreneurs can't match with funders
  if (user.subscriptionTier === 'Basic' && 
      user.userType === 'entrepreneur' && 
      matchedWith.userType === 'funder') {
    return { 
      allowed: false, 
      reason: 'Basic entrepreneurs cannot match with funders. Please upgrade your subscription.'
    };
  }

  return { allowed: true };
}

// Helper function to generate match documents (NDA, etc.)
async function generateMatchDocuments(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user: true,
        matchedWith: true
      }
    });

    if (!match) return;

    // Create NDA document
    await prisma.document.create({
      data: {
        matchId,
        type: 'NDA',
        status: 'PENDING',
        metadata: {
          generatedAt: new Date(),
          parties: [
            {
              userId: match.userId,
              userType: match.user.userType,
              signed: false
            },
            {
              userId: match.matchedWithId,
              userType: match.matchedWith.userType,
              signed: false
            }
          ]
        }
      }
    });

    // TODO: Integrate with DocuSign or similar service to generate actual document
  } catch (error) {
    console.error('Error generating match documents:', error);
  }
} 