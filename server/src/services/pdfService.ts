import pdf from 'pdf-parse';
import fs from 'fs/promises';

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const data = await pdf(buffer);
  return data.text;
}
