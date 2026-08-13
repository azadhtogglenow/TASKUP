export interface DocumentProcessingJobData {
  documentId: string;    
  s3Key: string;        
  filename: string;      
  filetype: "pdf" | "docx";  
}
export interface DocumentProcessingJobResult {
  documentId: string;
  chunkCount: number;
  success: boolean;
  error?: string;
}
export interface DocumentProcessingProgress {
  stage: "downloading" | "parsing" | "chunking" | "embedding" | "storing" | "completed";
  current: number;
  total?: number;
  message: string;
}
export const DOCUMENT_QUEUE_NAME = "document-processing";