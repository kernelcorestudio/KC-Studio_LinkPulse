// Short-code generation: base62 nanoid with collision-safe retry.
import { customAlphabet } from 'nanoid';
import { queryOne } from '../db/index.js';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const SHORT_CODE_ALPHABET = BASE62;

// Length 6-8 per spec; start at 6 and widen if the table is very dense.
export function makeCodeGenerator(len = 6) {
  return customAlphabet(BASE62, len);
}

export function isValidCodeShape(code) {
  return typeof code === 'string' && /^[0-9a-zA-Z]{3,32}$/.test(code);
}

/**
 * Generate a unique short code, retrying on collision.
 * @param {number} len desired length (6-8)
 * @returns {Promise<string>} a code guaranteed (modulo a final INSERT unique-constraint
 *   race, which callers must catch) not present in `links`
 */
export async function generateUniqueCode(len = 6, maxAttempts = 8) {
  const gen = makeCodeGenerator(len);
  for (let i = 0; i < maxAttempts; i++) {
    const code = gen();
    const existing = await queryOne('SELECT id FROM links WHERE short_code = ?', [code]);
    if (!existing) return code;
  }
  // Astronomically unlikely for 6+ chars; widen the alphabet length instead of failing.
  if (len < 8) return generateUniqueCode(len + 1, maxAttempts);
  throw new Error('unable to generate a unique short code');
}
