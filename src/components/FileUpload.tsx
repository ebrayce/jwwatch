import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-teal-200 rounded-xl bg-teal-50/50 hover:bg-teal-50 transition-colors cursor-pointer group h-40 flex flex-col items-center justify-center"
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv, .docx"
      />
      <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
        <UploadCloud className="w-6 h-6 text-teal-600" />
      </div>
      <span className="text-teal-700 font-medium text-sm">Tap to upload file</span>
      <span className="text-teal-400 text-xs mt-1">Excel (.xlsx) or Word (.docx)</span>
    </div>
  );
};