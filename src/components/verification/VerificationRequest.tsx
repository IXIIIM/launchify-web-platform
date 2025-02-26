// src/components/verification/VerificationRequest.tsx

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/ui/file-uploader';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '@/components/payment/PaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

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
      )}
    </div>
  );
};

export default VerificationRequest;