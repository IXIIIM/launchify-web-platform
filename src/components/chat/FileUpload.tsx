// src/components/chat/FileUpload.tsx

import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// File Upload Component
export const FileUpload: React.FC<{
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
}> = ({ onUpload, maxFiles = 5 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = async (files: File[]) => {
    setError(null);

    // Validate number of files
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > 50 * 1024 * 1024); // 50MB limit
    if (invalidFiles.length > 0) {
      setError('Files must be under 50MB');
      return;
    }

    try {
      await onUpload(files);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error uploading files');
    }
  };

  return (
    <div className="relative">
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700"
            >
              Choose files
            </button>
            <span className="text-gray-500"> or drag and drop</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Up to {maxFiles} files, max 50MB each
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileUpload;