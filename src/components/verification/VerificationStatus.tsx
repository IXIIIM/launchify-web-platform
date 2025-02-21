import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VerificationRequest {
  id: string;
  type: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  documents: {
    type: string;
    name: string;
    status: 'valid' | 'invalid' | 'pending';
    issues?: string[];
  }[];
  notes?: string;
  expectedCompletionTime?: string;
}

export default function VerificationStatus() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationStatus();
    const interval = setInterval(fetchVerificationStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification/status');
      if (!response.ok) throw new Error('Failed to fetch verification status');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'reviewing':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const calculateProgress = (request: VerificationRequest) => {
    switch (request.status) {
      case 'approved':
        return 100;
      case 'rejected':
        return 100;
      case 'reviewing':
        return 66;
      default:
        return 33;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verification Status</h1>

      <div className="space-y-6">
        {requests.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <div className="border-l-4 border-l-blue-600">
              <div
                className="p-6 cursor-pointer"
                onClick={() => setSelectedRequest(
                  selectedRequest === request.id ? null : request.id
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{request.type} Verification</h3>
                    <p className="text-sm text-gray-600">
                      Submitted {new Date(request.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(request.status)}
                    <ChevronRight
                      className={`h-5 w-5 transition-transform ${
                        selectedRequest === request.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Progress
                    value={calculateProgress(request)}
                    className="h-2"
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Submitted</span>
                    <span>Reviewing</span>
                    <span>Complete</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedRequest === request.id && (
                <div className="p-6 bg-gray-50 border-t">
                  {/* Document Status */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Document Status</h4>
                    {request.documents.map((doc) => (
                      <div
                        key={doc.type}
                        className="flex items-start justify-between bg-white p-4 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{doc.type}</div>
                          <div className="text-sm text-gray-600">{doc.name}</div>
                          {doc.issues && doc.issues.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {doc.issues.map((issue, index) => (
                                <li
                                  key={index}
                                  className="flex items-center text-sm text-red-600"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          {doc.status === 'valid' && (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Valid
                            </span>
                          )}
                          {doc.status === 'invalid' && (
                            <span className="flex items-center text-red-600">
                              <XCircle className="h-5 w-5 mr-2" />
                              Invalid
                            </span>
                          )}
                          {doc.status === 'pending' && (
                            <span className="flex items-center text-gray-600">
                              <Clock className="h-5 w-5 mr-2" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Review Notes */}
                  {request.notes && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Review Notes</h4>
                      <div className="bg-white p-4 rounded-lg text-gray-600">
                        {request.notes}
                      </div>
                    </div>
                  )}

                  {/* Expected Completion */}
                  {request.expectedCompletionTime && (
                    <div className="mt-6 flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      Expected completion by{' '}
                      {new Date(request.expectedCompletionTime).toLocaleString()}
                    </div>
                  )}

                  {/* Actions */}
                  {request.status === 'rejected' && (
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          // Handle resubmission
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Resubmit Documents
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            No verification requests found
          </div>
        )}
      </div>
    </div>
  );
}