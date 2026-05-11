'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { getBikeImageUrl } from '@/lib/storageUtils';
import { toast } from 'sonner';

interface BikeImageUploadProps {
  bikeId: string;
  /** The storage key (path inside the bucket) — NOT the full URL */
  currentImageKey?: string | null;
  /** Called with the new imageKey after a successful upload */
  onUploadSuccess: (newImageKey: string, newImageUrl: string) => void;
  className?: string;
}

export function BikeImageUpload({ 
  bikeId, 
  currentImageKey, 
  onUploadSuccess,
  className 
}: BikeImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Preview is a temporary blob URL during upload, then switches to the Supabase CDN URL
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    getBikeImageUrl({ imageKey: currentImageKey })
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Client-side validation (mirrors server-side guards)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid type. Only JPG, PNG or WEBP allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5 MB.');
      return;
    }

    // Optimistic preview using a blob URL
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/bikes/${bikeId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // API returns { imageKey, imageUrl } — imageUrl is derived by the backend from config
      const { imageKey, imageUrl } = res.data;

      // Replace blob preview with the real CDN URL
      URL.revokeObjectURL(blobUrl);
      setPreviewUrl(imageUrl);

      onUploadSuccess(imageKey, imageUrl);
      toast.success('Image uploaded and optimized ✓');
    } catch (error: any) {
      URL.revokeObjectURL(blobUrl);
      toast.error(error.response?.data?.message || 'Upload failed. Please try again.');
      // Roll back to previous image
      setPreviewUrl(getBikeImageUrl({ imageKey: currentImageKey }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = '';
  };

  return (
    <div
      className={cn(
        'relative group aspect-video rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden',
        isDragging ? 'border-black bg-black/5 scale-[1.01]' : 'border-gray-200 hover:border-gray-400 bg-gray-50',
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {previewUrl ? (
        <div className="relative w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Bike preview"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Hover overlay: change / remove */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              title="Replace image"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-white rounded-full text-black hover:scale-110 transition-transform shadow-lg"
              disabled={isUploading}
            >
              <Upload size={18} />
            </button>
            <button
              type="button"
              title="Remove preview"
              onClick={() => setPreviewUrl(null)}
              className="p-2.5 bg-white rounded-full text-red-500 hover:scale-110 transition-transform shadow-lg"
              disabled={isUploading}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400 group-hover:text-gray-700 transition-colors"
          disabled={isUploading}
        >
          <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
            <ImageIcon size={30} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">Click or drag & drop</p>
            <p className="text-[10px] uppercase tracking-widest font-medium opacity-50 mt-0.5">
              JPG · PNG · WEBP — max 5 MB
            </p>
          </div>
        </button>
      )}

      {/* Upload overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
          <Loader2 className="animate-spin text-black" size={32} />
          <div className="text-center">
            <p className="text-xs font-black text-black uppercase tracking-widest">Optimizing to WEBP</p>
            <p className="text-[10px] text-gray-400 mt-1">Uploading to CDN…</p>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        disabled={isUploading}
      />
    </div>
  );
}
