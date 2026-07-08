export interface Document {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

export interface CreateDocumentDTO {
  title: string;
  content: string;
}