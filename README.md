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

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── pages/          # Page components and routes
  ├── services/       # API and third-party service integrations
  ├── types/          # TypeScript type definitions
  ├── utils/          # Helper functions and utilities
  └── styles/         # Global styles and Tailwind configuration
```