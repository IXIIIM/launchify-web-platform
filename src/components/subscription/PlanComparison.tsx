import React from 'react';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PlanFeatures {
  name: string;
  description: string;
  features: string[];
  accessLevels: string[];
  priceEntrepreneur: number;
  priceFunder: number;
}

interface PlanComparisonProps {
  plans: Record<string, PlanFeatures>;
  currentPlan: string | null;
  userType: 'entrepreneur' | 'funder';
  onUpgrade: (tier: string) => Promise<void>;
  isProcessing: boolean;
}

const PlanComparison: React.FC<PlanComparisonProps> = ({
  plans,
  currentPlan,
  userType,
  onUpgrade,
  isProcessing
}) => {
  const isCurrentPlan = (tier: string) => currentPlan === tier;
  
  const canUpgrade = (tier: string) => {
    if (!currentPlan) return true;
    const tiers = Object.keys(plans);
    return tiers.indexOf(tier) > tiers.indexOf(currentPlan);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(plans).map(([tier, plan]) => (
        <Card key={tier} className={`overflow-hidden ${
          isCurrentPlan(tier) ? 'ring-2 ring-blue-500' : ''
        }`}>
          <div className="p-6">
            <div className="flex justify-between items-baseline mb-4">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="text-2xl font-bold">
                ${userType === 'entrepreneur' ? plan.priceEntrepreneur : plan.priceFunder}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">{plan.description}</p>

            <div className="space-y-4 mb-8">
              <h4 className="font-medium">Features:</h4>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="font-medium">Access to:</h4>
              <div className="flex flex-wrap gap-2">
                {plan.accessLevels.map((level) => (
                  <span
                    key={level}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => onUpgrade(tier)}
              disabled={isCurrentPlan(tier) || !canUpgrade(tier) || isProcessing}
              className={`w-full py-2 px-4 rounded-lg ${
                isCurrentPlan(tier)
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : canUpgrade(tier)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCurrentPlan(tier)
                ? 'Current Plan'
                : isProcessing
                ? 'Processing...'
                : canUpgrade(tier)
                ? 'Upgrade'
                : 'Not Available'}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PlanComparison;