"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send, X } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string | null) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetImage = () => {
    setImageBase64(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (disabled) return;
    if (!input.trim() && !imageBase64) return;
    const message = input.trim() || "Image attached.";
    onSend(message, imageBase64);
    setInput("");
    resetImage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImageError("Image must be 4MB or smaller.");
      return;
    }
    try {
      const resized = await resizeImage(file, 1280, 0.82);
      setImageBase64(resized);
      setImageError(null);
    } catch (error) {
      setImageError("Could not process the image.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-border bg-background p-4"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
        disabled={disabled}
      />
      <Textarea
        placeholder="Describe your maintenance issue..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="min-h-[44px] max-h-[200px] resize-none bg-muted border-0 focus-visible:ring-1"
        rows={1}
      />
      <div className="flex flex-col items-end gap-1">
        {imageBase64 && (
          <div className="relative">
            <img
              src={imageBase64}
              alt="Upload preview"
              className="h-12 w-12 rounded-md object-cover border border-border"
            />
            <button
              type="button"
              onClick={resetImage}
              className="absolute -top-2 -right-2 rounded-full bg-background border border-border p-0.5"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {imageError && (
          <span className="text-xs text-destructive">{imageError}</span>
        )}
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="h-11 w-11 shrink-0"
        >
          <ImagePlus className="h-4 w-4" />
          <span className="sr-only">Upload image</span>
        </Button>
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={(!input.trim() && !imageBase64) || disabled}
        className="h-11 w-11 shrink-0"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}

async function resizeImage(file: File, maxDimension: number, quality: number): Promise<string> {
  const image = await loadImageFromFile(file);
  const { width, height } = image;
  const maxSide = Math.max(width, height);
  const scale = maxSide > maxDimension ? maxDimension / maxSide : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No canvas context");
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const mimeType = file.type || "image/jpeg";
  const blob = await canvasToBlob(canvas, mimeType, quality);
  return blobToDataUrl(blob);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create blob"));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}
