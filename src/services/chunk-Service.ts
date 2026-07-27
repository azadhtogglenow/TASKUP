import { ChunkModel, Chunk } from '../models/chunk-Model';
import { DocumentModel } from '../models/document-model';
import { CreateChunkInput } from '../validators/schemas';

export const ChunkService = {
  async getByDocumentId(documentId: string): Promise<Chunk[]> {
    const doc = await DocumentModel.findById(documentId);
    if (!doc) throw new Error('Document not found');
    return ChunkModel.findByDocumentId(documentId);
  },

  async create(input: CreateChunkInput): Promise<Chunk> {
    const doc = await DocumentModel.findById(input.document_id);
    if (!doc) throw new Error('Document not found');
    return ChunkModel.create(input.document_id, input.content, input.chunk_index);
  },

  async delete(id: string): Promise<void> {
    const deleted = await ChunkModel.delete(id);
    if (!deleted) throw new Error('Chunk not found');
  },
};