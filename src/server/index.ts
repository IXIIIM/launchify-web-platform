// Add to existing index.ts

import { analyticsProcessor } from './jobs/analytics-processor';

// Start analytics processor when server starts
analyticsProcessor.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  analyticsProcessor.stop();
  // ... other cleanup
});
