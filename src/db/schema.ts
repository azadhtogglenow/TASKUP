import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const documentStatusEnum = pgEnum('document_status', ['draft', 'published', 'archived']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 50 }).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});


export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 150 }).notNull(),
  content: text('content').notNull().default(''),
  status: documentStatusEnum('status').notNull().default('draft'),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;