import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

/** Extract plain text from a PDF buffer — Node-safe pdfjs-dist import for M06 demos. */
export async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  return content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
}
