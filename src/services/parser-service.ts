import { logger } from "../utils/logger";

let pdfParse: (buffer: Buffer, options?: any) => Promise<{ text: string; numpages: number }>;
let mammoth: {
  extractRawText: (options: { buffer: Buffer }) => Promise<{ value: string; messages: any[] }>;
};

async function loadParsers() {
  if (!pdfParse) {
    const pdfModule = await import("pdf-parse");
    pdfParse = pdfModule.default || pdfModule; 
  }
  if (!mammoth) {
    const mammothModule = await import("mammoth");
    mammoth = mammothModule.default || mammothModule;
  }
}

export class ParserService {

  static async parse(
    fileBuffer: Buffer,
    filetype: "pdf" | "docx",
    filename: string
  ): Promise<string> {
    await loadParsers();

    logger.info(`Parsing ${filetype.toUpperCase()} file: ${filename}`);

    switch (filetype.toLowerCase()) {
      case "pdf":
        return await this.parsePDF(fileBuffer);
      case "docx":
        return await this.parseDOCX(fileBuffer);
      default:
        throw new Error(`Unsupported file type: ${filetype}`);
    }
  }

  private static async parsePDF(fileBuffer: Buffer): Promise<string> {
    try {
      const magicNumber = fileBuffer.subarray(0, 4).toString('utf-8');
      if (magicNumber !== '%PDF') {
        const textSnippet = fileBuffer.subarray(0, 250).toString('utf-8');
        if (textSnippet.includes('<Error>') || textSnippet.includes('AccessDenied')) {
          throw new Error(`The file payload is an S3 Storage Error instead of a PDF asset. Content: ${textSnippet.trim()}`);
        }
        throw new Error(`Invalid file signature. Expected "%PDF", received "${magicNumber}"`);
      }

      const options = {
        pagerender: function(pageData: any) {
          return pageData.getTextContent()
            .then(function(textContent: any) {
              return textContent.items.map((item: any) => item.str).join(' ');
            })
            .catch((err: any) => {
              logger.warn(`      Warning processing individual page content: ${err.message}`);
              return '';
            });
        }
      };

      const result = await pdfParse(fileBuffer, options);
      const text = result.text.trim();
      logger.info(`   PDF parsed: ${text.length} characters, ${result.numpages} pages`);
      
      return text;
    } catch (error: any) {
      logger.error(`PDF parsing error: ${error.message || error}`);
      // Throw a structured error that your queue processor can catch cleanly
      throw new Error(`MALFORMED_PDF: ${error.message || error}`);
    }
  }


  private static async parseDOCX(fileBuffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({
        buffer: fileBuffer,
      });
      
      const text = result.value.trim();
      logger.info(`   DOCX parsed: ${text.length} characters`);
      
      if (result.messages && result.messages.length > 0) {
           logger.warn(`   DOCX warnings: ${JSON.stringify(result.messages)}`);
       }
      
      return text;
    } catch (error: any) {
      logger.error(`DOCX parsing error: ${error.message || error}`);
      throw new Error(`Failed to parse DOCX: ${error.message || error}`);
    }
  }

  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, " ")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}
