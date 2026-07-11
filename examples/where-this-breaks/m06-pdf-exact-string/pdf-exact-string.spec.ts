import { test, expect } from '@playwright/test';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

/** Minimal PDF with the same bytes the Juice Shop proxy stub serves in M06 demos. */
const STUB_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 72 720 Td (Total orders: $123.45) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000261 00000 n \n0000000354 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n422\n%%EOF',
);

async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  return content.items.map((item) => ('str' in item ? item.str : '')).join('');
}

test('brittle exact PDF string — fails when spacing drifts', async () => {
  const text = await extractPdfText(STUB_PDF);

  // Anti-pattern: golden-string assertion copied from one parser run. Extra whitespace
  // between tokens is enough to fail even when the PDF content is unchanged.
  expect(text).toBe('Total orders:  $123.45');
});
