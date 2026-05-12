"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface ImageUploadProps {
  value?: string | string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  max?: number;
  bucket?: string;
  path?: string;
  uploadFn?: (file: File) => Promise<string>;
  className?: string;
}

export function ImageUpload({ value, onChange, multiple = false, max = 5, uploadFn, className }: ImageUploadProps) {
  const urls = Array.isArray(value) ? value : value ? [value] : [];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!uploadFn) {
      // Demo mode: use object URLs so the UI works without Supabase
      const objectUrls = acceptedFiles.map((f) => URL.createObjectURL(f));
      onChange(multiple ? [...urls, ...objectUrls].slice(0, max) : [objectUrls[0]]);
      return;
    }
    const uploaded = await Promise.all(acceptedFiles.map(uploadFn));
    onChange(multiple ? [...urls, ...uploaded].slice(0, max) : [uploaded[0]]);
  }, [urls, multiple, max, onChange, uploadFn]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple,
    maxFiles: multiple ? max - urls.length : 1,
    disabled: urls.length >= max,
  });

  return (
    <div className={className}>
      {urls.length < max && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-brand-primary bg-brand-primary/5" : "border-neutral-300 hover:border-brand-primary"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-700 font-medium">Drag & drop or click to upload</p>
          <p className="text-xs text-neutral-500 mt-1">PNG, JPG up to 10MB</p>
        </div>
      )}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {urls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 group">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
