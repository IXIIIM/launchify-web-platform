import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Download, FileText } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { UserRole } from '@/services/AdminService';

// Types
interface BrokerageFee {
  id: string;
  name: string;
  description: string;
  percentage: number;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id: string;
  amount: number;
  feeAmount: number;
  feePercentage: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  entrepreneurName: string;
  funderName: string;
  createdAt: Date;
}

interface FeeStats {
  totalCollected: number;
  averageRate: number;
  transactionCount: number;
  pendingAmount: number;
}

// Mock data
const mockFeeTiers: BrokerageFee[] = [
  {
    id: '1',
    name: 'Standard Fee',
    description: 'Standard brokerage fee for most transactions',
    percentage: 10,
    minAmount: 0,
    maxAmount: 50000,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-15')
  },
  {
    id: '2',
    name: 'Mid-Tier Fee',
    description: 'Fee for medium-sized transactions',
    percentage: 15,
    minAmount: 50000,
    maxAmount: 250000,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-15')
  },
  {
    id: '3',
    name: 'Premium Fee',
    description: 'Fee for large transactions',
    percentage: 20,
    minAmount: 250000,
    maxAmount: null,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-15')
  }
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 25000,
    feeAmount: 2500,
    feePercentage: 10,
    status: 'completed',
    description: 'Seed funding for tech startup',
    entrepreneurName: 'Alex Johnson',
    funderName: 'Venture Capital Partners',
    createdAt: new Date('2023-06-10')
  },
  {
    id: '2',
    amount: 75000,
    feeAmount: 11250,
    feePercentage: 15,
    status: 'completed',
    description: 'Series A funding round',
    entrepreneurName: 'Sarah Williams',
    funderName: 'Growth Investors LLC',
    createdAt: new Date('2023-06-05')
  },
  {
    id: '3',
    amount: 300000,
    feeAmount: 60000,
    feePercentage: 20,
    status: 'pending',
    description: 'Expansion capital for retail chain',
    entrepreneurName: 'Michael Chen',
    funderName: 'Global Investment Group',
    createdAt: new Date('2023-06-01')
  }
];

const mockStats: FeeStats = {
  totalCollected: 73750,
  averageRate: 15,
  transactionCount: 3,
  pendingAmount: 60000
};

const BrokerageFeeManagement: React.FC = () => {
  const { hasAccess } = useRoleAccess();
  const canEdit = hasAccess(UserRole.ADMIN);
  const canViewFinancials = hasAccess(UserRole.ADMIN);

  // State
  const [feeTiers, setFeeTiers] = useState<BrokerageFee[]>(mockFeeTiers);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [stats, setStats] = useState<FeeStats>(mockStats);
  const [isLoading, setIsLoading] = useState(false);

  // Effects
  useEffect(() => {
    // In a real implementation, this would fetch data from the API
    // fetchFeeTiers();
    // fetchTransactions();
    // fetchStats();
  }, []);

  // Render helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Brokerage Fee Management</h1>
          <p className="text-gray-500">
            Manage transaction fees and view fee collection statistics
          </p>
        </div>
        
        {canViewFinancials && (
          <div className="flex items-center gap-2">
            <button className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {canViewFinancials && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Fees Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCollected)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Average Fee Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRate.toFixed(2)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Transaction Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transactionCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="fee-tiers">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fee-tiers">Fee Tiers</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fee-tiers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Fee Tier Configuration</h2>
            {canEdit && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Create New Tier
              </button>
            )}
          </div>
          
          <div className="rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Amount Range</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {canEdit && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeTiers.map((tier) => (
                  <tr key={tier.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tier.percentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {formatCurrency(tier.minAmount)} - {tier.maxAmount ? formatCurrency(tier.maxAmount) : 'No limit'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{tier.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tier.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {tier.isActive ? "Active" : "Inactive"}
                        </span>
                        {canEdit && (
                          <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input 
                              type="checkbox" 
                              checked={tier.isActive}
                              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${tier.isActive ? 'bg-green-400' : ''}`}></label>
                          </div>
                        )}
                      </div>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            Edit
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border rounded-md p-4">
            <div className="flex items-center gap-2 cursor-pointer">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">How Fee Tiers Work</span>
            </div>
            <div className="mt-2 space-y-2 text-sm text-gray-500">
              <p>
                Fee tiers determine the percentage fee charged on transactions based on the transaction amount.
              </p>
              <p>
                When a transaction occurs, the system automatically applies the appropriate fee tier based on the transaction amount.
              </p>
              <p>
                Only active fee tiers are considered when calculating fees. You can create multiple overlapping tiers, but only active ones will be used.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <h2 className="text-xl font-semibold">Transaction History</h2>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="status-filter"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Apply Filters"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile view - cards */}
          <div className="md:hidden space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{transaction.description}</CardTitle>
                  <CardDescription>
                    {formatDate(transaction.createdAt)} • {getStatusBadge(transaction.status)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fee:</span>
                      <span className="font-medium">{formatCurrency(transaction.feeAmount)} ({transaction.feePercentage}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Entrepreneur:</span>
                      <span className="font-medium">{transaction.entrepreneurName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Funder:</span>
                      <span className="font-medium">{transaction.funderName}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Desktop view - table */}
          <div className="hidden md:block rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrepreneur</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funder</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(transaction.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(transaction.feeAmount)}
                      <span className="text-gray-400 ml-1">({transaction.feePercentage}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.entrepreneurName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.funderName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadge(transaction.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No transactions found</h3>
              <p className="text-gray-500">
                Try adjusting your filters or check back later.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerageFeeManagement; 