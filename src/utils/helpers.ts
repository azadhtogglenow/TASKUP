import { FileType } from "../types/document";
export function getFileType(filename: string): FileType | null {
  const ext = filename.toLowerCase().split(".").pop();
  
  switch (ext) {
    case "pdf":
      return "pdf";
    case "docx":
      return "docx";
    default:
      return null;
  }
}

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function getProgressBar(current: number, total: number, width: number = 30): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  
  return `[${"=".repeat(filled)}${" ".repeat(empty)}] ${percentage}%`;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, "_") // Replace special chars
    .replace(/\s+/g, "_")          // Replace spaces
    .substring(0, 255);            // Limit length
}

export function calculateProcessingTime(startTime: Date): string {
  const endTime = new Date();
  const diffMs = endTime.getTime() - startTime.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}