import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VerificationRequest {
  id: string;
  userId: string;
  user: {
    email: string;
    userType: string;
    profile: {
      name?: string;
      projectName?: string;
    };
  };
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: string[];
  submittedAt: string;
  notes?: string;
}

export default function VerificationReview() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/admin/verifications?status=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch verification requests');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/verifications/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes })
      });

      if (!response.ok) throw new Error(`Failed to ${action} request`);
      
      setSelectedRequest(null);
      setReviewNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const downloadDocument = async (docUrl: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${encodeURIComponent(docUrl)}`);
      if (!response.ok) throw new Error('Failed to download document');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docUrl.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Verification Requests</h1>
        <div className="flex space-x-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    {request.user.profile.name || request.user.profile.projectName}
                  </h3>
                  <p className="text-sm text-gray-500">{request.user.email}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      request.user.userType === 'entrepreneur'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {request.user.userType}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium">Verification Type</h4>
                <p className="text-sm text-gray-600">{request.type}</p>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium">Documents</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {request.documents.map((doc, index) => (
                    <button
                      key={index}
                      onClick={() => downloadDocument(doc)}
                      className="flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Document {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Submitted {new Date(request.submittedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Review Verification Request</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Request Details</h3>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-500">User</dt>
                      <dd className="font-medium">
                        {selectedRequest.user.profile.name || selectedRequest.user.profile.projectName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Type</dt>
                      <dd className="font-medium">{selectedRequest.type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Status</dt>
                      <dd className="font-medium">{selectedRequest.status}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Submitted</dt>
                      <dd className="font-medium">
                        {new Date(selectedRequest.submittedAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Review Notes</h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add your review notes here..."
                    className="w-full h-32 p-2 border rounded-md"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleAction(selectedRequest.id, 'reject')}
                    className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(selectedRequest.id, 'approve')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approve
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}