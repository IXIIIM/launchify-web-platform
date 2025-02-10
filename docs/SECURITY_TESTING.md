# Security Testing Implementation Guide

## Overview
This document outlines the security testing setup for the Launchify platform, including required dependencies, configuration, and integration steps.

## Required Dependencies
Add these dependencies to your package.json:

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-plugin-security": "^1.7.1",
    "eslint-plugin-react": "^7.33.2",
    "jest": "^29.0.0",
    "jest-mock-extended": "^3.0.0",
    "ts-jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

Install dependencies:
```bash
npm install
```

## Required Scripts
Add these scripts to your package.json:

```json
{
  "scripts": {
    "test": "jest",
    "test:security": "jest --config jest.config.js 'src/tests/security/**/*.test.ts'",
    "test:security:coverage": "jest --config jest.config.js 'src/tests/security/**/*.test.ts' --coverage",
    "lint:security": "eslint . --config .eslintrc.js",
    "security:audit": "npm audit",
    "security:full": "npm run security:audit && npm run lint:security && npm run test:security"
  }
}
```

## CI/CD Integration

### Required GitHub Secrets
Set up the following secrets in your GitHub repository settings:

1. `AWS_ACCESS_KEY_ID`: AWS access key for KMS integration
2. `AWS_SECRET_ACCESS_KEY`: AWS secret key for KMS integration
3. `AWS_REGION`: AWS region for services
4. `SNYK_TOKEN`: Token for Snyk vulnerability scanning

### Enable CodeQL Analysis
1. Go to GitHub repository settings
2. Navigate to Security & Analysis
3. Enable "Code scanning"
4. Choose "CodeQL Analysis"

### Branch Protection Rules
Set up these rules in GitHub repository settings:

1. Navigate to Settings > Branches > Branch protection rules
2. Add rule for `main` branch:
   - Require status checks to pass before merging
   - Require security checks to pass
   - Require code review
   - Require signed commits

## Local Development Setup

### Environment Variables
Create a `.env.test` file:

```env
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
REDIS_URL=redis://localhost:6379
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
JWT_SECRET=test-jwt-secret
```

### Running Tests Locally
```bash
# Run all security tests
npm run test:security

# Run with coverage report
npm run test:security:coverage

# Run ESLint security checks
npm run lint:security

# Run full security suite
npm run security:full
```

## Test Structure
```
src/
└── tests/
    └── security/
        ├── SecurityService.test.ts   # Encryption/KMS tests
        ├── SecurityMonitor.test.ts   # Security monitoring tests
        ├── RateLimiting.test.ts     # Rate limiting tests
        ├── AccessControl.test.ts     # Access control tests
        └── AuditLogging.test.ts     # Audit logging tests
```

## Adding New Security Tests

### Test Template
```typescript
import { ServiceName } from '@/services/ServiceName';
import { mock } from 'jest-mock-extended';

describe('ServiceName', () => {
  let service: ServiceName;
  
  beforeEach(() => {
    service = new ServiceName();
  });

  describe('featureName', () => {
    it('should handle security case', async () => {
      // Arrange
      const testData = 'test';

      // Act
      const result = await service.method(testData);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

### Best Practices
1. Always mock external services (AWS, Redis, etc.)
2. Test both success and failure cases
3. Include security edge cases
4. Clear test databases between runs
5. Don't commit sensitive data in tests

## Troubleshooting

### Common Issues

1. **Test Database Connection Errors**
   ```bash
   # Start test database
   docker-compose up -d test-db
   ```

2. **Redis Connection Issues**
   ```bash
   # Start Redis
   docker-compose up -d redis
   ```

3. **AWS KMS Mocking Issues**
   - Check mock implementation matches AWS SDK version
   - Verify AWS credentials in environment

### Support
For issues:
1. Check test logs: `npm run test:security -- --verbose`
2. Run specific test: `npm run test:security -- -t "test name"`
3. Debug with VS Code: Use launch.json configuration for Jest

## Maintenance

### Regular Tasks
1. Update dependencies monthly
2. Run full security audit weekly
3. Review and update security rules quarterly
4. Rotate test credentials regularly

### Monitoring
1. Check CodeQL scan results
2. Review Snyk vulnerability reports
3. Monitor test coverage trends
4. Track security-related issues

## Contributing
1. Create feature branch
2. Add/update security tests
3. Maintain 80% coverage minimum
4. Follow ESLint security rules
5. Request review from security team