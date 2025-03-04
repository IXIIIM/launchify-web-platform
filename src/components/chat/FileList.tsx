// src/components/chat/FileList.tsx

import React from 'react';
import { File, Download } from 'lucide-react';

// File List Component
export const FileList: React.FC<{
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  onDownload: (fileId: string) => void;
}> = ({ files, onDownload }) => {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-gray-900">Shared Files</h3>
      <div className="divide-y">
        {files.map((file) => (
          <div
            key={file.id}
            className="py-3 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <File className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(file.uploadedAt).toLocaleDateString()} •{' '}
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => onDownload(file.id)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Download className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;