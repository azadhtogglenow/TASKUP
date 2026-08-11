
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { config } from "../config";
import { logger } from "../utils/logger";

export class ChunkerService {

  private static splitter: RecursiveCharacterTextSplitter | null = null;

  // ----------------------------------------
  // Get or Create Splitter
  // ----------------------------------------
  private static getSplitter(): RecursiveCharacterTextSplitter {
    if (!this.splitter) {
      this.splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.processing.chunkSize,
        chunkOverlap: config.processing.chunkOverlap,
        separators: [
          "\n\n",  // First try splitting on double newlines (paragraphs)
          "\n",    // Then single newlines (lines)
          ". ",    // Then sentences
          " ",     // Then words
          "",      // Finally, character-by-character
        ],
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
      
      // Log some stats about the chunks
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


  static async  splitTextWithMetadata(
    text: string
  ): Promise<Array<{ content: string; index: number; startChar: number; endChar: number }>> {
    const chunks = await this.splitText(text);
    let currentPos = 0;
    
    return chunks.map((content, index) => {
      const startChar = currentPos;
      const endChar = currentPos + content.length;
      currentPos = endChar - config.processing.chunkOverlap;
      if (currentPos < 0) currentPos = endChar;
      
      return {
        content,
        index,
        startChar,
        endChar,
      };
    });
  }
}