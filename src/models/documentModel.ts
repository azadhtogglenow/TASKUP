import { Document, CreateDocumentDTO } from "../types/document";

class DocumentModel {
  private documents: Map<number, Document>;
  private nextId: number;

  constructor() {
    this.documents = new Map<number, Document>();
    this.nextId = 1;
  }

  getAll(): Document[] {
    return Array.from(this.documents.values());
  }

  getById(id: number): Document | undefined {
    return this.documents.get(id);
  }

  create(data: CreateDocumentDTO): Document {
    const document: Document = {
      id: this.nextId++,
      title: data.title,
      content: data.content,
      createdAt: new Date(),
    };

    this.documents.set(document.id, document);
    return document;
  }

  update(id: number, data: CreateDocumentDTO): Document | null {
    const document = this.documents.get(id);

    if (!document) {
      return null;
    }

    document.title = data.title;
    document.content = data.content;

    this.documents.set(id, document);
    return document;
  }

  delete(id: number): boolean {
    return this.documents.delete(id);
  }

  exists(id: number): boolean {
    return this.documents.has(id);
  }
}

export const documentModel = new DocumentModel();