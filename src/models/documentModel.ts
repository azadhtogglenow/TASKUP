import { Document, CreateDocumentDTO } from "../types/document";

// In-memory storage
const documents: Map<number, Document> = new Map();
let nextId = 1;

export const documentModel = {
  create(data: CreateDocumentDTO, userId: number): Document {
    const now = new Date();
    const document: Document = {
      id: nextId++,
      title: data.title,
      content: data.content,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    documents.set(document.id, document);
    return document;
  },

  getAll(userId?: number, userRole?: string): Document[] {
    const allDocs = Array.from(documents.values());

    // Admin sees all documents
    if (userRole === "admin") {
      return allDocs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Regular user sees only their documents
    if (userId) {
      return allDocs
        .filter((doc) => doc.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return [];
  },

  getById(id: number): Document | undefined {
    return documents.get(id);
  },

  update(id: number, data: Partial<CreateDocumentDTO>): Document | undefined {
    const document = documents.get(id);
    if (!document) return undefined;

    const updated: Document = {
      ...document,
      ...(data.title && { title: data.title }),
      ...(data.content && { content: data.content }),
      updatedAt: new Date(),
    };

    documents.set(id, updated);
    return updated;
  },

  delete(id: number): boolean {
    return documents.delete(id);
  },

  exists(id: number): boolean {
    return documents.has(id);
  },

  // Check if user owns the document
  isOwner(documentId: number, userId: number): boolean {
    const doc = documents.get(documentId);
    return doc ? doc.userId === userId : false;
  },
};