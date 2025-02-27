<<<<<<< HEAD
// src/components/verification/VerificationRequest.tsx

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
=======
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
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
>>>>>>> feature/security-implementation
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

interface VerificationLevel {
  level: string;
  title: string;
  description: string;
  price: number;
  requiredDocuments: string[];
  benefits: string[];
}

<<<<<<< HEAD
const verificationLevels = [
  {
    id: 'BusinessPlan',
    title: 'Business Plan Verification',
    description: 'Validate your business strategy and financial projections',
    requiredDocs: ['Business Plan', 'Financial Projections', 'Market Analysis'],
    price: 5000
  },
  {
    id: 'UseCase',
    title: 'Use Case Verification',
    description: 'Validate product/service use cases and market fit',
    requiredDocs: ['Use Case Documentation', 'Customer Testimonials', 'Market Research'],
    price: 5000
  },
  {
    id: 'DemographicAlignment',
    title: 'Demographic Alignment',
    description: 'Verify target market and demographic strategy',
    requiredDocs: ['Market Segmentation', 'Demographics Research', 'Go-to-Market Strategy'],
    price: 5000
  },
  {
    id: 'AppUXUI',
    title: 'App/UX/UI Verification',
    description: 'Technical review of application and user experience',
    requiredDocs: ['Technical Documentation', 'UX/UI Designs', 'User Flow Diagrams'],
    price: 5000
  },
  {
    id: 'FiscalAnalysis',
    title: 'Fiscal Analysis',
    description: 'Comprehensive financial verification and analysis',
    requiredDocs: ['Financial Statements', 'Revenue Model', 'Cost Structure Analysis'],
    price: 5000
  }
];

const VerificationRequest = () => {
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [files, setFiles] = useState<File[]>([]);
    const [showPayment, setShowPayment] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    const handleFileChange = (files: File[]) => {
      setFiles(files);
    };
  
    const handleSubmit = async (paymentMethod: string) => {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('level', selectedLevel.id);
        files.forEach(file => formData.append('documents', file));
        formData.append('paymentMethod', paymentMethod);
  
        const response = await fetch('/api/verification/request', {
          method: 'POST',
          body: formData
        });
  
        if (!response.ok) throw new Error('Failed to submit verification request');
  
        // Reset form
        setSelectedLevel(null);
        setFiles([]);
        setShowPayment(false);
      } catch (error) {
        console.error('Error submitting verification:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Request Verification</h1>
    
          {!selectedLevel ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {verificationLevels.map(level => (
                <Card
                  key={level.id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() => setSelectedLevel(level)}
                >
                  <CardHeader>
                    <CardTitle>{level.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{level.description}</p>
                    <div className="font-semibold text-lg">${level.price.toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{selectedLevel.title}</CardTitle>
                    <button
                      onClick={() => setSelectedLevel(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Change Level
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6"
                >
                {/* Required Documents */}
                <div>
                  <h3 className="font-medium mb-4">Required Documents</h3>
                  <ul className="space-y-2">
                    {selectedLevel.requiredDocs.map((doc, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">•</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
  
                {/* Document Upload */}
                <div>
                  <h3 className="font-medium mb-4">Upload Documents</h3>
                  <FileUploader
                    accept=".pdf,.doc,.docx"
                    maxFiles={selectedLevel.requiredDocs.length}
                    maxSize={10 * 1024 * 1024} // 10MB
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Upload up to {selectedLevel.requiredDocs.length} files (PDF, DOC, DOCX, max 10MB each)
                  </p>
                </div>
  
                {/* Payment */}
                {files.length >= selectedLevel.requiredDocs.length && !showPayment && (
                  <Button
                    onClick={() => setShowPayment(true)}
                    className="w-full"
                  >
                    Continue to Payment
                  </Button>
                )}

{showPayment && (
                <div>
                  <h3 className="font-medium mb-4">Payment Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span>{selectedLevel.title}</span>
                      <span className="font-semibold">
                        ${selectedLevel.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      amount={selectedLevel.price}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                    />
                  </Elements>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
=======
interface VerificationStatus {
  currentLevel: string;
  pendingLevel: string | null;
  pendingRequest: {
    type: string;
    submittedAt: string;
    documents: string[];
  } | null;
}

const VerificationRequest: React.FC = () => {
  const [availableLevels, setAvailableLevels] = useState<VerificationLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchVerificationLevels();
    fetchVerificationStatus();
  }, []);

  const fetchVerificationLevels = async () => {
    try {
      const response = await fetch('/api/verification/levels');
      if (!response.ok) throw new Error('Failed to fetch verification levels');
      const data = await response.json();
      setAvailableLevels(data);
    } catch (error) {
      console.error('Error fetching verification levels:', error);
      setError('Failed to load verification levels');
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification/status');
      if (!response.ok) throw new Error('Failed to fetch verification status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setError('Failed to load verification status');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.map(file => {
        if (file.errors[0].code === 'file-too-large') {
          return 'File too large. Maximum size is 10MB';
        }
        return 'Invalid file type. Only PDFs and images are allowed';
      });
      setError(errors[0]);
    }
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('type', selectedLevel);
      files.forEach(file => formData.append('documents', file));

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      });

      if (!response.ok) {
        throw new Error('Failed to submit verification request');
      }

      // Clear form and refresh status
      setFiles([]);
      setSelectedLevel('');
      fetchVerificationStatus();
    } catch (error) {
      console.error('Error submitting verification:', error);
      setError('Failed to submit verification request');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const selectedLevelDetails = availableLevels.find(level => level.level === selectedLevel);

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>Your current verification level and pending requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium">Current Level:</span>
                <Badge variant="outline" className="ml-2">
                  {status.currentLevel || 'None'}
                </Badge>
              </div>

              {status.pendingRequest && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Pending Request</AlertTitle>
                  <AlertDescription>
                    Your request for {status.pendingRequest.type} verification is being reviewed.
                    Submitted on {new Date(status.pendingRequest.submittedAt).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Levels */}
      {!status?.pendingRequest && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Request Verification</CardTitle>
              <CardDescription>Select a verification level to enhance your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Level Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Verification Level
                  </label>
                  <Select
                    value={selectedLevel}
                    onValueChange={setSelectedLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a verification level" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLevels.map(level => (
                        <SelectItem key={level.level} value={level.level}>
                          {level.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Level Details */}
                {selectedLevelDetails && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="font-semibold mb-2">{selectedLevelDetails.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {selectedLevelDetails.description}
                    </p>

                    <div className="space-y-4">
                      {/* Price */}
                      <div>
                        <span className="text-sm font-medium">Price:</span>
                        <span className="ml-2">${selectedLevelDetails.price.toLocaleString()}</span>
                      </div>

                      {/* Required Documents */}
                      <div>
                        <span className="text-sm font-medium">Required Documents:</span>
                        <ul className="mt-1 space-y-1">
                          {selectedLevelDetails.requiredDocuments.map((doc, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Benefits */}
                      <div>
                        <span className="text-sm font-medium">Benefits:</span>
                        <ul className="mt-1 space-y-1">
                          {selectedLevelDetails.benefits.map((benefit, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Documents
                  </label>
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

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
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
                            onClick={() => removeFile(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Upload Progress */}
                {isSubmitting && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-gray-600">
                      Uploading documents... {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedLevel || files.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
>>>>>>> feature/security-implementation
      )}
    </div>
  );
};

export default VerificationRequest;