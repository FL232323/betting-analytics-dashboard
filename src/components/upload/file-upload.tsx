// File upload component with dark theme styling
'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="grid gap-4">
      <div
        className={cn(
          'relative rounded-lg border border-dashed p-12 text-center transition-colors',
          isDragging ? 'border-primary bg-muted' : 'border-muted-foreground/25'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          // Handle file drop
        }}
      >
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Drop your Hardrock betting history</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Drag and drop your .xls file here or click to browse
          </p>
        </div>
      </div>
    </div>
  );
}