// src/server/index.ts

import { trackLocation } from './middleware/location';

// Add after authentication middleware
app.use(trackLocation);

// Protected routes
app.use('/api/users', authenticateToken, trackLocation, userRoutes);
app.use('/api/matching', authenticateToken, trackLocation, matchingRoutes);
app.use('/api/subscriptions', authenticateToken, trackLocation, subscriptionRoutes);

// Add to existing index.ts

import { analyticsProcessor } from './jobs/analytics-processor';

// Start analytics processor when server starts
analyticsProcessor.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  analyticsProcessor.stop();
  // ... other cleanup
});
