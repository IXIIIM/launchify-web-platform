// src/pages/subscription/SubscriptionPage.tsx

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Card, PageHeader } from './layout-components';
import { Check, X } from 'lucide-react';

const subscriptionTiers = {
  Basic: {
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
  Chrome: {
    name: 'Chrome',
    priceEntrepreneur: 25,
    priceFunder: 100,
    features: [
      'Enhanced profile visibility',
      'Connect with Chrome and Basic users',
      'Increased match limit',
      'Basic analytics'
    ],
    accessLevels: ['Chrome', 'Basic']
  },
  Bronze: {
    name: 'Bronze',
    priceEntrepreneur: 50,
    priceFunder: 200,
    features: [
      'Priority profile visibility',
      'Connect with Bronze and lower tiers',
      'Advanced analytics',
      'Priority support'
    ],
    accessLevels: ['Bronze', 'Chrome', 'Basic']
  },
  Silver: {
    name: 'Silver',
    priceEntrepreneur: 75,
    priceFunder: 300,
    features: [
      'Premium profile visibility',
      'Connect with Silver and lower tiers',
      'Custom analytics dashboard',
      '24/7 support'
    ],
    accessLevels: ['Silver', 'Bronze', 'Chrome', 'Basic']
  },
  Gold: {
    name: 'Gold',
    priceEntrepreneur: 100,
    priceFunder: 500,
    features: [
      'Featured profile placement',
      'Connect with Gold and lower tiers',
      'Advanced matching algorithms',
      'Premium support'
    ],
    accessLevels: ['Gold', 'Silver', 'Bronze', 'Chrome', 'Basic']
  },
  Platinum: {
    name: 'Platinum',
    priceEntrepreneur: 200,
    priceFunder: 1000,
    features: [
      'Top profile placement',
      'Connect with all tiers',
      'White glove service',
      'Dedicated account manager',
      'Custom matching preferences'
    ],
    accessLevels: ['Platinum', 'Gold', 'Silver', 'Bronze', 'Chrome', 'Basic']
  }
};

const SubscriptionPage = () => {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/current');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      const data = await response.json();
      setCurrentSubscription(data);
      setUserType(data.userType);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUp