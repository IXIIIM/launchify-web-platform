import { Request, Response } from 'express';
import { SearchIndexService } from '../services/search/SearchIndexService';

const searchService = new SearchIndexService();

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

    // Perform search
    const results = await searchService.searchProfiles(query as string, {
      filters: parsedFilters,
      sort: parsedSort,
      page: Number(page),
      limit: Number(limit),
      userType: userType as 'entrepreneur' | 'funder'
    });

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error performing search' });
  }
};

export const reindexProfile = async (req: AuthRequest, res: Response) => {
  try {
    await searchService.indexProfile(req.user.id, req.user.userType);
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
    res.json({ message: 'All profiles reindexed successfully' });
  } catch (error) {
    console.error('Full reindex error:', error);
    res.status(500).json({ message: 'Error reindexing all profiles' });
  }
};

export const getSearchSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { query = '', userType } = req.query;

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

    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Error getting search suggestions' });
  }
};