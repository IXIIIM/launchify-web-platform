import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface Milestone {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'review' | 'completed' | 'disputed';
  completionProof?: {
    files: Array<{
      name: string;
      url: string;
    }>;
    notes: string;
  };
  approvalStatus?: {
    approved: boolean;
    notes: string;
    date: string;
  };
}

interface EscrowDetails {
  id: string;
  totalAmount: number;
  releasedAmount: number;
  status: 'active' | 'completed' | 'disputed';
  milestones: Milestone[];
  parties: {
    entrepreneur: {
      id: string;
      name: string;
    };
    funder: {
      id: string;
      name: string;
    };
  };
  disputeResolution?: {
    status: 'pending' | 'resolved';
    details: string;
    resolution?: string;
  };
}

export default function EscrowManagement() {
  const [escrows, setEscrows] = useState<EscrowDetails[]>([]);
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    fetchEscrows();
  }, []);

  const fetchEscrows = async () => {
    try {
      const response = await fetch('/api/escrow');
      if (!response.ok) throw new Error('Failed to fetch escrow details');
      const data = await response.json();
      setEscrows(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load escrow details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList, milestoneId: string) => {
    try {
      setUploadingFiles(true);
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('milestoneId', milestoneId);
      formData.append('notes', completionNotes);

      const response = await fetch('/api/escrow/milestone/complete', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload completion proof');

      fetchEscrows(); // Refresh data
      setSelectedMilestone(null);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to upload completion proof');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleMilestoneApproval = async (
    milestoneId: string,
    approved: boolean,
    notes: string
  ) => {
    try {
      const response = await fetch(`/api/escrow/milestone/${milestoneId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, notes })
      });

      if (!response.ok) throw new Error('Failed to review milestone');

      fetchEscrows(); // Refresh data
      setSelectedMilestone(null);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to review milestone');
    }
  };

  const initiateDispute = async (escrowId: string, reason: string) => {
    try {
      const response = await fetch(`/api/escrow/${escrowId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) throw new Error('Failed to initiate dispute');

      fetchEscrows(); // Refresh data
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to initiate dispute');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Escrow Management</h1>

      <div className="space-y-6">
        {escrows.map((escrow) => (
          <Card key={escrow.id}>
            <div className="border-l-4 border-l-blue-600">
              <div
                className="p-6 cursor-pointer"
                onClick={() => setSelectedEscrow(
                  selectedEscrow === escrow.id ? null : escrow.id
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      Escrow Agreement with {
                        escrow.parties.entrepreneur.name
                      }
                    </h3>
                    <div className="text-sm text-gray-600">
                      Total Amount: ${escrow.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {escrow.status === 'active' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Active
                      </span>
                    )}
                    {escrow.status === 'disputed' && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        Disputed
                      </span>
                    )}
                    <ChevronRight
                      className={`h-5 w-5 transition-transform ${
                        selectedEscrow === escrow.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <Progress
                    value={(escrow.releasedAmount / escrow.totalAmount) * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Released: ${escrow.releasedAmount.toLocaleString()}</span>
                    <span>Remaining: ${(escrow.totalAmount - escrow.releasedAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedEscrow === escrow.id && (
                <div className="p-6 bg-gray-50 border-t space-y-4">
                  {/* Milestones */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Milestones</h4>
                    {escrow.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="bg-white p-4 rounded-lg shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{milestone.description}</div>
                            <div className="text-sm text-gray-600">
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            </div>
                            <div className="font-medium text-blue-600">
                              ${milestone.amount.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {milestone.status === 'completed' && (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="h-5 w-5 mr-1" />
                                Completed
                              </span>
                            )}
                            {milestone.status === 'pending' && (
                              <span className="flex items-center text-gray-600">
                                <Clock className="h-5 w-5 mr-1" />
                                Pending
                              </span>
                            )}
                            {milestone.status === 'disputed' && (
                              <span className="flex items-center text-red-600">
                                <AlertTriangle className="h-5 w-5 mr-1" />
                                Disputed
                              </span>
                            )}
                            <button
                              onClick={() => setSelectedMilestone(milestone)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Completion Proof Preview */}
                        {milestone.completionProof && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="text-sm font-medium mb-2">Completion Proof</div>
                            <div className="space-y-2">
                              {milestone.completionProof.files.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center text-sm text-gray-600"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  {file.name}
                                  <a
                                    href={file.url}
                                    download
                                    className="ml-2 text-blue-600 hover:text-blue-700"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              {milestone.completionProof.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Dispute Information */}
                  {escrow.disputeResolution && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Dispute Information</h4>
                      <p className="text-sm text-red-600">{escrow.disputeResolution.details}</p>
                      {escrow.disputeResolution.resolution && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <div className="font-medium text-red-800">Resolution:</div>
                          <p className="text-sm text-red-600">{escrow.disputeResolution.resolution}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Milestone Details Dialog */}
      <Dialog open={!!selectedMilestone} onOpenChange={() => setSelectedMilestone(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMilestone && (
            <>
              <DialogHeader>
                <DialogTitle>Milestone Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-gray-600">{selectedMilestone.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Amount</h3>
                    <p className="text-blue-600 font-medium">
                      ${selectedMilestone.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Due Date</h3>
                    <p className="text-gray-600">
                      {new Date(selectedMilestone.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Upload Completion Proof */}
                {selectedMilestone.status === 'pending' && (
                  <div>
                    <h3 className="font-medium mb-2">Upload Completion Proof</h3>
                    <textarea
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      placeholder="Add notes about the completion..."
                      className="w-full h-32 p-2 border rounded-lg mb-4"
                    />
                    <label className="block">
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="mt-2 block text-sm text-gray-600">
                            Drop files here or click to upload
                          </span>
                        </div>
                      </div>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleFileUpload(e.target.files, selectedMilestone.id);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {/* Review Controls */}
                {selectedMilestone.status === 'review' && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Review Completion</h3>
                    <textarea
                      placeholder="Add review notes..."
                      className="w-full h-32 p-2 border rounded-lg"
                    />
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => handleMilestoneApproval(selectedMilestone.id, false, '')}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleMilestoneApproval(selectedMilestone.id, true, '')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Approve & Release Funds
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}