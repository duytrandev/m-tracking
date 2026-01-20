import * as crypto from 'crypto';

/**
 * Slug utilities for URL-safe identifiers and reference generation
 * Provides functions to generate unique, readable identifiers
 */

/**
 * Generate a URL-safe unique identifier
 * Format: timestamp-random (e.g., "lm5n8p9-a1b2c3d4")
 * @param prefix - Optional prefix to add (e.g., "user", "txn")
 * @returns URL-safe unique slug
 */
export function generateSlug(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  const slug = `${timestamp}-${random}`;
  return prefix ? `${prefix}-${slug}` : slug;
}

/**
 * Convert text to kebab-case slug
 * Removes special characters, converts to lowercase, replaces spaces with hyphens
 * @param text - Input text
 * @returns Kebab-case slug
 */
export function toKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate transaction reference
 * Format: TXN-YYYYMMDD-XXXXX
 * @returns Unique transaction reference
 */
export function generateTransactionRef(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TXN-${date}-${random}`;
}

/**
 * Generate order reference
 * Format: ORD-YYYYMMDD-XXXXX
 * @returns Unique order reference
 */
export function generateOrderRef(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${date}-${random}`;
}

/**
 * Generate invoice reference
 * Format: INV-YYYYMMDD-XXXXX
 * @returns Unique invoice reference
 */
export function generateInvoiceRef(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${date}-${random}`;
}

/**
 * Generate short unique ID (8 characters)
 * Base64url encoded for URL safety
 * @returns Short unique ID
 */
export function generateShortId(): string {
  return crypto.randomBytes(6).toString('base64url');
}
