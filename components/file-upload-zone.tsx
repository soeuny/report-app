"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Upload, FileSpreadsheet, X, Check } from "lucide-react"
import { SealMascot } from "@/components/seal-mascot"

interface FileUploadZoneProps {
  className?: string
}

interface UploadedFile {
  name: string
  size: number
  status: "uploading" | "complete" | "error"
  progress: number
}

export function FileUploadZone({ className }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const simulateUpload = (fileName: string, fileSize: number) => {
    const newFile: UploadedFile = {
      name: fileName,
      size: fileSize,
      status: "uploading",
      progress: 0,
    }
    setFiles((prev) => [...prev, newFile])

    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.name === fileName
            ? {
                ...f,
                progress: Math.min(f.progress + 10, 100),
                status: f.progress >= 90 ? "complete" : "uploading",
              }
            : f
        )
      )
    }, 200)

    setTimeout(() => clearInterval(interval), 2200)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    droppedFiles.forEach((file) => {
      simulateUpload(file.name, file.size)
    })
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    selectedFiles.forEach((file) => {
      simulateUpload(file.name, file.size)
    })
  }

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
          "bg-card hover:bg-secondary/50",
          isDragging
            ? "border-accent bg-accent/5 scale-[1.02]"
            : "border-border hover:border-accent/50"
        )}
      >
        <input
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
            isDragging ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
          )}>
            <Upload size={28} className={isDragging ? "animate-bounce" : ""} />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {isDragging ? "여기에 파일을 놓으세요" : "여기에 파일을 끌어다 놓으세요"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            또는 클릭하여 파일 선택
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileSpreadsheet size={14} />
              CSV
            </span>
            <span className="flex items-center gap-1">
              <FileSpreadsheet size={14} />
              XLSX
            </span>
            <span className="flex items-center gap-1">
              <FileSpreadsheet size={14} />
              XLS
            </span>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileSpreadsheet size={20} className="text-accent" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  {file.status === "uploading" && (
                    <div className="flex-1 max-w-[100px]">
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-200"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {file.status === "complete" && (
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check size={14} className="text-accent" />
                  </div>
                )}
                {file.status === "uploading" && (
                  <SealMascot size="sm" />
                )}
                <button
                  onClick={() => removeFile(file.name)}
                  className="w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
