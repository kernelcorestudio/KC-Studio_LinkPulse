// CSV bulk import: server-side row validation + "import valid rows only".
// The client parses the CSV file (papaparse) and posts normalized rows:
//   [{ line, url, alias?, title? }]   `line` = 1-based line number for reports.
import { queryOne } from '../db/index.js';
import { validateAlias, validateDestinationUrl, isDomainBlocked } from '../utils/validation.js';
import { createLink } from './linkService.js';

/**
 * Validate rows without writing anything. Returns one result per row:
 * { line, url, alias, title, valid, errors: [..] }.
 * Also catches duplicates inside the batch itself and existing aliases.
 */
export async function validateImportRows(ownerId, rows) {
  const seenAlias = new Set();
  const seenUrl = new Set();
  const out = [];
  for (const raw of rows) {
    const errors = [];
    const line = Number(raw.line) || out.length + 1;
    const url = String(raw.url ?? raw.destinationUrl ?? '').trim();
    const alias = String(raw.alias ?? '').trim() || null;
    const title = String(raw.title ?? '').trim() || null;

    if (!url) {
      errors.push('Destination URL is required');
    } else {
      const u = validateDestinationUrl(url);
      if (!u.ok) errors.push(u.reason);
      else if (await isDomainBlocked(u.url)) errors.push('Domain is on the blocklist');
    }
    if (alias) {
      const a = validateAlias(alias);
      if (!a.ok) errors.push(a.reason);
      else if (seenAlias.has(alias)) errors.push('Duplicate alias inside the file');
      else {
        const clash = await queryOne('SELECT id FROM links WHERE short_code = ?', [alias]);
        if (clash) errors.push('Alias already taken');
      }
      seenAlias.add(alias);
    }
    if (url && seenUrl.has(url) && !alias) errors.push('Duplicate URL inside the file (no alias to distinguish)');
    seenUrl.add(url);

    out.push({ line, url, alias, title, valid: errors.length === 0, errors });
  }
  return out;
}

/** Import: runs createLink for every still-valid row; returns a full report. */
export async function runImport(ownerId, rows) {
  const validated = await validateImportRows(ownerId, rows);
  const imported = [];
  const failed = [];
  for (const v of validated) {
    if (!v.valid) {
      failed.push({ line: v.line, url: v.url, alias: v.alias, reason: v.errors.join('; ') });
      continue;
    }
    try {
      const link = await createLink(ownerId, {
        destinationUrl: v.url, alias: v.alias, title: v.title,
      });
      imported.push({ line: v.line, id: link.id, short_code: link.short_code, destination_url: link.destination_url, title: link.title });
    } catch (e) {
      const reason = e.details?.map((d) => d.message).join('; ') || e.message;
      failed.push({ line: v.line, url: v.url, alias: v.alias, reason });
    }
  }
  return { imported, failed, total: rows.length, importedCount: imported.length, failedCount: failed.length };
}
