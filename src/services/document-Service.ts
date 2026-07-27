import { DocumentModel, Document } from '../models/document-model';
import { CreateDocumentInput, UpdateDocumentInput } from '../validators/schemas';

export const DocumentService = {
  async getById(id: string): Promise<Document> {
    const doc = await DocumentModel.findById(id);
    if (!doc) throw new Error('Document not found');
    return doc;
  },

  async getUserDocuments(userId: string): Promise<Document[]> {
    return DocumentModel.findByUserId(userId);
  },

  async getAll(): Promise<Document[]> {
    return DocumentModel.findAll();
  },

  async create(userId: string, input: CreateDocumentInput): Promise<Document> {
    return DocumentModel.create(userId, input.title, input.file_path);
  },

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    const doc = await DocumentModel.update(id, input);
    if (!doc) throw new Error('Document not found');
    return doc;
  },

  async delete(id: string): Promise<void> {
    const deleted = await DocumentModel.delete(id);
    if (!deleted) throw new Error('Document not found');
  },
};