// src/components/admin/VerificationQueue.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Info, AlertCircle, CheckCircle, XCircle, Clock, ExternalLink, ShieldAlert } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { UserRole } from '@/services/AdminService';

interface VerificationRequest {
  id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  submittedAt: string;
  documents: string[];
  metadata: any;
  user: {
    email: string;
    userType: string;
    entrepreneurProfile?: any;
    funderProfile?: any;
  };
}

const VerificationQueue: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [additionalInfoMessage, setAdditionalInfoMessage] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const { hasAccess, isLoading: accessLoading } = useRoleAccess(UserRole.MODERATOR);

  useEffect(() => {
    if (hasAccess) {
      fetchVerificationQueue();
    }
  }, [filters, hasAccess]);

  const fetchVerificationQueue = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        startDate: filters.startDate || '',
        endDate: filters.endDate || ''
      });

      const response = await fetch(`/api/verification/queue?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch verification queue');
      
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching verification queue:', error);
      setError('Failed to load verification queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDecision = async (requestId: string, decision: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/verification/${requestId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes: notes.trim() || undefined
        })
      });

      if (!response.ok) throw new Error('Failed to process verification request');

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: decision }
            : req
        )
      );

      setSelectedRequest(null);
      setNotes('');
    } catch (error) {
      console.error('Error processing verification:', error);
      setError('Failed to process verification request');
    }
  };

  const handleRequestAdditionalInfo = async (requestId: string) => {
    try {
      const response = await fetch(`/api/verification/${requestId}/request-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: additionalInfoMessage,
          requiredDocuments
        })
      });

      if (!response.ok) throw new Error('Failed to request additional information');

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'info_requested' }
            : req
        )
      );

      setShowRequestInfoDialog(false);
      setAdditionalInfoMessage('');
      setRequiredDocuments([]);
    } catch (error) {
      console.error('Error requesting additional info:', error);
      setError('Failed to request additional information');
    }
  };

  const renderVerificationDetails = (request: VerificationRequest) => {
    const profile = request.user.userType === 'entrepreneur'
      ? request.user.entrepreneurProfile
      : request.user.funderProfile;

    return (
      <div className="space-y-6">
        {/* User Info */}
        <div>
          <h3 className="text-lg font-semibold mb-2">User Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Email</span>
              <p>{request.user.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Type</span>
              <p className="capitalize">{request.user.userType}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Name</span>
              <p>{profile.name || profile.projectName}</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Documents</h3>
          <div className="space-y-2">
            {request.documents.map((doc, index) => (
              <a
                key={index}
                href={doc}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span>Document {index + 1}</span>
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            ))}
          </div>
        </div>

        {/* Review Notes */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Review Notes</h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your review notes here..."
            className="min-h-[100px]"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => setShowRequestInfoDialog(true)}
          >
            Request Info
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRequestDecision(request.id, 'rejected')}
            className="text-red-600 hover:text-red-700"
          >
            Reject
          </Button>
          <Button
            onClick={() => handleRequestDecision(request.id, 'approved')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Approve
          </Button>
        </div>
      </div>
    );
  };

  // Access denied component
  if (!hasAccess && !accessLoading) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
        <div className="flex items-center">
          <ShieldAlert className="h-4 w-4 mr-2" />
          <h3 className="font-medium">Access Denied</h3>
        </div>
        <p className="mt-2 text-sm">
          You don't have permission to access the verification queue. This feature requires moderator privileges.
        </p>
      </div>
    );
  }

  if (isLoading || accessLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter verification requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="info_requested">Info Requested</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="BusinessPlan">Business Plan</SelectItem>
                <SelectItem value="UseCase">Use Case</SelectItem>
                <SelectItem value="DemographicAlignment">Demographic</SelectItem>
                <SelectItem value="AppUXUI">App/UX/UI</SelectItem>
                <SelectItem value="FiscalAnalysis">Fiscal Analysis</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              placeholder="Start Date"
            />

            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              placeholder="End Date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Request List */}
      <div className="grid gap-4">
        {requests.map((request) => (
          <Card
            key={request.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedRequest(request)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">{request.type} Verification</h3>
                    <Badge variant={getStatusVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Submitted {format(new Date(request.submittedAt), 'PPp')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{request.user.email}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {request.user.userType}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <CardHeader>
            <CardTitle>Verification Request Details</CardTitle>
            <CardDescription>
              Review and process verification request
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRequest && renderVerificationDetails(selectedRequest)}
          </CardContent>
        </DialogContent>
      </Dialog>

      {/* Request Additional Info Dialog */}
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
        <DialogContent>
          <CardHeader>
            <CardTitle>Request Additional Information</CardTitle>
            <CardDescription>
              Specify what additional information is needed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Message to User
                </label>
                <Textarea
                  value={additionalInfoMessage}
                  onChange={(e) => setAdditionalInfoMessage(e.target.value)}
                  placeholder="Explain what additional information is needed..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Required Documents
                </label>
                <div className="space-y-2">
                  {requiredDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={doc}
                        onChange={(e) => {
                          const newDocs = [...requiredDocuments];
                          newDocs[index] = e.target.value;
                          setRequiredDocuments(newDocs);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRequiredDocuments(prev => 
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setRequiredDocuments(prev => [...prev, ''])}
                  >
                    Add Document
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRequestInfoDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedRequest && handleRequestAdditionalInfo(selectedRequest.id)}
                  disabled={!additionalInfoMessage.trim()}
                >
                  Send Request
                </Button>
              </div>
            </div>
          </CardContent>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'info_requested':
      return 'warning';
    default:
      return 'default';
  }
};

export default VerificationQueue;