// Standalone script to generate INSERT statements for all documents in Supabase Storage
// Run with: deno run --allow-net --allow-env generate-document-inserts.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get these from your Supabase Dashboard → Settings → API
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || prompt('Enter Supabase URL:');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || prompt('Enter Service Role Key:');

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

const DOCUMENTS_BUCKET = 'make-9a1ba23f-documents';

// Category detection helper
function detectCategory(filename: string): string {
  const name = filename.toLowerCase();

  if (name.includes('bylaw') || name.includes('by-law') || name.includes('constitution') || name.includes('governance') || name.includes('charter')) {
    return 'governance';
  }
  if (name.includes('rule') || name.includes('regulation') || name.includes('penalty') || name.includes('playing') || name.includes('suspension') || name.includes('infraction')) {
    return 'rules-regulations';
  }
  if (name.includes('referee') || name.includes('official') || name.includes('officiating') || name.includes('cra') || name.includes('game sheet') || name.includes('arbiter') || name.includes('whistle')) {
    return 'officiating';
  }
  if (name.includes('form') || name.includes('application') || name.includes('template') || name.includes('waiver') || name.includes('intent') || name.includes('registration') || name.includes('ramp') || name.includes('signup')) {
    return 'forms';
  }
  if (name.includes('insurance') || name.includes('certificate') || name.includes('cgl') || name.includes('liability') || name.includes('proof')) {
    return 'insurance';
  }
  if (name.includes('minute') || name.includes('meeting') || name.includes('agm') || name.includes('agenda') || name.includes('board') || name.includes('motion')) {
    return 'meetings';
  }
  if (name.includes('budget') || name.includes('financial') || name.includes('treasurer') || name.includes('audit') || name.includes('fee') || name.includes('invoice') || name.includes('revenue') || name.includes('compiled financial')) {
    return 'financial';
  }
  if (name.includes('schedule') || name.includes('calendar') || name.includes('fixture') || name.includes('date')) {
    return 'schedules';
  }
  if (name.includes('roster') || name.includes('lineup') || name.includes('squad') || name.includes('protected') || name.includes('draft') || name.includes('keeper')) {
    return 'rosters';
  }
  if (name.includes('trade') || name.includes('transaction') || name.includes('acquisition') || name.includes('release') || name.includes('signing') || name.includes('call-up')) {
    return 'transactions';
  }
  if (name.includes('stat') || name.includes('report') || name.includes('scoring') || name.includes('data')) {
    return 'statistics';
  }
  if (name.includes('newsletter') || name.includes('announcement') || name.includes('bulletin') || name.includes('memo') || name.includes('notice') || name.includes('communication')) {
    return 'communications';
  }
  if (name.includes('history') || name.includes('historical') || name.includes('archive') || name.includes('championship') || name.includes('hall of fame') || name.includes('champion') || name.includes('trophy')) {
    return 'historical';
  }

  return 'other';
}

// Extract year from filename
function extractYear(filename: string): number | null {
  const match = filename.match(/\b(20\d{2}|202[0-9])(?=\D|$)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// Get file type from extension
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Clean filename for display (remove timestamp prefix)
function cleanFilename(filename: string): string {
  // Remove timestamp-random prefix (e.g., "1234567890-abc123.pdf" -> "abc123.pdf")
  return filename.replace(/^\d{13}-[a-z0-9]+\./, '').replace(/^\d{13}-[a-z0-9]+-/, '');
}

// Generate title from filename
function generateTitle(filename: string): string {
  const cleaned = cleanFilename(filename);
  // Remove file extension and convert to title case
  return cleaned
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

// Recursively list all files in a folder
async function listAllFiles(folder: string = ''): Promise<any[]> {
  console.log(`Listing files in folder: ${folder || '(root)'}`);

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .list(folder, {
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.error('Error listing files:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const files: any[] = [];

  for (const item of data) {
    if (!item.metadata) {
      // This is a folder, recurse
      const subFiles = await listAllFiles(item.name);
      files.push(...subFiles);
    } else {
      // This is a file
      files.push(item);
    }
  }

  return files;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Document Migration SQL Generator');
  console.log('='.repeat(60));
  console.log();

  // List all files in the bucket
  console.log('Fetching all files from storage...');
  const allFiles = await listAllFiles();

  console.log(`Found ${allFiles.length} files`);
  console.log();

  if (allFiles.length === 0) {
    console.log('No files found in storage bucket.');
    return;
  }

  // Get existing documents to check for duplicates
  console.log('Fetching existing documents from database...');
  const { data: existingDocs, error: docsError } = await supabase
    .from('documents')
    .select('file_url');

  if (docsError) {
    console.error('Error fetching existing documents:', docsError);
    return;
  }

  const existingUrls = new Set(existingDocs?.map(d => d.file_url) || []);
  console.log(`Found ${existingUrls.size} existing documents`);
  console.log();

  // Generate INSERT statements
  console.log('Generating INSERT statements...');
  console.log();

  let count = 0;
  const statements: string[] = [];

  for (const file of allFiles) {
    try {
      const { data: urlData } = supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(file.name);

      const fileUrl = urlData.publicUrl;

      // Skip if already exists
      if (existingUrls.has(fileUrl)) {
        console.log(`  Skipping (already exists): ${file.name}`);
        continue;
      }

      const category = detectCategory(file.name);
      const year = extractYear(file.name);
      const fileType = getFileType(file.name);
      const title = generateTitle(file.name).replace(/'/g, "''"); // Escape single quotes
      const cleanName = cleanFilename(file.name).replace(/'/g, "''");
      const fileSize = (file as any).metadata?.size || 0;

      // Build INSERT statement
      const stmt = `INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES (
  '${title}',
  '',
  '${fileUrl}',
  '${cleanName}',
  ${fileSize},
  '${fileType}',
  '${category}',
  NULL,
  ${year || 'NULL'},
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;`;

      statements.push(stmt);
      count++;
      console.log(`  [${count}] ${file.name} -> ${category}`);

    } catch (error: any) {
      console.error(`  Error processing ${file.name}:`, error.message);
    }
  }

  console.log();
  console.log('='.repeat(60));
  console.log(`Generated ${count} INSERT statements`);
  console.log('='.repeat(60));
  console.log();

  // Output the SQL
  const sqlOutput = `-- Document Migration SQL
-- Generated on ${new Date().toISOString()}
-- Total documents: ${count}

${statements.join('\n\n')}

-- Summary query
SELECT COUNT(*) as total_documents FROM documents;
`;

  // Write to file
  await Deno.writeTextFile('./document-migration-inserts.sql', sqlOutput);
  console.log('SQL written to: document-migration-inserts.sql');
  console.log();
  console.log('Copy and paste the contents of document-migration-inserts.sql into Supabase SQL Editor');
}

main().catch(console.error);