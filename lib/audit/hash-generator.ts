/**
 * Cryptographic Hash Generator
 * Stage 7: Audit Trails & Legal Defensibility
 * 
 * Utilities for generating and verifying cryptographic hashes
 */

import crypto from 'crypto';

/**
 * Generate SHA-256 hash for any content
 */
export function generateHash(content: string | Buffer | Uint8Array, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  if (typeof content === 'string') {
    return crypto.createHash(algorithm).update(content, 'utf8').digest('hex');
  }
  return crypto.createHash(algorithm).update(content).digest('hex');
}

/**
 * Generate hash for file upload
 */
export async function hashFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return generateHash(buffer);
}

/**
 * Generate hash for blob content
 */
export async function hashBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return generateHash(buffer);
}

/**
 * Verify hash matches content
 */
export function verifyHash(content: string | Buffer, hash: string, algorithm: 'sha256' | 'sha512' = 'sha256'): boolean {
  const computedHash = generateHash(content, algorithm);
  return computedHash === hash;
}

/**
 * Generate deterministic hash from multiple values
 */
export function hashMultiple(values: (string | number | boolean)[], algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  const concatenated = values.map(v => String(v)).join('|');
  return generateHash(concatenated, algorithm);
}

/**
 * Create a Merkle tree hash from multiple hashes
 */
export function merkleHash(hashes: string[]): string {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];

  // Combine pairs and hash
  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    if (i + 1 < hashes.length) {
      nextLevel.push(generateHash(hashes[i] + hashes[i + 1]));
    } else {
      nextLevel.push(hashes[i]); // Odd one out
    }
  }

  // Recursively hash
  return merkleHash(nextLevel);
}

/**
 * Format hash for display (first N and last M characters)
 */
export function formatHash(hash: string, prefixLength = 8, suffixLength = 8): string {
  if (hash.length <= prefixLength + suffixLength) return hash;
  return `${hash.substring(0, prefixLength)}...${hash.substring(hash.length - suffixLength)}`;
}

/**
 * Truncate hash to short identifier
 */
export function shortHash(hash: string, length = 12): string {
  return hash.substring(0, length);
}




