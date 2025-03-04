import React, { useState, useEffect } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VerificationLevel {
  id: string;
  name: string;
  description: string;
  requiredDocuments: {
    type: string;
    description: string;
    formats: string[];
    maxSize: number;
  }[];
  price: number;
}

interface UploadStatus {
  docType: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function VerificationUpload() {
  const [levels, setLevels] = useState<VerificationLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'reviewing' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVerificationLevels();
  }, []);

  const fetchVerificationLevels = async () => {
    try {
      const response = await fetch('/api/verification/levels');
      if (!response.ok) throw new Error('Failed to fetch verification levels');
      const data = await response.json();
      setLevels(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load verification levels');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (docType: string, file: File) => {
    // Validate file
    const level = levels.find(l => l.id === selectedLevel);
    const docConfig = level?.requiredDocuments.find(d => d.type === docType);
    
    if (!docConfig) {
      setError('Invalid document type');
      return;
    }

    if (!docConfig.formats.some(format => 
      file.name.toLowerCase().endsWith(format.toLowerCase())
    )) {
      setError(`Invalid file format. Allowed formats: ${docConfig.formats.join(', ')}`);
      return;
    }

    if (file.size > docConfig.maxSize) {
      setError(`File size exceeds ${docConfig.maxSize / (1024 * 1024)}MB limit`);
      return;
    }

    // Add to uploads
    const newUpload: UploadStatus = {
      docType,
      file,
      progress: 0,
      status: 'uploading'
    };

    setUploads(prev => [...prev, newUpload]);

    // Upload file
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      formData.append('verificationLevel', selectedLevel);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploads(prev => 
            prev.map(u => 
              u.docType === docType ? { ...u, progress } : u
            )
          );
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploads(prev =>
            prev.map(u =>
              u.docType === docType ? { ...u, status: 'completed' } : u
            )
          );
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = () => {
        throw new Error('Upload failed');
      };

      xhr.open('POST', '/api/verification/upload');
      xhr.send(formData);
    } catch (error) {
      console.error('Error:', error);
      setUploads(prev =>
        prev.map(u =>
          u.docType === docType ? {
            ...u,
            status: 'error',
            error: 'Upload failed'
          } : u
        )
      );
    }
  };

  const handleLevelSelect = async (levelId: string) => {
    setSelectedLevel(levelId);
    setUploads([]);

    try {
      const response = await fetch(`/api/verification/status/${levelId}`);
      if (!response.ok) throw new Error('Failed to fetch verification status');
      const { status } = await response.json();
      setVerificationStatus(status);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to check verification status');
    }
  };

  const handleSubmitVerification = async () => {
    const level = levels.find(l => l.id === selectedLevel);
    if (!level) return;

    // Check if all required documents are uploaded
    const missingDocs = level.requiredDocuments.filter(doc =>
      !uploads.some(u => u.docType === doc.type && u.status === 'completed')
    );

    if (missingDocs.length > 0) {
      setError(`Missing required documents: ${missingDocs.map(d => d.type).join(', ')}`);
      return;
    }

    try {
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelId: selectedLevel,
          uploads: uploads.map(u => ({
            docType: u.docType,
            fileName: u.file.name
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to submit verification');
      
      setVerificationStatus('reviewing');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to submit verification');
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
      <h1 className="text-2xl font-bold mb-6">Verification Center</h1>

      {/* Verification Levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {levels.map((level) => (
          <Card
            key={level.id}
            className={`cursor-pointer transition-shadow hover:shadow-lg ${
              selectedLevel === level.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleLevelSelect(level.id)}
          >
            <CardHeader>
              <CardTitle>{level.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{level.description}</p>
              <div className="text-lg font-bold text-blue-600">
                ${level.price.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedLevel && (
        <div className="space-y-6">
          {/* Document Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {levels
                .find(l => l.id === selectedLevel)
                ?.requiredDocuments.map((doc) => {
                  const upload = uploads.find(u => u.docType === doc.type);
                  
                  return (
                    <div key={doc.type} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{doc.type}</h3>
                          <p className="text-sm text-gray-600">{doc.description}</p>
                          <p className="text-sm text-gray-500">
                            Formats: {doc.formats.join(', ')} | 
                            Max size: {doc.maxSize / (1024 * 1024)}MB
                          </p>
                        </div>
                        {!upload && (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept={doc.formats.map(f => `.${f}`).join(',')}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(doc.type, file);
                              }}
                            />
                            <div className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                              <Upload className="h-5 w-5 mr-2" />
                              Upload
                            </div>
                          </label>
                        )}
                      </div>

                      {upload && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-gray-500" />
                              <span className="text-sm">{upload.file.name}</span>
                            </div>
                            {upload.status !== 'uploading' && (
                              <button
                                onClick={() => setUploads(prev =>
                                  prev.filter(u => u.docType !== doc.type)
                                )}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                          
                          {upload.status === 'uploading' && (
                            <div className="space-y-1">
                              <Progress value={upload.progress} className="h-2" />
                              <div className="text-sm text-gray-500">
                                {Math.round(upload.progress)}%
                              </div>
                            </div>
                          )}

                          {upload.status === 'completed' && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span>Upload complete</span>
                            </div>
                          )}

                          {upload.status === 'error' && (
                            <div className="flex items-center text-red-600">
                              <AlertCircle className="h-5 w-5 mr-2" />
                              <span>{upload.error}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          {/* Status and Submit */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-medium">Verification Status</h3>
                  <div className={`text-sm ${
                    verificationStatus === 'approved'
                      ? 'text-green-600'
                      : verificationStatus === 'rejected'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}>
                    {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
                  </div>
                </div>
                {verificationStatus === 'pending' && (
                  <button
                    onClick={handleSubmitVerification}
                    disabled={uploads.some(u => u.status === 'uploading')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Submit for Review
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}