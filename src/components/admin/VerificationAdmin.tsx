import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, CheckCircle, XCircle, MessageCircle, Eye, User, Calendar, AlertTriangle, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

interface VerificationRequest {
  id: string;
  userId: string;
  type: string;
  status: string;
  documents: string[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewNotes?: Array<{
    note: string;
    reviewerId: string;
    timestamp: string;
  }>;
  user: {
    id: string;
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

interface VerificationStats {
  pending: number;
  inReview: number;
  approved: number;
  rejected: number;
  pendingDocuments: number;
  averageProcessingTime: number;
}

const VerificationAdmin = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [note, setNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [activeTab, page, filterType]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/verification-requests?status=${activeTab}&page=${page}&type=${filterType}`);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data.requests);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/verification-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/admin/verification-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', notes: note })
      });
      
      if (!response.ok) throw new Error('Failed to approve request');
      
      setNote('');
      setSelectedRequest(null);
      fetchRequests();
      fetchStats();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/admin/verification-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', notes: rejectReason })
      });
      
      if (!response.ok) throw new Error('Failed to reject request');
      
      setRejectReason('');
      setShowRejectDialog(false);
      setSelectedRequest(null);
      fetchRequests();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleAddNote = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/admin/verification-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: selectedRequest.id, note })
      });
      
      if (!response.ok) throw new Error('Failed to add note');
      
      setNote('');
      setShowNoteDialog(false);
      
      // Refresh the selected request
      const requestResponse = await fetch(`/api/admin/verification-requests/${selectedRequest.id}`);
      if (requestResponse.ok) {
        const updatedRequest = await requestResponse.json();
        setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/admin/verification-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_review' })
      });
      
      if (!response.ok) throw new Error('Failed to assign request');
      
      // Refresh the selected request and list
      fetchRequests();
      
      const requestResponse = await fetch(`/api/admin/verification-requests/${selectedRequest.id}`);
      if (requestResponse.ok) {
        const updatedRequest = await requestResponse.json();
        setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error('Error assigning request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PENDING_DOCUMENTS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.user.email.toLowerCase().includes(searchLower) ||
      (request.user.entrepreneurProfile?.projectName || '').toLowerCase().includes(searchLower) ||
      (request.user.funderProfile?.name || '').toLowerCase().includes(searchLower) ||
      request.id.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    // Implementation for exporting verification data to CSV
    const headers = ['ID', 'User', 'Type', 'Status', 'Created', 'Reviewed'];
    const data = requests.map(req => [
      req.id,
      req.user.email,
      req.type,
      req.status,
      new Date(req.createdAt).toLocaleDateString(),
      req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `verification-requests-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // Mobile-friendly request card component
  const RequestCard = ({ request }: { request: VerificationRequest }) => (
    <Card 
      className={`cursor-pointer hover:bg-gray-50 ${
        selectedRequest?.id === request.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => setSelectedRequest(request)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{request.user.userType === 'entrepreneur' 
              ? request.user.entrepreneurProfile?.projectName 
              : request.user.funderProfile?.name || 'Unknown'}
            </h3>
            <p className="text-sm text-gray-500">{request.user.email}</p>
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
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">Verification Management</h1>
        
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchRequests}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Stats Cards - Responsive Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-500">Pending</div>
              <div className="text-2xl font-bold mt-1">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-500">In Review</div>
              <div className="text-2xl font-bold mt-1">{stats.inReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-500">Approved</div>
              <div className="text-2xl font-bold mt-1">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-500">Rejected</div>
              <div className="text-2xl font-bold mt-1">{stats.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-500">Awaiting Docs</div>
              <div className="text-2xl font-bold mt-1">{stats.pendingDocuments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-500">Avg. Time (days)</div>
              <div className="text-2xl font-bold mt-1">{stats.averageProcessingTime.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Verification Requests</CardTitle>
              <CardDescription>Manage verification requests from users</CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Search and Filter - Mobile Accordion for Mobile */}
              {isMobile ? (
                <Accordion type="single" collapsible className="mb-4">
                  <AccordionItem value="filters">
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Search & Filters
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Search</label>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="Search by email, name or ID"
                              className="pl-8"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">Verification Type</label>
                          <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                              <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All types</SelectItem>
                              <SelectItem value="BusinessPlan">Business Plan</SelectItem>
                              <SelectItem value="UseCase">Use Case</SelectItem>
                              <SelectItem value="Financial">Financial</SelectItem>
                              <SelectItem value="AppUXUI">App/UX/UI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search by email, name or ID"
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All verification types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="BusinessPlan">Business Plan</SelectItem>
                      <SelectItem value="UseCase">Use Case</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="AppUXUI">App/UX/UI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
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
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No verification requests found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRequests.map(request => (
                        <RequestCard key={request.id} request={request} />
                      ))}
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedRequest ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Verification Request</CardTitle>
                    <CardDescription>ID: {selectedRequest.id}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Requester</h3>
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {selectedRequest.user.userType === 'entrepreneur' 
                            ? selectedRequest.user.entrepreneurProfile?.projectName 
                            : selectedRequest.user.funderProfile?.name || 'Unknown'}
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
                    {selectedRequest.documents.length > 0 ? (
                      selectedRequest.documents.map((doc, index) => (
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
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No documents uploaded</p>
                    )}
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Select a Request</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click on a verification request to view details
                  </p>
                </div>
              </div>
            </Card>
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