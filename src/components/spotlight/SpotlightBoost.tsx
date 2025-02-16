import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Star, Sparkles } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import PaymentForm from '@/components/payment/PaymentForm';

interface SpotlightProps {
  credits: number;
  onPurchaseComplete: () => void;
}

const SpotlightBoost = ({ credits, onPurchaseComplete }: SpotlightProps) => {
  const [showPurchase, setShowPurchase] = useState(false);
  const [creditsToBuy, setCreditsToBuy] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBoost = async (type: 'BOOST' | 'SUPER_BOOST') => {
    try {
      const response = await fetch('/api/spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (!response.ok) throw new Error('Failed to activate boost');
      onPurchaseComplete();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePurchaseCredits = async (paymentMethodId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/spotlight/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: creditsToBuy,
          paymentMethodId
        })
      });

      if (!response.ok) throw new Error('Failed to purchase credits');
      onPurchaseComplete();
      setShowPurchase(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Boost Your Profile</h2>
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="font-medium">{credits} Credits</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPurchase(true)}
          >
            Buy Credits
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regular Boost */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Rocket className="w-5 h-5" />
              <span>Profile Boost</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center">
                <span className="mr-2">•</span>
                3x visibility for 3 days
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                Priority in search results
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                1 credit
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => handleBoost('BOOST')}
              disabled={credits < 1}
            >
              Activate Boost
            </Button>
          </CardContent>
        </Card>

        {/* Super Boost */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Super Boost</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center">
                <span className="mr-2">•</span>
                5x visibility for 7 days
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                Top of search results
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                Featured profile badge
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                2 credits
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => handleBoost('SUPER_BOOST')}
              disabled={credits < 2}
              variant="secondary"
            >
              Activate Super Boost
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Credits Dialog */}
      <Dialog open={showPurchase} onOpenChange={() => setShowPurchase(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Purchase Boost Credits</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Number of Credits
            </label>
            <select
              value={creditsToBuy}
              onChange={(e) => setCreditsToBuy(Number(e.target.value))}
              className="w-full rounded-md border-gray-300"
            >
              <option value={1}>1 Credit ($5)</option>
              <option value={3}>3 Credits ($15)</option>
              <option value={5}>5 Credits ($25)</option>
              <option value={10}>10 Credits ($50)</option>
            </select>
          </div>

          <PaymentForm
            amount={creditsToBuy * 5}
            onSubmit={handlePurchaseCredits}
            isSubmitting={isSubmitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default SpotlightBoost;