<<<<<<< HEAD
// src/components/common/ImagePreprocessor.tsx

=======
>>>>>>> feature/security-implementation
import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const ImagePreprocessor = ({ 
  onImageSelect, 
  aspectRatio = 1, 
  maxDimension = 1000,
  className = ''
}) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const preprocessImage = useCallback((file) => {
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      // Setup canvas for processing
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob and create preview
      canvas.toBlob((blob) => {
        const optimizedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });

        setPreview(URL.createObjectURL(blob));
        onImageSelect(optimizedFile);
      }, file.type, 0.8); // 80% quality for JPEG compression
    };

    img.src = URL.createObjectURL(file);
  }, [maxDimension, onImageSelect]);

  const onDrop = useCallback((acceptedFiles) => {
    setError('');
    const file = acceptedFiles[0];

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPG or PNG file');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }

    preprocessImage(file);
  }, [preprocessImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false
  });

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="hidden" />
      
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-500' : ''}`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <img 
            src={preview} 
            alt="Preview" 
            className="mx-auto max-h-48 rounded-lg"
          />
        ) : (
          <div className="py-8">
            {isDragActive ? (
              <p className="text-blue-600">Drop the image here</p>
            ) : (
              <p className="text-gray-600">
                Drag and drop an image, or click to select
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {preview && (
        <button
          onClick={() => {
            setPreview(null);
            onImageSelect(null);
          }}
          className="mt-2 text-sm text-red-600 hover:text-red-700"
        >
          Remove image
        </button>
      )}
    </div>
  );
};

export default ImagePreprocessor;