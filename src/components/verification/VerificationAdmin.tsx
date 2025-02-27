// src/components/verification/VerificationAdmin.tsx

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, CheckCircle, XCircle, MessageCircle, Eye, User, Calendar, AlertTriangle } from 'lucide-react';

const VerificationAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [note, setNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/verification/requests?status=${activeTab}`);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/verification/requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note })
      });
      
      if (!response.ok) throw new Error('Failed to approve request');
      
      setNote('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`/api/verification/requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      
      if (!response.ok) throw new Error('Failed to reject request');
      
      setRejectReason('');
      setShowRejectDialog(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleAddNote = async () => {
    try {
      const response = await fetch(`/api/verification/requests/${selectedRequest.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      
      if (!response.ok) throw new Error('Failed to add note');
      
      setNote('');
      setShowNoteDialog(false);
      
      // Refresh the selected request
      const requestResponse = await fetch(`/api/verification/requests/${selectedRequest.id}`);
      if (requestResponse.ok) {
        const updatedRequest = await requestResponse.json();
        setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleAssignToMe = async () => {
    try {
      const response = await fetch(`/api/verification/requests/${selectedRequest.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: 'current-user-id' }) // This would be the actual user ID
      });
      
      if (!response.ok) throw new Error('Failed to assign request');
      
      // Refresh the selected request
      const requestResponse = await fetch(`/api/verification/requests/${selectedRequest.id}`);
      if (requestResponse.ok) {
        const updatedRequest = await requestResponse.json();
        setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error('Error assigning request:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PENDING_DOCUMENTS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Verification Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
              <TabsTrigger value="in_review" className="flex-1">In Review</TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No verification requests found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(request => (
                    <Card 
                      key={request.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedRequest?.id === request.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{request.user.userType === 'entrepreneur' 
                              ? request.user.entrepreneurProfile?.projectName 
                              : request.user.funderProfile?.name}
                            </h3>
                            <p className="text-sm text-gray-500">{request.type} Verification</p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="mt-3 flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </div>

        <div className="lg:col-span-2">
          {selectedRequest ? (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Verification Request</h2>
                    <p className="text-gray-500">ID: {selectedRequest.id}</p>
                  </div>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Requester</h3>
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {selectedRequest.user.userType === 'entrepreneur' 
                            ? selectedRequest.user.entrepreneurProfile?.projectName 
                            : selectedRequest.user.funderProfile?.name}
                        </p>
                        <p className="text-sm text-gray-500">{selectedRequest.user.email}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedRequest.user.userType.charAt(0).toUpperCase() + 
                           selectedRequest.user.userType.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Request Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Type</span>
                        <span className="font-medium">{selectedRequest.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Submitted</span>
                        <span className="font-medium">
                          {new Date(selectedRequest.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {selectedRequest.reviewerId && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Reviewer</span>
                          <span className="font-medium">{selectedRequest.reviewerId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Documents</h3>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-500 mr-3" />
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate font-medium">Document {index + 1}</p>
                        </div>
                        <a 
                          href={doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          <span>View</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRequest.reviewNotes?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Review Notes</h3>
                    <div className="space-y-3">
                      {selectedRequest.reviewNotes.map((note, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <span className="font-medium">{note.reviewerId}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(note.timestamp).toLocaleString()}</span>
                          </div>
                          <p>{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {selectedRequest.status === 'PENDING' && (
                    <Button onClick={handleAssignToMe}>
                      Assign to Me
                    </Button>
                  )}
                  
                  {selectedRequest.status === 'IN_REVIEW' && (
                    <>
                      <Button onClick={() => setShowNoteDialog(true)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                      
                      <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      
                      <Button variant="default" onClick={handleApprove}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </>
                  )}
                  
                  {selectedRequest.status === 'PENDING_DOCUMENTS' && (
                    <div className="flex items-center p-3 bg-yellow-50 text-yellow-800 rounded-lg w-full">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <p className="text-sm">Waiting for additional documents from user</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 bg-gray-50 rounded-lg">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select a Request</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Click on a verification request to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification Request</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Reason for Rejection
            </label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejecting this verification request"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Review Note</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Note
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note to the verification review"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddNote}
              disabled={!note.trim()}
            >
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationAdmin;