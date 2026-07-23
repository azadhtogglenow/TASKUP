import type { DocumentInput } from '../schemas/document-schema';
import type {Document} from "../types/document";
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

  create(data: DocumentInput): Document {
    const document: Document = {
      id: this.nextId++,
      title: data.title,
      content: data.content,
      createdAt: new Date(),
    };

    this.documents.set(document.id, document);
    return document;
  }


  update(id: number, data: DocumentInput): Document  {
    const document = this.documents.get(id)!;
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