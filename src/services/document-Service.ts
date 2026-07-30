import { eq, and, like, sql, desc, count } from 'drizzle-orm';
import { db } from '../db';
import { documents, users } from '../db/schema';
import {
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentWithUser,
  DocumentListResponse,
  PaginatedQuery,
  JwtPayload,
} from '../types';
import { AppError } from '../middleware/errorHandler';

export async function createDocument(
  data: CreateDocumentRequest & { userId: string }
): Promise<DocumentWithUser> {
  const [document] = await db
    .insert(documents)
    .values({
      title: data.title,
      content: data.content || '',
      status: data.status || 'draft',
      userId: data.userId,
    })
    .returning();

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, data.userId))
    .limit(1);

  return {
    ...document,
    user: user || { id: data.userId, name: 'Unknown', email: '' },
  };
}


export async function getDocuments(
  query: PaginatedQuery
): Promise<DocumentListResponse> {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;
  const conditions = [];

  if (query.status) {
  const statusType = query.status as "draft" | "published" | "archived";
  conditions.push(eq(documents.status, statusType));
   }

  if (query.userId) {
    conditions.push(eq(documents.userId, query.userId));
  }

  if (query.search) {
    conditions.push(like(documents.title, `%${query.search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [docsWithUsers, totalCountResult] = await Promise.all([
    db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        status: documents.status,
        userId: documents.userId,
        version: documents.version,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(documents)
      .leftJoin(users, eq(documents.userId, users.id))
      .where(whereClause)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset),
    
    db
      .select({ count: count() })
      .from(documents)
      .where(whereClause),
  ]);

  const total = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    documents: docsWithUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}


export async function getDocumentById(
  documentId: string,
  user: JwtPayload
): Promise<DocumentWithUser> {
  const [result] = await db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      status: documents.status,
      userId: documents.userId,
      version: documents.version,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(documents)
    .leftJoin(users, eq(documents.userId, users.id))
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!result) {
    throw new AppError('Document not found', 404);
  }

  if (user.role !== 'admin' && result.userId !== user.userId) {
    throw new AppError('Access denied. You can only access your own documents.', 403);
  }

  return result;
}

export async function updateDocument(
  documentId: string,
  data: UpdateDocumentRequest,
  user: JwtPayload
): Promise<DocumentWithUser> {
  const [existing] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!existing) {
    throw new AppError('Document not found', 404);
  }

  if (user.role !== 'admin' && existing.userId !== user.userId) {
    throw new AppError('Access denied. You can only update your own documents.', 403);
  }

 
  const updateData: Partial<typeof documents.$inferInsert> = {
    updatedAt: new Date(),
    version: existing.version + 1,
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.status !== undefined) updateData.status = data.status;

  const [updated] = await db
    .update(documents)
    .set(updateData)
    .where(eq(documents.id, documentId))
    .returning();

  const [userResult] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, updated.userId))
    .limit(1);

  return {
    ...updated,
    user: userResult || { id: updated.userId, name: 'Unknown', email: '' },
  };
}


export async function deleteDocument(
  documentId: string,
  user: JwtPayload
): Promise<void> {
  const [existing] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!existing) {
    throw new AppError('Document not found', 404);
  }

  if (user.role !== 'admin' && existing.userId !== user.userId) {
    throw new AppError('Access denied. You can only delete your own documents.', 403);
  }

  await db.delete(documents).where(eq(documents.id, documentId));
}