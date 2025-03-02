// src/components/chat/FileMessage.tsx

import React, { useState } from 'react';
import { File, Download } from 'lucide-react';

// File Message Component
export const FileMessage: React.FC<{
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  };
  isOwn: boolean;
  onDownload: () => void;
}> = ({ file, isOwn, onDownload }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg ${
        isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100'
      }`}
    >
      <File className={`h-5 w-5 ${isOwn ? 'text-white' : 'text-gray-500'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.name}</p>
        <p className={`text-sm ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`p-2 rounded-full transition-colors ${
          isOwn
            ? 'hover:bg-blue-700 disabled:bg-blue-700'
            : 'hover:bg-gray-200 disabled:bg-gray-200'
        }`}
      >
        <Download
          className={`h-5 w-5 ${
            isOwn ? 'text-white' : 'text-gray-500'
          } ${isDownloading ? 'animate-bounce' : ''}`}
        />
      </button>
    </div>
  );
};

export default FileMessage;