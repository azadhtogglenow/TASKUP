-- Create user_role enum
CREATE TYPE "user_role" AS ENUM ('admin', 'user');
CREATE TYPE "document_status" AS ENUM ('draft', 'published', 'archived');
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'user',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE "documents" (
  "id" uuid PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL DEFAULT '',
  "status" "document_status" NOT NULL DEFAULT 'draft',
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "documents_user_id_idx" ON "documents" ("user_id");
CREATE INDEX "documents_status_idx" ON "documents" ("status");
CREATE INDEX "documents_created_at_idx" ON "documents" ("created_at");