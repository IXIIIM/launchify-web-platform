<<<<<<< HEAD
// src/routes/matches.ts
=======
>>>>>>> feature/security-implementation
import express from 'express';
import { matchController } from '../controllers/match';
import { authenticateToken } from '../middleware/auth';
import {
  requireFeatureAccess,
  requireResourceAccess,
  requireVerifiedAccess
} from '../middleware/accessControl';

const router = express.Router();

// Basic matching features
router.get('/potential',
  authenticateToken,
  requireFeatureAccess('read_basic_matches'),
  matchController.getPotentialMatches
);

// Advanced matching features
router.get('/recommended',
  authenticateToken,
  requireFeatureAccess('read_advanced_matches'),
  requireVerifiedAccess('advanced_matching'),
  matchController.getRecommendedMatches
);

// Match interactions
router.post('/:id/connect',
  authenticateToken,
  requireResourceAccess('match'),
  requireFeatureAccess('write_connections'),
  matchController.connectWithMatch
);

router.get('/:id',
  authenticateToken,
  requireResourceAccess('match'),
  matchController.getMatch
);

<<<<<<< HEAD
export default router;

// src/routes/messages.ts
import express from 'express';
import { messageController } from '../controllers/message';
import { authenticateToken } from '../middleware/auth';
import {
  requireFeatureAccess,
  requireResourceAccess
} from '../middleware/accessControl';

const router = express.Router();

router.get('/conversations',
  authenticateToken,
  requireFeatureAccess('read_messages'),
  messageController.getConversations
);

router.get('/:matchId/messages',
  authenticateToken,
  requireResourceAccess('match'),
  requireFeatureAccess('read_messages'),
  messageController.getMessages
);

router.post('/:matchId/messages',
  authenticateToken,
  requireResourceAccess('match'),
  requireFeatureAccess('write_messages'),
  messageController.sendMessage
);

export default router;

// src/routes/analytics.ts
import express from 'express';
import { analyticsController } from '../controllers/analytics';
import { authenticateToken } from '../middleware/auth';
import {
  requireFeatureAccess,
  requireVerifiedAccess
} from '../middleware/accessControl';

const router = express.Router();

// Basic analytics
router.get('/basic',
  authenticateToken,
  requireFeatureAccess('read_basic_analytics'),
  analyticsController.getBasicAnalytics
);

// Advanced analytics
router.get('/advanced',
  authenticateToken,
  requireFeatureAccess('read_advanced_analytics'),
  analyticsController.getAdvancedAnalytics
);

// Demographic insights
router.get('/demographics',
  authenticateToken,
  requireFeatureAccess('read_advanced_analytics'),
  requireVerifiedAccess('demographic_insights'),
  analyticsController.getDemographicInsights
);

export default router;

// src/routes/verification.ts
import express from 'express';
import { verificationController } from '../controllers/verification';
import { authenticateToken } from '../middleware/auth';
import { requireFeatureAccess } from '../middleware/accessControl';

const router = express.Router();

router.post('/business-plan',
  authenticateToken,
  requireFeatureAccess('write_verification'),
  verificationController.submitBusinessPlan
);

router.post('/technical-review',
  authenticateToken,
  requireFeatureAccess('write_verification'),
  verificationController.submitTechnicalReview
);

router.post('/fiscal-analysis',
  authenticateToken,
  requireFeatureAccess('write_verification'),
  verificationController.submitFiscalAnalysis
);

export default router;

// src/routes/profile.ts
import express from 'express';
import { profileController } from '../controllers/profile';
import { authenticateToken } from '../middleware/auth';
import {
  requireFeatureAccess,
  requireResourceAccess
} from '../middleware/accessControl';

const router = express.Router();

router.get('/:id',
  authenticateToken,
  requireResourceAccess('profile'),
  profileController.getProfile
);

router.put('/:id',
  authenticateToken,
  requireResourceAccess('profile'),
  profileController.updateProfile
);

router.post('/:id/boost',
  authenticateToken,
  requireFeatureAccess('write_profile_boost'),
  requireResourceAccess('profile'),
  profileController.boostProfile
);

=======
>>>>>>> feature/security-implementation
export default router;