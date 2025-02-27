<<<<<<< HEAD
// src/components/common/ImageCropInterface.ts

=======
>>>>>>> feature/security-implementation
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ImagePreprocessor from './ImagePreprocessor';

const ImageCropInterface = ({
  onImageCrop,
  aspectRatio = 1,
  className = ''
}) => {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const handleImageSelect = (file) => {
    if (!file) {
      setImage(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Scale image to fit container while maintaining aspect ratio
      let scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height
      );

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      // Initialize crop area in center
      const cropSize = Math.min(scaledWidth, scaledHeight) * 0.8;
      setCrop({
        x: (scaledWidth - cropSize) / 2,
        y: (scaledHeight - cropSize) / 2,
        width: cropSize,
        height: cropSize * aspectRatio
      });

      setImage(img);
    };

    img.src = URL.createObjectURL(file);
  };

  const drawCropOverlay = useCallback(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image, 
      0, 
      0, 
      canvas.width, 
      canvas.height
    );

    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.clearRect(crop.x, crop.y, crop.width, crop.height);

    // Draw crop border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = 'white';
    [
      [crop.x - handleSize/2, crop.y - handleSize/2],
      [crop.x + crop.width - handleSize/2, crop.y - handleSize/2],
      [crop.x - handleSize/2, crop.y + crop.height - handleSize/2],
      [crop.x + crop.width - handleSize/2, crop.y + crop.height - handleSize/2]
    ].forEach(([x, y]) => {
      ctx.fillRect(x, y, handleSize, handleSize);
    });
  }, [image, crop]);

  useEffect(() => {
    drawCropOverlay();
  }, [drawCropOverlay]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x: x - crop.x, y: y - crop.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate new position
    let newX = x - dragStart.x;
    let newY = y - dragStart.y;

    // Keep crop area within canvas bounds
    newX = Math.max(0, Math.min(newX, canvasRef.current.width - crop.width));
    newY = Math.max(0, Math.min(newY, canvasRef.current.height - crop.height));

    setCrop(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!canvasRef.current || !image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set output size
    canvas.width = 1000;
    canvas.height = 1000 * aspectRatio;

    // Calculate source coordinates relative to original image
    const scaleX = image.width / canvasRef.current.width;
    const scaleY = image.height / canvasRef.current.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      const croppedFile = new File([blob], 'cropped-image.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      onImageCrop(croppedFile);
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className={className}>
      {!image ? (
        <ImagePreprocessor 
          onImageSelect={handleImageSelect}
          maxDimension={2000}
        />
      ) : (
        <div className="space-y-4">
          <div 
            ref={containerRef}
            className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setImage(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              Change Image
            </button>
            <button
              onClick={handleCrop}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crop & Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCropInterface;