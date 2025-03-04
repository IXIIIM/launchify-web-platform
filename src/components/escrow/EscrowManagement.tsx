// src/components/escrow/EscrowManagement.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/progress';
import { Milestone } from '@/types/escrow';
import { AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';

const EscrowDashboard = () => {
  const [escrowAccounts, setEscrowAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEscrowAccounts();
  }, []);

  const fetchEscrowAccounts = async () => {
    try {
      const response = await fetch('/api/escrow/accounts');
      if (!response.ok) throw new Error('Failed to fetch escrow accounts');
      const data = await response.json();
      setEscrowAccounts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Escrow Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {escrowAccounts.map(account => (
          <EscrowCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
};

const EscrowCard = ({ account }) => {
  const completedAmount = account.milestones
    .filter(m => m.status === 'RELEASED')
    .reduce((sum, m) => sum + m.amount, 0);

  const progress = (completedAmount / account.totalAmount) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Escrow Account</CardTitle>
        <span className={`px-2 py-1 rounded-full text-sm ${
          getStatusColor(account.status)
        }`}>
          {account.status}
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-center">
            <CircularProgress
              value={progress}
              size="lg"
              strokeWidth={8}
              showValue
              valuePrefix="$"
              valueSuffix="%"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Amount</span>
              <p className="font-semibold">${account.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Released</span>
              <p className="font-semibold">${completedAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Milestones</h4>
            {account.milestones.map(milestone => (
              <MilestoneItem key={milestone.id} milestone={milestone} />
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            {account.status === 'ACTIVE' && (
              <button
                onClick={() => handleRelease(milestone.id)}
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Release Funds
              </button>
            )}
            {account.status === 'PENDING' && (
              <button
                onClick={() => handleDeposit(account.id)}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Make Deposit
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MilestoneItem = ({ milestone }: { milestone: Milestone }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'DISPUTED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <div className="flex items-center space-x-2">
        {getStatusIcon(milestone.status)}
        <span className="text-sm">{milestone.description}</span>
      </div>
      <div className="flex items-center space-x-2">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium">
          ${milestone.amount.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

const CreateEscrowModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    amount: '',
    milestones: [{ description: '', amount: '', dueDate: '' }]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { description: '', amount: '', dueDate: '' }]
    }));
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Create Escrow Account</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Total Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                amount: e.target.value
              }))}
              className="mt-1 block w-full rounded-md border-gray-300"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Milestones</h3>
              <button
                type="button"
                onClick={addMilestone}
                className="text-sm text-blue-600"
              >
                Add Milestone
              </button>
            </div>

            {formData.milestones.map((milestone, index) => (
              <div key={index} className="space-y-2">
                <input
                  placeholder="Description"
                  value={milestone.description}
                  onChange={(e) => {
                    const newMilestones = [...formData.milestones];
                    newMilestones[index].description = e.target.value;
                    setFormData(prev => ({ ...prev, milestones: newMilestones }));
                  }}
                  className="block w-full rounded-md border-gray-300"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={milestone.amount}
                    onChange={(e) => {
                      const newMilestones = [...formData.milestones];
                      newMilestones[index].amount = e.target.value;
                      setFormData(prev => ({ ...prev, milestones: newMilestones }));
                    }}
                    className="rounded-md border-gray-300"
                  />
                  <input
                    type="date"
                    value={milestone.dueDate}
                    onChange={(e) => {
                      const newMilestones = [...formData.milestones];
                      newMilestones[index].dueDate = e.target.value;
                      setFormData(prev => ({ ...prev, milestones: newMilestones }));
                    }}
                    className="rounded-md border-gray-300"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Escrow
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { EscrowDashboard, CreateEscrowModal };