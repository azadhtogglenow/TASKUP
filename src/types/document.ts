export interface Document {
  id: number;
  title: string;
  content: string;
  userId: number;        // Owner of the document
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentDTO {
  title: string;
  content: string;
}




