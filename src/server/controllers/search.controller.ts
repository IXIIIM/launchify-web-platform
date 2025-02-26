// src/server/controllers/search.controller.ts
import { Request, Response } from 'express';
import { SearchIndexService } from '../services/search/SearchIndexService';
import { Redis } from 'ioredis';

// Initialize services
const searchService = new SearchIndexService();
const redis = new Redis(process.env.REDIS_URL);

// Cache TTL in seconds
const CACHE_TTL = 300; // 5 minutes

interface AuthRequest extends Request {
  user: any;
}

export const searchProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const {
      query = '',
      filters = {},
      sort,
      page = 1,
      limit = 20,
      userType
    } = req.query;

    // Parse filters and validate
    const parsedFilters = {};
    if (typeof filters === 'string') {
      try {
        Object.assign(parsedFilters, JSON.parse(filters));
      } catch (error) {
        return res.status(400).json({ message: 'Invalid filters format' });
      }
    }

    // Parse sort and validate
    let parsedSort;
    if (sort && typeof sort === 'string') {
      try {
        parsedSort = JSON.parse(sort);
        if (!parsedSort.field || !parsedSort.direction) {
          throw new Error('Invalid sort format');
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid sort format' });
      }
    }

    // Generate cache key
    const cacheKey = `search:${userType}:${query}:${JSON.stringify(parsedFilters)}:${JSON.stringify(parsedSort)}:${page}:${limit}`;
    
    // Try to get cached results
    const cachedResults = await redis.get(cacheKey);
    if (cachedResults) {
      return res.json(JSON.parse(cachedResults));
    }

    // Perform search
    const results = await searchService.searchProfiles(query as string, {
      filters: parsedFilters,
      sort: parsedSort,
      page: Number(page),
      limit: Number(limit),
      userType: userType as 'entrepreneur' | 'funder'
    });

    // Cache results
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));

    // Log search asynchronously
    logSearch(req.user.id, query as string, userType as string, parsedFilters)
      .catch(error => console.error('Error logging search:', error));

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: 'Error performing search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const reindexProfile = async (req: AuthRequest, res: Response) => {
  try {
    await searchService.indexProfile(req.user.id, req.user.userType);
    
    // Clear cached search results for this user
    const pattern = `search:*:*:*:*:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    res.json({ message: 'Profile reindexed successfully' });
  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({ message: 'Error reindexing profile' });
  }
};

export const reindexAll = async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await searchService.reindexAll();
    
    // Clear all cached search results
    const pattern = `search:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    res.json({ message: 'All profiles reindexed successfully' });
  } catch (error) {
    console.error('Full reindex error:', error);
    res.status(500).json({ message: 'Error reindexing all profiles' });
  }
};

export const getSearchSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { query = '', userType } = req.query;
    
    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json([]);
    }

    // Try to get cached suggestions
    const cacheKey = `suggestions:${userType}:${query}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get quick search results with limited fields
    const results = await searchService.searchProfiles(query as string, {
      limit: 5,
      userType: userType as 'entrepreneur' | 'funder'
    });

    // Format suggestions
    const suggestions = results.map(profile => ({
      id: profile.userId,
      text: profile.type === 'entrepreneur' ? profile.projectName : profile.name,
      type: profile.type,
      ...(profile.type === 'entrepreneur'
        ? { industry: profile.industries[0] }
        : { availableFunds: profile.availableFunds })
    }));

    // Cache suggestions for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(suggestions));
    
    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Error getting search suggestions' });
  }
};

export const getPopularSearches = async (req: AuthRequest, res: Response) => {
  try {
    const { userType } = req.query;
    
    // Try to get cached popular searches
    const cacheKey = `popular-searches:${userType}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get searches from the last 7 days
    const popularSearches = await prisma.searchLog.groupBy({
      by: ['term'],
      where: {
        userType: userType as string,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _count: {
        term: true
      },
      orderBy: {
        _count: {
          term: 'desc'
        }
      },
      take: 10
    });

    const result = popularSearches.map(s => s.term);
    
    // Cache popular searches for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(result));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    res.status(500).json({ message: 'Error fetching popular searches' });
  }
};

// Helper function to log searches for analytics
async function logSearch(userId: string, term: string, userType: string, filters: any) {
  try {
    await prisma.searchLog.create({
      data: {
        userId,
        term,
        userType,
        filters: filters ? JSON.stringify(filters) : null
      }
    });
  } catch (error) {
    console.error('Error logging search:', error);
  }
}

// src/server/routes/search.ts
import express from 'express';
import {
  searchProfiles,
  getSearchSuggestions,
  getPopularSearches,
  reindexProfile,
  reindexAll
} from '../controllers/search.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for search endpoints
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many search requests, please try again later'
});

// Apply rate limiting to all search routes
router.use(searchLimiter);

// Search routes (require authentication)
router.get('/profiles', authenticateToken, searchProfiles);
router.get('/suggestions', authenticateToken, getSearchSuggestions);
router.get('/popular', authenticateToken, getPopularSearches);

// Profile indexing routes
router.post('/reindex-profile', authenticateToken, reindexProfile);
router.post('/reindex-all', authenticateToken, isAdmin, reindexAll);

export default router;