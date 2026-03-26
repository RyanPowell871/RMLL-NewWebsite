// Document Migration Script
// This script migrates documents from Supabase Storage to the documents database table
// Files in storage that don't have a corresponding database record will be added

import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const DOCUMENTS_BUCKET = db.DOCUMENTS_BUCKET;

// Category detection helper
function detectCategory(filename: string): string {
  const name = filename.toLowerCase();

  if (name.includes('bylaw') || name.includes('by-law') || name.includes('constitution') || name.includes('governance') || name.includes('charter')) {
    return 'governance';
  }
  if (name.includes('rule') || name.includes('regulation') || name.includes('penalty') || name.includes('playing')) {
    return 'rules-regulations';
  }
  if (name.includes('referee') || name.includes('official') || name.includes('officiating') || name.includes('cra') || name.includes('game sheet') || name.includes('arbiter')) {
    return 'officiating';
  }
  if (name.includes('form') || name.includes('application') || name.includes('template') || name.includes('waiver') || name.includes('intent') || name.includes('registration')) {
    return 'forms';
  }
  if (name.includes('insurance') || name.includes('certificate') || name.includes('cgl') || name.includes('liability')) {
    return 'insurance';
  }
  if (name.includes('minute') || name.includes('meeting') || name.includes('agm') || name.includes('agenda')) {
    return 'meetings';
  }
  if (name.includes('budget') || name.includes('financial') || name.includes('treasurer') || name.includes('audit') || name.includes('fee')) {
    return 'financial';
  }
  if (name.includes('schedule') || name.includes('calendar') || name.includes('fixture')) {
    return 'schedules';
  }
  if (name.includes('roster') || name.includes('lineup') || name.includes('squad') || name.includes('protected')) {
    return 'rosters';
  }
  if (name.includes('trade') || name.includes('transaction') || name.includes('acquisition') || name.includes('release')) {
    return 'transactions';
  }
  if (name.includes('stat') || name.includes('report') || name.includes('scoring')) {
    return 'statistics';
  }
  if (name.includes('newsletter') || name.includes('announcement') || name.includes('bulletin') || name.includes('memo')) {
    return 'communications';
  }
  if (name.includes('history') || name.includes('historical') || name.includes('archive') || name.includes('championship') || name.includes('hall of fame')) {
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
  // Remove timestamp prefix only (e.g., "1765435235118-plm04k9l7d.pdf" -> "plm04k9l7d.pdf")
  let cleaned = filename.replace(/^\d{13}-/, '');

  // If cleaning resulted in empty string, return original filename
  if (!cleaned || cleaned.trim() === '') {
    return filename;
  }

  return cleaned;
}

// Generate title from filename
function generateTitle(filename: string): string {
  const cleaned = cleanFilename(filename);
  // Remove file extension and convert to title case
  const withoutExt = cleaned.replace(/\.[^/.]+$/, '');
  const title = withoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();

  // If title is empty, use original filename
  return title || filename;
}

/**
 * Recursively list all files in a bucket, including subdirectories
 */
async function listAllFilesRecursively(bucket: string, path: string = '', files: any[] = []): Promise<any[]> {
  try {
    const { data: items, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`[Migration] Error listing ${path}:`, error);
      return files;
    }

    if (!items || items.length === 0) {
      return files;
    }

    for (const item of items) {
      // Skip empty folder placeholders and empty names
      if (item.name === '' || item.name === '.emptyFolderPlaceholder') {
        continue;
      }

      // Check if this is a folder (id is undefined for folders in Supabase Storage)
      if (!item.id) {
        // Recursively list files in subdirectory
        const subPath = path ? `${path}/${item.name}` : item.name;
        await listAllFilesRecursively(bucket, subPath, files);
      } else {
        // This is a file - add to list
        // For subdirectory files, the name returned by list() already includes the full path
        files.push(item);
      }
    }

    return files;
  } catch (error) {
    console.error(`[Migration] Error in listAllFilesRecursively for path ${path}:`, error);
    return files;
  }
}

