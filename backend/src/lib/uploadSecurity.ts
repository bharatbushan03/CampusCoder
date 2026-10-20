import path from 'path';
import crypto from 'crypto';

// Strict Magic Byte Signatures
const SIGNATURES: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // Starts with RIFF
  pdf: [0x25, 0x50, 0x44, 0x46],  // %PDF
};

export function validateMagicBytes(buffer: Buffer, expectedType: 'image' | 'pdf' | 'document'): boolean {
  if (!buffer || buffer.length < 4) return false;

  if (expectedType === 'pdf') {
    return SIGNATURES.pdf.every((byte, idx) => buffer[idx] === byte);
  }

  if (expectedType === 'document') {
    // PDF or modern zip-based documents (DOCX, PPTX, XLSX starting with PK\x03\x04)
    const isPdf = SIGNATURES.pdf.every((byte, idx) => buffer[idx] === byte);
    const isZipDoc = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    return isPdf || isZipDoc;
  }

  // Image validation: JPEG, PNG, or WebP only (SVG is strictly rejected from binary image uploaders)
  const isJpg = SIGNATURES.jpg.every((byte, idx) => buffer[idx] === byte);
  const isPng = SIGNATURES.png.every((byte, idx) => buffer[idx] === byte);
  const isWebp = SIGNATURES.webp.every((byte, idx) => buffer[idx] === byte);

  return isJpg || isPng || isWebp;
}

export function generateSecureFilename(originalName: string, forcedExtension?: string): string {
  const ext = (forcedExtension || path.extname(originalName))
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  const randomToken = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}-${randomToken}.${ext || 'bin'}`;
}
