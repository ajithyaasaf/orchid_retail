'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const newImages = [...images];

    try {
      // 1. Get Signature from backend
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/admin/cloudinary-signature`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const { data } = await response.json();

      // 2. Upload each file directly to Cloudinary
      for (let i = 0; i < files.length; i++) {
        if (newImages.length >= maxImages) break;

        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', data.apiKey);
        formData.append('timestamp', data.timestamp);
        formData.append('signature', data.signature);
        formData.append('folder', 'products');

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
          { method: 'POST', body: formData }
        );
        const uploadData = await uploadRes.json();
        
        if (uploadData.secure_url) {
          newImages.push(uploadData.secure_url);
        }
      }

      onChange(newImages);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {images.map((url, i) => (
          <div key={i} className="group relative aspect-[4/5] bg-surface rounded-xl overflow-hidden border border-border">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur-sm text-error rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "aspect-[4/5] flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading ? (
              <Loader2 className="animate-spin text-primary" size={24} />
            ) : (
              <>
                <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Upload size={20} className="text-muted group-hover:text-primary" />
                </div>
                <span className="text-xs font-medium text-muted group-hover:text-primary">Upload</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleUpload(e.target.files)}
        multiple
        accept="image/*"
        className="hidden"
      />
      
      <p className="text-[10px] text-muted-foreground italic">
        * Recommended size: 800x1000px. Max {maxImages} images.
      </p>
    </div>
  );
}
