# Launchify Web Platform

A platform designed to match entrepreneurs and investors efficiently by aligning areas of interest with expertise.

## Features

- Subscription-based matching system
- Real-time chat functionality
- Profile verification system
- Analytics dashboard
- Secure payment processing

## Tech Stack

- React/Next.js
- TypeScript
- Tailwind CSS
- Prisma
- Stripe Integration

## Security Features

- AWS KMS encryption for sensitive data
- Rate limiting and request validation
- Security monitoring with AWS SNS alerts
- Comprehensive security testing suite
- Automated security checks in CI/CD

For detailed security testing documentation, see [Security Testing Guide](docs/SECURITY_TESTING.md).

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
JWT_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
```

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run security tests
npm run test:security

# Run security checks
npm run security:full
```

### Security Checks
Before submitting PRs, ensure:
1. All security tests pass
2. No security linting errors
3. Dependencies are up to date
4. No sensitive data in commits

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── pages/         # Page components and routes
  ├── services/      # API and third-party service integrations
  ├── tests/         # Test suites including security tests
  ├── types/         # TypeScript type definitions
  ├── utils/         # Helper functions and utilities
  └── styles/        # Global styles and Tailwind configuration
```