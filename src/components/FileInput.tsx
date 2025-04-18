// src/components/FileInput.tsx
'use client';

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
  useEffect,
  InputHTMLAttributes,
  forwardRef, // Import forwardRef
  useImperativeHandle // Import useImperativeHandle
} from 'react';
import { FaUpload, FaFileAudio, FaFileImage } from 'react-icons/fa'; // Example icons

// Define the props, extending standard input attributes
interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  name: string;
  label: string;
  accept?: string;
  required?: boolean;
  // Optional prop to trigger reset from parent
  resetKey?: string | number;
}

// Define the type for the ref handle
export interface FileInputRef {
  reset: () => void;
}

// Use forwardRef to allow parent components to get a ref to this component
const FileInput = forwardRef<FileInputRef, FileInputProps>(({
  name,
  label,
  accept,
  required,
  resetKey, // Destructure the resetKey prop
  className, // Allow passing additional classes
  ...rest
}, ref) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null); // Store file type (e.g., 'audio', 'image')
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to reset the component's state
  const resetState = () => {
    setFileName(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the native input value
    }
  };

  // Expose the reset function via the ref
  useImperativeHandle(ref, () => ({
    reset: resetState
  }));

  // Effect to reset the component when the resetKey changes
  useEffect(() => {
    if (resetKey !== undefined) {
      resetState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]); // Run effect when resetKey changes

  const updateFileInfo = (file: File | null) => {
    if (file) {
      setFileName(file.name);
      setFileType(file.type.split('/')[0]); // Get 'audio' or 'image'
    } else {
      setFileName(null);
      setFileType(null);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    updateFileInfo(files && files.length > 0 ? files[0] : null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      if (fileInputRef.current) {
        // Check if the dropped file type is acceptable
        const droppedFile = files[0];
        if (accept) {
          const acceptedTypes = accept.split(',').map(t => t.trim());
          const fileMimeType = droppedFile.type;
          const fileBaseType = fileMimeType.split('/')[0] + '/*'; // e.g. audio/*
          if (acceptedTypes.includes(fileMimeType) || acceptedTypes.includes(fileBaseType)) {
             fileInputRef.current.files = files;
             updateFileInfo(droppedFile);
          } else {
            // Optionally show an error toast or message here
             console.warn(`Dropped file type (${fileMimeType}) not accepted.`);
             updateFileInfo(null); // Reset if not accepted
          }
        } else {
           // If no accept prop, accept any file
           fileInputRef.current.files = files;
           updateFileInfo(droppedFile);
        }
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Helper function to get the icon based on file type
  const getFileIcon = () => {
    if (fileType === 'audio') return <FaFileAudio className="mr-2 text-lg text-blue-500" />;
    if (fileType === 'image') return <FaFileImage className="mr-2 text-lg text-purple-500" />;
    return null; // Or a default file icon
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-text-primary">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`relative flex min-h-[6rem] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2
          ${isDragging
            ? 'border-brand bg-brand/10'
            : fileName
              ? 'border-green-500 bg-green-500/10'
              : 'border-surface-400 bg-surface-200/50 hover:border-surface-500'
          }
          `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0} // Make the div focusable
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }} // Trigger click on Enter/Space
      >
        {/* Hidden native input */}
        <input
          type="file"
          name={name}
          accept={accept}
          required={required && !fileName} // Only required if no file is currently selected via state
          ref={fileInputRef}
          onChange={handleFileChange}
          className="sr-only"
          {...rest}
        />

        {/* Display content */}
        {fileName ? (
          <div className="flex flex-col items-center text-text-primary">
            {getFileIcon()}
            <span className="font-semibold break-all px-2">{fileName}</span>
             <span className="mt-1 text-xs text-surface-500">(Click or drop again to change)</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-surface-400 pointer-events-none"> {/* pointer-events-none prevents interfering with drop */}
            <FaUpload className="mb-2 text-3xl" />
            <span className='font-medium text-surface-500'>Drag & drop or click to upload</span>
            {accept && (
              <span className="mt-1 text-xs text-surface-500">
                {/* Improve formatting of accepted types */}
                Accepts: {accept.split(',').map(a => a.trim().split('/')[1] || a.trim()).filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

FileInput.displayName = 'FileInput'; // Add display name for React DevTools

export default FileInput;