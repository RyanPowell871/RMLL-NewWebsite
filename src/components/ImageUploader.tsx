import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { uploadImage } from '../services/cms-api';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  id?: string;
}

export function ImageUploader({ value, onChange, label, id = 'image-upload' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create local preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Upload to Supabase
      const url = await uploadImage(file);
      
      setPreviewUrl(url);
      onChange(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      setPreviewUrl(value); // Revert to original
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  return (
    <div className="space-y-3">
      {label && <Label htmlFor={id}>{label}</Label>}
      
      {/* Preview */}
      {previewUrl && (
        <div className="relative inline-block">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300"
            onError={() => {
              toast.error('Failed to load image');
              setPreviewUrl('');
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Image
            </>
          )}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={id}
        />
      </div>

      {/* URL Input */}
      <div className="space-y-1">
        <Label htmlFor={`${id}-url`} className="text-xs text-gray-500">
          Or paste image URL:
        </Label>
        <Input
          id={`${id}-url`}
          type="url"
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          disabled={isUploading}
        />
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB
      </p>
    </div>
  );
}
