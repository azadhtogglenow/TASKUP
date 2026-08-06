import { pipeline, Tensor } from '@huggingface/transformers';
type ExtractorPipeline = Awaited<ReturnType<typeof pipeline &(() => any)>>;
let extractorPromise: Promise<ExtractorPipeline> | null = null;

async function getExtractor(): Promise<ExtractorPipeline> {
  if (!extractorPromise) {
    console.log('Loading embedding model (first run may take time to download)...');
    
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      .then((loadedExtractor) => {
        console.log(' Embedding model loaded successfully!');
        return loadedExtractor;
      })
      .catch((error) => {
        extractorPromise = null; 
        console.error(' Failed to load the embedding model:', error);
        throw error;
      });
  }
  return extractorPromise;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await getExtractor();
  
  const output = await model(text, {
    pooling: 'mean',
    normalize: true,
  }) as Tensor;
  
  const embedding = output.tolist() as number[][];
  return embedding[0]; 
}


export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = await getExtractor();
  
  const output = await model(texts, {
    pooling: 'mean',
    normalize: true,
  }) as Tensor;
  
  return output.tolist() as number[][];
}
