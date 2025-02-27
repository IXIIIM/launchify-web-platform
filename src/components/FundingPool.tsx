// src/components/FundingPool.tsx

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DollarSign, Users, Clock, TrendingUp } from 'lucide-react';

const FundingPool = ({ poolId }) => {
  const [pool, setPool] = useState(null);
  const [showContribute, setShowContribute] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPool();
  }, [poolId]);

  const fetchPool = async () => {
    try {
      const response = await fetch(`/api/pools/${poolId}`);
      if (!response.ok) throw new Error('Failed to fetch pool');
      const data = await response.json();
      setPool(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading pool details...</div>;
  if (!pool) return null;

  const progress = (pool.currentAmount / pool.targetAmount) * 100;
  const remainingDays = Math.max(0, Math.ceil(
    (new Date(pool.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold">Funding Pool</h2>
            <p className="text-sm text-gray-500">
              Created by {pool.team.name}
            </p>
          </div>
          <Button 
            onClick={() => setShowContribute(true)}
            disabled={pool.status !== 'OPEN'}
          >
            Contribute
          </Button>
        </div>

        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">
                ${pool.currentAmount.toLocaleString()}
              </span>
              <span className="text-gray-500">
                ${pool.targetAmount.toLocaleString()}
              </span>
            </div>
            <Progress value={progress} />
            <p className="text-sm text-gray-500 mt-1">
              {progress.toFixed(1)}% of target raised
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <span className="block text-sm font-medium">
                {pool.contributions.length} Contributors
              </span>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <span className="block text-sm font-medium">
                {remainingDays} Days Left
              </span>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <span className="block text-sm font-medium">
                {pool.status}
              </span>
            </div>
          </div>

          {/* Contribution Range */}
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-500">Min Contribution</p>
              <p className="font-medium">
                ${pool.minContribution.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Max Contribution</p>
              <p className="font-medium">
                ${pool.maxContribution.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Contributors List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contributors</h3>
        <div className="space-y-4">
          {pool.contributions.map((contribution, index) => (
            <div 
              key={index}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{contribution.funder.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(contribution.timestamp).toLocaleDateString()}
                </p>
              </div>
              <p className="font-medium">
                ${contribution.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <ContributeDialog
        pool={pool}
        open={showContribute}
        onClose={() => setShowContribute(false)}
        onComplete={fetchPool}
      />
    </div>
  );
};

const ContributeDialog = ({ pool, open, onClose, onComplete }) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/pools/${pool.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) })
      });

      if (!response.ok) throw new Error('Failed to contribute');
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contribute to Pool</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Contribution Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <Input
                type="number"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={pool.minContribution}
                max={pool.maxContribution}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Min: ${pool.minContribution.toLocaleString()} | 
              Max: ${pool.maxContribution.toLocaleString()}
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount || 
                Number(amount) < pool.minContribution || 
                Number(amount) > pool.maxContribution}
            >
              {isSubmitting ? 'Contributing...' : 'Contribute'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};

export default FundingPool;