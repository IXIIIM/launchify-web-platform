// src/pages/subscription/SubscriptionPage.tsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { SubscriptionTier } from '@/types/user';
import PlanComparison from './components/PlanComparison';
import BillingHistory from './components/BillingHistory';
import CurrentPlan from './components/CurrentPlan';

interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  priceEntrepreneur: number;
  priceFunder: number;
  features: string[];
  accessLevels: string[];
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    tier: 'Basic',
    name: 'Basic',
    priceEntrepreneur: 0,
    priceFunder: 0,
    features: [
      'Basic profile visibility',
      'Connect with Basic users',
      'Limited matches per month',
    ],
    accessLevels: ['Basic']
  },
  // ... other plan definitions as before
];

const SubscriptionPage: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [userType, setUserType] = useState<'entrepreneur' | 'funder'>('entrepreneur');
  const [isLoading, setIsLoading] = useState(true);
  
  // Rest of component implementation preserved
  // ... implementation as before

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
      
      {/* Components render as before */}
      {currentPlan && (
        <CurrentPlan
          plan={currentPlan}
          userType={userType}
        />
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <PlanComparison
          plans={subscriptionPlans}
          currentPlan={currentPlan}
          userType={userType}
          onUpgrade={handleUpgrade}
        />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Billing History</h2>
        <BillingHistory />
      </div>
    </div>
  );
};

export default SubscriptionPage;