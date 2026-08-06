import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents, Document, NewDocument } from '../db/schemas.js';
import { generateEmbedding } from '../utils/embeddings.js';
import { 
  CreateDocumentInput, 
  SearchDocumentInput, 
  DocumentResponse, 
  SearchResponse 
} from '../types/index.js';


function toDocumentResponse(doc: Document): DocumentResponse {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    userId: doc.userId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}


export async function createDocument(
  userId: string, 
  input: CreateDocumentInput
): Promise<DocumentResponse> {
  console.log(' Generating embedding for document...');

  const embedding = await generateEmbedding(input.content);
  
  console.log(` Embedding generated (dimension: ${embedding.length})`);
  

  
  const newDoc: NewDocument = {
    userId,
    title: input.title,
    content: input.content,
    embedding,
  };
  
  const [createdDoc] = await db.insert(documents).values(newDoc).returning();
  
  return toDocumentResponse(createdDoc);
}


export async function getDocumentById(
  docId: string, 
  userId: string
): Promise<DocumentResponse> {
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, docId), eq(documents.userId, userId)))
    .limit(1);
  
  if (!doc) {
    const error = new Error('Document not found') as Error & { statusCode: number; code: string };
    error.statusCode = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }
  
  return toDocumentResponse(doc);
}


export async function getUserDocuments(userId: string): Promise<DocumentResponse[]> {
  const userDocs = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(documents.createdAt);
  
  return userDocs.map(toDocumentResponse);
}


export async function searchDocuments(
  userId: string, 
  input: SearchDocumentInput
): Promise<SearchResponse> {
  console.log(' Generating embedding for search query...');
  
 
  const queryEmbedding = await generateEmbedding(input.query);
  
  console.log(` Query embedding generated, searching documents...`);
  

  const results = await db.execute(sql`
    SELECT 
      id,
      user_id as "userId",
      title,
      content,
      created_at as "createdAt",
      updated_at as "updatedAt",
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM documents
    WHERE user_id = ${userId}
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${input.limit}
  `);
  
  
  const searchResults = results.rows.map((row: any) => ({
    document: {
      id: row.id,
      title: row.title,
      content: row.content,
      userId: row.userId,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    },
    similarity: parseFloat(row.similarity),
  }));
  
  console.log(` Found ${searchResults.length} similar documents`);
  
  return { results: searchResults };
}


export async function deleteDocument(
  docId: string, 
  userId: string
): Promise<{ success: boolean }> {
  const [deleted] = await db
    .delete(documents)
    .where(and(eq(documents.id, docId), eq(documents.userId, userId)))
    .returning({ id: documents.id });
  
  if (!deleted) {
    const error = new Error('Document not found') as Error & { statusCode: number; code: string };
    error.statusCode = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }
  
  return { success: true };
}