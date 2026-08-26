import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export interface ChunkWithMetadata {
  content: string;
  index: number;
  startChar: number;
  endChar: number;
}

export class ChunkerService {
  private static splitter: RecursiveCharacterTextSplitter | null = null;

  private static getSplitter(): RecursiveCharacterTextSplitter {
    if (!this.splitter) {
      this.splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.processing.chunkSize,
        chunkOverlap: config.processing.chunkOverlap,
        separators: ["\n\n", "\n", ". ", " ", ""],
      });
    }
    return this.splitter;
  }

  static async splitText(text: string): Promise<string[]> {
    logger.info(`Splitting text (${text.length} chars)...`);
    try {
      const splitter = this.getSplitter();
      const chunks = await splitter.splitText(text);
      
      logger.info(`Split into ${chunks.length} chunks`);
      
      if (chunks.length > 0) {
        const sizes = chunks.map((c) => c.length);
        const avgSize = Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length);
        const minSize = Math.min(...sizes);
        const maxSize = Math.max(...sizes);
        logger.info(`Chunk sizes - Min: ${minSize}, Max: ${maxSize}, Avg: ${avgSize}`);
      }
      return chunks;
    } catch (error) {
      logger.error(`Chunking error: ${error}`);
      throw new Error(`Failed to chunk text: ${error}`);
    }
  }

  static async splitTextWithMetadata(text: string): Promise<ChunkWithMetadata[]> {
    try {
      const splitter = this.getSplitter();
      const docs = await splitter.createDocuments([text]);

      return docs.map((doc, index) => {
        const startChar = doc.metadata?.loc?.lines?.from ?? 0;
        const endChar = doc.metadata?.loc?.lines?.to ?? doc.pageContent.length;

        return {
          content: doc.pageContent,
          index: index, 
          startChar,
          endChar
        };
      });
    } catch (error) {
      logger.error(`Metadata chunk splitting error: ${error}`);
      throw new Error(`Failed to safely partition metadata text: ${error}`);
    }
  }
}