export async function migrateDocumentsFromStorage() {
  console.log('[Migration] Starting document migration from storage to database...');
  console.log('[Migration] Bucket name:', DOCUMENTS_BUCKET);

  // Check if Supabase client is configured
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[Migration] Missing required environment variables');
    console.error('[Migration] SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('[Migration] SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Set' : 'Missing');
    return { success: false, error: 'Missing required environment variables' };
  }

  try {
    // Test connection by trying to list buckets
    console.log('[Migration] Testing Supabase connection...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('[Migration] Error listing buckets:', bucketsError);
      return { success: false, error: `Storage error: ${bucketsError.message}` };
    }

    console.log('[Migration] Available buckets:', buckets?.map(b => b.name).join(', ') || 'none');

    // Check if our bucket exists
    const bucketExists = buckets?.some(b => b.name === DOCUMENTS_BUCKET);
    console.log('[Migration] Target bucket exists:', bucketExists);

    if (!bucketExists) {
      console.error('[Migration] Bucket not found:', DOCUMENTS_BUCKET);
      return { success: false, error: `Storage bucket '${DOCUMENTS_BUCKET}' not found. Available buckets: ${buckets?.map(b => b.name).join(', ')}` };
    }

    // Recursively list all files in the documents bucket
    console.log('[Migration] Scanning storage bucket for files (including subdirectories)...');
    const files = await listAllFilesRecursively(DOCUMENTS_BUCKET);

    if (files.length === 0) {
      console.log('[Migration] No files found in storage bucket');
      return { success: true, message: 'No files found in storage', migrated: 0, skipped: 0 };
    }

    console.log('[Migration] Files found:', files.length);
    console.log('[Migration] File sample:', files.slice(0, 3).map(f => f.name));

    // Get all existing documents from database
    const existingDocs = await db.getDocuments();
    const existingUrls = new Set(existingDocs.map(doc => doc.file_url));

    let migratedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    console.log(`[Migration] Found ${files.length} files in storage, ${existingDocs.length} existing database records`);

    for (const file of files) {
      try {
        // Debug: log file object structure
        console.log(`[Migration] File object:`, JSON.stringify({
          name: file.name,
          id: file.id,
          hasMetadata: !!file.metadata,
          metadataKeys: file.metadata ? Object.keys(file.metadata) : [],
        }));

        // Get public URL for the file
        const { data: urlData } = supabase.storage
          .from(DOCUMENTS_BUCKET)
          .getPublicUrl(file.name);

        const fileUrl = urlData.publicUrl;

        // Check if this file already exists in database
        if (existingUrls.has(fileUrl)) {
          skippedCount++;
          console.log(`[Migration] Skipped (already exists): ${file.name}`);
          continue;
        }

        const category = detectCategory(file.name);
        const year = extractYear(file.name);
        const fileType = getFileType(file.name);
        const title = generateTitle(file.name);
        const cleanName = cleanFilename(file.name);

        // Debug: log computed values
        console.log(`[Migration] Computed values:`, {
          file_name: file.name,
          cleanName,
          category,
          year,
          fileType,
          title,
          fileSize: (file as any).metadata?.size || (file as any).size || (file as any).metadata?.contentLength || 0
        });

        // Get file size - handle both metadata.size and direct size properties
        const fileSize = (file as any).metadata?.size ||
                        (file as any).size ||
                        (file as any).metadata?.contentLength ||
                        0;

        const documentData = {
          title,
          description: '',
          file_url: fileUrl,
          file_name: cleanName,
          file_size: fileSize,
          file_type: fileType,
          category: category as any, // Cast to allow any valid enum value
          subcategory: null,
          document_year: year,
          division_id: null,
          season_id: null,
          is_public: true,
        };

        console.log(`[Migration] Inserting document:`, JSON.stringify(documentData));

        // Create document record
        const document = await db.createDocument(documentData);

        console.log(`[Migration] Document returned from db.createDocument:`, JSON.stringify({
          id: document.id,
          title: document.title,
          file_name: document.file_name,
          category: document.category,
          subcategory: document.subcategory,
          file_url: document.file_url,
        }));

        if (!document || !document.id) {
          throw new Error('Document creation returned invalid result');
        }

        migratedCount++;
        console.log(`[Migration] Created document: ${title} (id: ${document.id}, category: ${category}, year: ${year}, file: ${file.name})`);

      } catch (fileError: any) {
        const errorMsg = `Error processing ${file.name}: ${fileError?.message || String(fileError)}`;
        console.error(`[Migration] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[Migration] Complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`);

    return {
      success: true,
      message: `Migration complete. Migrated ${migratedCount} documents, skipped ${skippedCount} existing.`,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      // Include first few file samples for debugging
      sampleFiles: files.slice(0, 3).map(f => ({
        name: f.name,
        id: f.id,
        hasMetadata: !!f.metadata,
        metadataSize: (f as any).metadata?.size || (f as any).size || null
      }))
    };

  } catch (error: any) {
    console.error('[Migration] Fatal error:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

// Run if executed directly
if (import.meta.main) {
  await migrateDocumentsFromStorage();
}