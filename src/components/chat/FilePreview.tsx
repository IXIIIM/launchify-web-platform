// src/components/chat/FilePreview.tsx

import React from 'react';
import { X } from 'lucide-react';

// File Preview Component
export const FilePreview: React.FC<{
  file: File;
  onRemove: () => void;
  uploadProgress?: number;
}> = ({ file, onRemove, uploadProgress }) => {
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('spreadsheet')) return '📊';
    if (file.type.includes('document')) return '📝';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
      <span className="text-2xl">{getFileIcon()}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        {uploadProgress !== undefined && (
          <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 hover:bg-gray-200 rounded-full"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
};

export default FilePreview;