"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  File,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

interface FileUploadProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  maxFileSize?: number; // in bytes, default 10MB
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 5;
const DEFAULT_ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "text/plain",
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Film;
  if (type.includes("pdf") || type.includes("document") || type.includes("word"))
    return FileText;
  return File;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function FileUpload({
  onFilesSelected,
  maxFileSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (file.size > maxFileSize) {
        return {
          valid: false,
          error: `File exceeds ${formatFileSize(maxFileSize)} limit`,
        };
      }
      if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
        return {
          valid: false,
          error: "File type not supported",
        };
      }
      return { valid: true };
    },
    [maxFileSize, acceptedTypes]
  );

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: UploadedFile[] = [];
      const filesToProcess = Array.from(fileList).slice(
        0,
        maxFiles - files.length
      );

      filesToProcess.forEach((file) => {
        const validation = validateFile(file);
        const uploadedFile: UploadedFile = {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: validation.valid ? 0 : 100,
          status: validation.valid ? "pending" : "error",
          error: validation.error,
        };
        newFiles.push(uploadedFile);
      });

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);

      // Simulate upload progress for valid files
      newFiles.forEach((uploadedFile) => {
        if (uploadedFile.status === "pending") {
          simulateUpload(uploadedFile.id);
        }
      });
    },
    [files, maxFiles, validateFile, onFilesSelected]
  );

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) => {
          const updated = prev.map((f) =>
            f.id === fileId
              ? { ...f, progress: 100, status: "complete" as const }
              : f
          );
          onFilesSelected(updated);
          return updated;
        });
      } else {
        setFiles((prev) => {
          const updated = prev.map((f) =>
            f.id === fileId
              ? { ...f, progress, status: "uploading" as const }
              : f
          );
          return updated;
        });
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter((f) => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          files.length >= maxFiles && "opacity-50 pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
          disabled={files.length >= maxFiles}
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "p-4 rounded-full transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Max {formatFileSize(maxFileSize)} per file, up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile) => {
            const FileIcon = getFileIcon(uploadedFile.type);
            return (
              <div
                key={uploadedFile.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-card",
                  uploadedFile.status === "error" && "border-destructive/50"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    uploadedFile.status === "error"
                      ? "bg-destructive/10"
                      : "bg-muted"
                  )}
                >
                  <FileIcon
                    className={cn(
                      "h-5 w-5",
                      uploadedFile.status === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadedFile.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.size)}
                    </span>
                    {uploadedFile.status === "error" && (
                      <span className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {uploadedFile.error}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {(uploadedFile.status === "uploading" ||
                    uploadedFile.status === "pending") && (
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {uploadedFile.status === "complete" && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(uploadedFile.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
