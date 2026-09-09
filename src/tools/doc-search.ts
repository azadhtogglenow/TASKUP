import { desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { documents } from "../db/schema.js";

export interface DocSearchResult {
  id: number;
  title: string;
  rank: number; 
  snippet: string; 
}

export async function searchDocuments(
  query: string,
  limit = 5
): Promise<DocSearchResult[]> {
  const term = query.trim();
  if (!term) return [];

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      rank: sql<number>`ts_rank(${documents.searchVector}, websearch_to_tsquery('english', ${term}))`,
      snippet: sql<string>`ts_headline('english', ${documents.content}, websearch_to_tsquery('english', ${term}), 'StartSel=[, StopSel=], MaxFragments=2')`,
    })
    .from(documents)
    .where(sql`${documents.searchVector} @@ websearch_to_tsquery('english', ${term})`)
    .orderBy(
      desc(sql`ts_rank(${documents.searchVector}, websearch_to_tsquery('english', ${term}))`)
    )
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    rank: Number(r.rank),
    snippet: r.snippet,
  }));
}