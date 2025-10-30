/**
 * Evidence Chain of Custody Management
 * Stage 7: Audit Trails & Legal Defensibility
 * 
 * Provides cryptographic hashing and chain of custody tracking
 * for legal defensibility in trade remedy proceedings
 */

import crypto from 'crypto';
import { EvidenceType, AuditLog, EvidenceHash, DataLineage } from '@/types/database';

/**
 * Generate SHA-256 hash for evidence content
 */
export function generateEvidenceHash(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate hash for audit log entry
 */
export function generateAuditLogHash(
  id: string,
  actionType: string,
  entityType: string,
  entityId: string,
  userId: string,
  timestamp: string,
  changes: Record<string, any>,
  metadata: Record<string, any>
): string {
  const payload =
    id + actionType + entityType + entityId + userId +
    timestamp + JSON.stringify(changes) + JSON.stringify(metadata);

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Store evidence hash in database
 */
export interface StoreEvidenceHashParams {
  evidenceId: string;
  evidenceType: EvidenceType;
  fileName: string;
  fileContent: Blob;
  fileUrl?: string;
  generatedBy?: string;
  metadata?: Record<string, any>;
}

export async function storeEvidenceHash(params: StoreEvidenceHashParams): Promise<string> {
  // Convert blob to buffer for hashing
  const arrayBuffer = await params.fileContent.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate hash
  const sha256Hash = generateEvidenceHash(buffer);

  // Store in database
  const response = await fetch('/api/audit/evidence-hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evidence_id: params.evidenceId,
      evidence_type: params.evidenceType,
      file_name: params.fileName,
      file_size: buffer.length,
      file_url: params.fileUrl,
      sha256_hash: sha256Hash,
      generated_by: params.generatedBy,
      generation_metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to store evidence hash: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Verify evidence integrity by comparing hashes
 */
export interface VerifyEvidenceParams {
  evidenceId: string;
  evidenceType: EvidenceType;
  fileContent: Blob;
}

export async function verifyEvidenceIntegrity(params: VerifyEvidenceParams): Promise<boolean> {
  // Generate hash of current file
  const arrayBuffer = await params.fileContent.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const currentHash = generateEvidenceHash(buffer);

  // Compare with stored hash
  const response = await fetch(
    `/api/audit/verify?evidence_id=${params.evidenceId}&evidence_type=${params.evidenceType}&file_hash=${currentHash}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error(`Failed to verify evidence: ${response.statusText}`);
  }

  const data = await response.json();
  return data.is_valid;
}

/**
 * Get complete chain of custody for evidence
 */
export async function getChainOfCustody(
  evidenceId: string,
  evidenceType: EvidenceType
): Promise<AuditLog[]> {
  const response = await fetch(
    `/api/audit/chain-of-custody?evidence_id=${evidenceId}&evidence_type=${evidenceType}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error(`Failed to get chain of custody: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Record audit log entry
 */
export interface CreateAuditLogParams {
  actionType: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<string> {
  const response = await fetch('/api/audit/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId,
      user_id: params.userId,
      changes: params.changes,
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create audit log: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Track data lineage for calculations
 */
export interface TrackDataLineageParams {
  entityType: string;
  entityId: string;
  sourceType: string;
  sourceId?: string;
  sourceDescription?: string;
  transformationSteps?: Record<string, any>[];
  ownershipPercent?: number;
}

export async function trackDataLineage(params: TrackDataLineageParams): Promise<string> {
  const response = await fetch('/api/audit/data-lineage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entity_type: params.entityType,
      entity_id: params.entityId,
      source_type: params.sourceType,
      source_id: params.sourceId,
      source_description: params.sourceDescription,
      transformation_steps: params.transformationSteps,
      ownership_percent: params.ownershipPercent,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to track data lineage: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Format hash for display (first 8 and last 8 characters)
 */
export function formatHashForDisplay(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Generate audit trail summary for PDF footer
 */
export function generateAuditTrailSummary(params: {
  dataSources: Array<{ type: string; date: string }>;
  generatedAt: string;
  evidenceHash?: string;
}): string {
  const lines: string[] = [];

  lines.push(`Generated on: ${params.generatedAt}`);

  if (params.dataSources.length > 0) {
    lines.push('Data sources:');
    params.dataSources.forEach(source => {
      lines.push(`  • ${source.type} (${source.date})`);
    });
  }

  if (params.evidenceHash) {
    lines.push(`Cryptographic hash: ${formatHashForDisplay(params.evidenceHash)}`);
  }

  lines.push('This report is admissible in Malaysian trade remedy proceedings');

  return lines.join('\n');
}


