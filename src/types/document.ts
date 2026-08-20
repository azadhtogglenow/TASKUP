export type DocumentStatus = 
  | "uploaded"  
  | "processing"  
  | "completed"    
  | "failed";      

export type FileType = "pdf" | "docx";

export interface Document {
  id: string;                    
  filename: string;              
  filetype: FileType;            
  filesize: number;              
  s3Key: string;                 
  status: DocumentStatus;        
  errorMessage?: string | null;  
  chunkCount?: number | null;    
  createdAt: Date;               
  updatedAt: Date;              
}
export interface UploadResponse {
  id: string;              
  filename: string;        
  status: DocumentStatus;  
  message: string;         
}

export interface DocumentStatusResponse {
  id: string;
  filename: string;
  status: DocumentStatus;
  chunkCount: number | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}


export interface DocumentChunk {
  id: string;           
  documentId: string;   
  content: string;      
  chunkIndex: number;   
  embedding?: number[]; 
  metadata?: Record<string, unknown>; 
}