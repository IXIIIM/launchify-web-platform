import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCheck, FileX, Filter, Download, ExternalLink } from 'lucide-react';

interface VerificationRequest {
  id: string;
  userId: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: string[];
  notes: string;
  createdAt: string;
  user: {
    email: string;
    userType: string;
    entrepreneurProfile?: {
      projectName: string;
    };
    funderProfile?: {
      name: string;
    };
  };
}

const VerificationQueueManagement = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'pending'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchVerificationRequests();
  }, [filters]);

  const fetchVerificationRequests = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        status: filters.status === 'all' ? '' : filters.status,
        type: filters.type === 'all' ? '' : filters.type
      });

      const response = await fetch(`/api/admin/verification-requests?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch verification requests');
      
      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/verification-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: reviewNotes
        })
      });

      if (!response.ok) throw new Error('Failed to update verification request');

      // Refresh requests list
      fetchVerificationRequests();
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error updating verification request:', error);
    }
  };

  const getDocumentUrl = async (documentPath: string) => {
    try {
      const response = await fetch(`/api/admin/verification-documents/${documentPath}`);
      if (!response.ok) throw new Error('Failed to get document URL');
      
      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error getting document URL:', error);
    }
  };

  const VerificationDetails = ({ request }: { request: VerificationRequest }) => (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">
            {request.user.userType === 'entrepreneur'
              ? request.user.entrepreneurProfile?.projectName
              : request.user.funderProfile?.name}
          </h3>
          <p className="text-gray-600">{request.user.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          request.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : request.status === 'approved'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {request.status}
        </span>
      </div>

      <div>
        <h4 className="font-medium mb-2">Verification Type</h4>
        <p className="text-gray-600">{request.type}</p>
      </div>

      <div>
        <h4 className="font-medium mb-2">Submitted Documents</h4>
        <div className="space-y-2">
          {request.documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Document {index + 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => getDocumentUrl(doc)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </div>

      {request.status === 'pending' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Notes
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm"
              rows={4}
              placeholder="Add notes about your verification decision..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => handleUpdateRequest(request.id, 'rejected')}
            >
              <FileX className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleUpdateRequest(request.id, 'approved')}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      )}

      {request.status !== 'pending' && request.notes && (
        <div>
          <h4 className="font-medium mb-2">Review Notes</h4>
          <p className="text-gray-600">{request.notes}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Verification Queue</CardTitle>
            <div className="flex items-center space-x-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="rounded-md border-gray-300"
              >
                <option value="all">All Types</option>
                <option value="BusinessPlan">Business Plan</option>
                <option value="UseCase">Use Case</option>
                <option value="DemographicAlignment">Demographic Alignment</option>
                <option value="AppUXUI">App/UX/UI</option>
                <option value="FiscalAnalysis">Fiscal Analysis</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="rounded-md border-gray-300"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Status</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map(request => (
              <div
                key={request.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">
                      {request.user.userType === 'entrepreneur'
                        ? request.user.entrepreneurProfile?.projectName
                        : request.user.funderProfile?.name}
                    </h4>
                    <p className="text-sm text-gray-600">{request.type}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-12">
                <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No verification requests found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl m-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Verification Request Details</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedRequest(null)}
              >
                ×
              </Button>
            </div>
            <VerificationDetails request={selectedRequest} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationQueueManagement;