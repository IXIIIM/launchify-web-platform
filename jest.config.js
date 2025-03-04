// jest.config.js
module.exports = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',
  
  // Test environment (node for backend, jsdom for frontend)
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>/src'],
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Module name mapping for easier imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Ignore these paths for coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    'types.ts',
    'interfaces.ts',
    '.*\\.d\\.ts'
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    '!src/**/index.ts'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporting formats
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Test timeout (in milliseconds)
  testTimeout: 10000,
  
  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: {
        warnOnly: true
      }
    }
  },
  
  // Verbose output
  verbose: true,
  
  // Detect and fail on async operations left open
  detectOpenHandles: true,
  
  // Force exit after tests
  forceExit: true,
  
  // Additional configuration for mocking
  clearMocks: true,
  
  // Reset module registry before each test
  resetModules: true,
  
  // Collect module-level coverage
  collectCoverage: true,
  
  // Output directory for coverage reports
  coverageDirectory: 'coverage',
  
  // Specific configuration for database testing
  testEnvironmentOptions: {
    DB: {
      // Example database testing configuration
      connectionString: process.env.TEST_DATABASE_URL
    }
  }
};

// Optional: Test setup file (src/tests/setup.ts)
// import { PrismaClient } from '@prisma/client';
// import { mockClient } from 'aws-sdk-mock';

// const prisma = new PrismaClient();

// beforeAll(async () => {
//   // Setup test database
//   process.env.DATABASE_URL = 'postgresql://localhost:5432/launchify_test';
//   process.env.AWS_REGION = 'us-east-1';
//   process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
//   process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

//   // Reset database before tests
//   await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
//   await prisma.$executeRaw`TRUNCATE TABLE "Match" CASCADE`;
//   // Add more table truncate statements as needed
// });

// afterAll(async () => {
//   // Cleanup
//   await prisma.$disconnect();
//   mockClient.restore();
// });