// ================================================
// DOCUMENT MIGRATION SCRIPT - BROWSER CONSOLE
// ================================================
//
// Instructions:
// 1. Open Supabase Dashboard (https://supabase.com/dashboard)
// 2. Go to your project → SQL Editor
// 3. Open browser console (F12)
// 4. Paste this entire script and run it
// 5. It will generate all INSERT statements
//
// ================================================

(async function generateDocumentMigrationSQL() {
  console.log('='.repeat(60));
  console.log('Document Migration SQL Generator');
  console.log('='.repeat(60));
  console.log();

  // You can get these from Project Settings → API
  const SUPABASE_URL = window.location.origin;
  const SUPABASE_ANON_KEY = window?.supabase?.auth?.getSession?.()?.data?.session?.access_token ||
    localStorage.getItem('sb-qkvpzxvbgpwwqzcvnxtm-auth-token');

  if (!SUPABASE_ANON_KEY) {
    console.error('❌ Please open this script in Supabase Dashboard (SQL Editor)');
    console.error('   Or provide your API key below:');
    console.error('   const SUPABASE_ANON_KEY = "your-key-here";');
    return;
  }

  const DOCUMENTS_BUCKET = 'make-9a1ba23f-documents';

  // Category detection helper
  function detectCategory(filename) {
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
  function extractYear(filename) {
    const match = filename.match(/\b(20\d{2}|202[0-9])(?=\D|$)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  // Get file type from extension
  function getFileType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes = {
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
  function cleanFilename(filename) {
    return filename.replace(/^\d{13}-[a-z0-9]+\./, '').replace(/^\d{13}-[a-z0-9]+-/, '');
  }

  // Generate title from filename
  function generateTitle(filename) {
    const cleaned = cleanFilename(filename);
    return cleaned
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  // Helper to make API calls
  async function apiCall(path, options = {}) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
      ...options,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  // Recursively list all files in storage
  async function listAllFiles(folder = '') {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${DOCUMENTS_BUCKET}/list?${folder ? `prefix=${encodeURIComponent(folder)}&` : ''}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const data = await response.json();

    if (!data || data.length === 0) return [];

    const files = [];
    for (const item of data) {
      if (!item.metadata && item.name !== '' && item.name !== '.emptyFolderPlaceholder') {
        // This is a folder, recurse
        const subFiles = await listAllFiles(item.name);
        files.push(...subFiles);
      } else if (item.metadata) {
        // This is a file
        files.push(item);
      }
    }
    return files;
  }

  try {
    console.log('📁 Fetching all files from storage...');
    const allFiles = await listAllFiles();
    console.log(`✓ Found ${allFiles.length} files`);
    console.log();

    console.log('📋 Fetching existing documents from database...');
    const existingDocs = await apiCall('/documents?select=file_url');
    const existingUrls = new Set(existingDocs.map(d => d.file_url));
    console.log(`✓ Found ${existingUrls.size} existing documents`);
    console.log();

    console.log('🔧 Generating INSERT statements...');
    console.log();

    let count = 0;
    const statements = [];

    for (const file of allFiles) {
      try {
        const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${DOCUMENTS_BUCKET}/${encodeURIComponent(file.name)}`;

        // Skip if already exists
        if (existingUrls.has(fileUrl)) {
          console.log(`  ⊘ Skipping (already exists): ${file.name}`);
          continue;
        }

        const category = detectCategory(file.name);
        const year = extractYear(file.name);
        const fileType = getFileType(file.name);
        const title = generateTitle(file.name).replace(/'/g, "''");
        const cleanName = cleanFilename(file.name).replace(/'/g, "''");
        const fileSize = file.metadata?.size || 0;

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
        console.log(`  [${count}] ${file.name} → ${category}`);

      } catch (error) {
        console.error(`  ✗ Error processing ${file.name}:`, error.message);
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log(`✓ Generated ${count} INSERT statements`);
    console.log('='.repeat(60));
    console.log();

    const sqlOutput = `-- Document Migration SQL
-- Generated on ${new Date().toISOString()}
-- Total documents: ${count}

${statements.join('\n\n')}

-- Summary query
SELECT COUNT(*) as total_documents FROM documents;
`;

    console.log('%c📋 SQL generated! Copy the output below:', 'color: green; font-weight: bold; font-size: 14px;');
    console.log();
    console.log(sqlOutput);

    // Copy to clipboard
    navigator.clipboard.writeText(sqlOutput).then(() => {
      console.log('%c✓ SQL copied to clipboard!', 'color: green; font-weight: bold;');
    }).catch(() => {
      console.log('%c⚠ Could not copy to clipboard automatically', 'color: orange;');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

})();