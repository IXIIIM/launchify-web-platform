import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Upload
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface VerificationRequest {
  id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  submittedAt: string;
  processedAt?: string;
  documents: string[];
  notes?: string;
  requiredDocuments?: string[];
}

interface VerificationHistory {
  currentLevel: string;
  pendingLevel: string | null;
  requests: VerificationRequest[];
}

const VerificationStatus: React.FC = () => {
  const [history, setHistory] = useState<VerificationHistory | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    fetchVerificationHistory();
  }, []);

  const fetchVerificationHistory = async () => {
    try {
      const response = await fetch('/api/verification/history');
      if (!response.ok) throw new Error('Failed to fetch verification history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching verification history:', error);
      setError('Failed to load verification history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdditionalDocuments = async (requestId: string, files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('documents', file));

      const response = await fetch(`/api/verification/${requestId}/documents`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to update documents');

      setShowUploadDialog(false);
      fetchVerificationHistory();
    } catch (error) {
      console.error('Error updating documents:', error);
      setError('Failed to update documents');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'info_requested':
        return (
          <Badge variant="warning" className="flex items-center">
            <Info className="w-3 h-3 mr-1" />
            Additional Info Required
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const DocumentUploadDialog: React.FC<{
    request: VerificationRequest;
    onClose: () => void;
  }> = ({ request, onClose }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadError, setUploadError] = useState('');

    const { getRootProps, getInputProps } = useDropzone({
      accept: {
        'application/pdf': ['.pdf'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png']
      },
      maxFiles: 5,
      maxSize: 10 * 1024 * 1024, // 10MB
      onDrop: (acceptedFiles) => {
        setFiles(acceptedFiles);
        setUploadError('');
      },
      onDropRejected: (rejectedFiles) => {
        setUploadError('Invalid files. Please check file types and sizes.');
      }
    });

    return (
      <DialogContent>
        <CardHeader>
          <CardTitle>Upload Additional Documents</CardTitle>
          <CardDescription>
            Please provide the requested additional documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {request.requiredDocuments && (
              <div>
                <h4 className="text-sm font-medium mb-2">Required Documents:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {request.requiredDocuments.map((doc, index) => (
                    <li key={index} className="text-sm text-gray-600">{doc}</li>
                  ))}
                </ul>
              </div>
            )}

            <div
              {...getRootProps()}
              className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG, or PNG files under 10MB
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => handleAdditionalDocuments(request.id, files)}
                disabled={files.length === 0}
              >
                Upload Documents
              </Button>
            </div>
          </div>
        </CardContent>
      </DialogContent>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!history) return null;

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Verification Status</CardTitle>
          <CardDescription>Your verification level and active requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium">Current Level:</span>
              <Badge variant="outline" className="ml-2">
                {history.currentLevel || 'None'}
              </Badge>
            </div>

            {history.pendingLevel && (
              <div>
                <span className="text-sm font-medium">Pending Level:</span>
                <Badge variant="outline" className="ml-2">
                  {history.pendingLevel}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification History */}
      <Card>
        <CardHeader>
          <CardTitle>Verification History</CardTitle>
          <CardDescription>Past verification requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{request.type} Verification</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Submitted {format(new Date(request.submittedAt), 'PPp')}
                      </p>
                      {request.processedAt && (
                        <p className="text-sm text-gray-500">
                          Processed {format(new Date(request.processedAt), 'PPp')}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {request.documents.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Documents
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <CardHeader>
                              <CardTitle>Submitted Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
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
                                    <span className="text-sm">Document {index + 1}</span>
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                  </a>
                                ))}
                              </div>
                            </CardContent>
                          </DialogContent>
                        </Dialog>
                      )}

                      {request.status === 'info_requested' && (
                        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              Upload Documents
                            </Button>
                          </DialogTrigger>
                          <DocumentUploadDialog
                            request={request}
                            onClose={() => setShowUploadDialog(false)}
                          />
                        </Dialog>
                      )}
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Notes:</span>
                      <p className="text-sm text-gray-600 mt-1">{request.notes}</p>
                    </div>
                  )}

                  {request.status === 'info_requested' && request.requiredDocuments && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm font-medium">Additional Documents Required:</span>
                      <ul className="mt-1 space-y-1">
                        {request.requiredDocuments.map((doc, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationStatus;