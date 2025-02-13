'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      // Handle file upload
      console.log('File dropped:', files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors
        ${isDragging ? 'border-blue-500 bg-gray-700' : 'border-gray-600'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center">
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Drop your Hardrock betting history file here
        </h3>
        <p className="text-gray-400">
          Supports .xls and .xlsx files
        </p>
      </div>
    </div>
  );
}