// ================================================
// DOCUMENT MIGRATION SCRIPT - RUN IN SUPABASE DASHBOARD
// ================================================
//
// Instructions:
// 1. Open https://nkfbehspyjookipapdbp.supabase.co
// 2. Log in to the dashboard
// 3. Go to SQL Editor
// 4. Press F12 to open Browser Console
// 5. Paste this ENTIRE script and run it
//
// ================================================

(async function generateAllDocumentInserts() {
  const SUPABASE_URL = 'https://nkfbehspyjookipapdbp.supabase.co';
  const DOCUMENTS_BUCKET = 'make-9a1ba23f-documents';

  // Try to get auth token from various sources
  let AUTH_TOKEN = null;

  // Try localStorage first
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes('auth') || key.includes('token')) {
        const value = localStorage.getItem(key);
        try {
          const parsed = JSON.parse(value);
          if (parsed?.access_token) {
            AUTH_TOKEN = parsed.access_token;
            break;
          }
        } catch {
          // Try direct token value
          if (value && value.length > 50) {
            AUTH_TOKEN = value;
            break;
          }
        }
      }
    }
  } catch (e) {}

  // Try from window object
  if (!AUTH_TOKEN && window.supabase) {
    try {
      const { data } = await window.supabase.auth.getSession();
      AUTH_TOKEN = data?.session?.access_token;
    } catch (e) {}
  }

  if (!AUTH_TOKEN) {
    console.error('❌ Authentication required. Please make sure you are logged into Supabase Dashboard.');
    console.log('   If the script fails, please provide your service role key:');
    console.log('   AUTH_TOKEN = "your-service-role-key-here";');
    return;
  }

  console.log('✓ Authentication token found');
  console.log();

  // Category detection
  function detectCategory(filename) {
    const name = filename.toLowerCase();

    if (name.includes('bylaw') || name.includes('by-law') || name.includes('constitution') || name.includes('governance') || name.includes('charter')) return 'governance';
    if (name.includes('rule') || name.includes('regulation') || name.includes('penalty') || name.includes('playing') || name.includes('suspension')) return 'rules-regulations';
    if (name.includes('referee') || name.includes('official') || name.includes('officiating') || name.includes('cra') || name.includes('game sheet') || name.includes('arbiter')) return 'officiating';
    if (name.includes('form') || name.includes('application') || name.includes('template') || name.includes('waiver') || name.includes('intent') || name.includes('registration') || name.includes('ramp')) return 'forms';
    if (name.includes('insurance') || name.includes('certificate') || name.includes('cgl') || name.includes('liability')) return 'insurance';
    if (name.includes('minute') || name.includes('meeting') || name.includes('agm') || name.includes('agenda') || name.includes('board')) return 'meetings';
    if (name.includes('budget') || name.includes('financial') || name.includes('treasurer') || name.includes('audit') || name.includes('fee') || name.includes('invoice') || name.includes('compiled')) return 'financial';
    if (name.includes('schedule') || name.includes('calendar') || name.includes('fixture')) return 'schedules';
    if (name.includes('roster') || name.includes('lineup') || name.includes('squad') || name.includes('protected') || name.includes('draft')) return 'rosters';
    if (name.includes('trade') || name.includes('transaction') || name.includes('acquisition') || name.includes('release')) return 'transactions';
    if (name.includes('stat') || name.includes('report') || name.includes('scoring')) return 'statistics';
    if (name.includes('newsletter') || name.includes('announcement') || name.includes('bulletin') || name.includes('memo')) return 'communications';
    if (name.includes('history') || name.includes('historical') || name.includes('archive') || name.includes('championship') || name.includes('champion')) return 'historical';

    return 'other';
  }

  function extractYear(filename) {
    const match = filename.match(/\b(20\d{2}|202[0-9])(?=\D|$)/);
    return match ? parseInt(match[1]) : null;
  }

  function getFileType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const types = {
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
    };
    return types[ext] || 'application/pdf';
  }

  function cleanFilename(filename) {
    return filename.replace(/^\d{13}-[a-z0-9]+\./, '').replace(/^\d{13}-[a-z0-9]+-/, '');
  }

  function generateTitle(filename) {
    const cleaned = cleanFilename(filename);
    return cleaned
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  function escapeSql(str) {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  // List files recursively
  async function listFiles(path = '') {
    const url = `${SUPABASE_URL}/storage/v1/bucket/${DOCUMENTS_BUCKET}/list?prefix=${encodeURIComponent(path)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'apikey': AUTH_TOKEN,
      },
    });
    const data = await response.json();

    const files = [];
    for (const item of data || []) {
      if (item.name === '' || item.name === '.emptyFolderPlaceholder') continue;
      if (item.id) {
        // It's a file
        files.push(item);
      } else if (!item.id && !item.name.endsWith('/')) {
        // It's a folder
        const subFiles = await listFiles(item.name);
        files.push(...subFiles);
      }
    }
    return files;
  }

  // Get existing documents
  async function getExistingUrls() {
    const url = `${SUPABASE_URL}/rest/v1/documents?select=file_url`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'apikey': AUTH_TOKEN,
      },
    });
    const data = await response.json();
    return new Set(data?.map(d => d.file_url) || []);
  }

  console.log('📁 Fetching files from storage...');
  const allFiles = await listFiles();
  console.log(`✓ Found ${allFiles.length} files`);
  console.log();

  console.log('📋 Checking existing documents...');
  const existingUrls = await getExistingUrls();
  console.log(`✓ ${existingUrls.size} documents already exist`);
  console.log();

  console.log('🔧 Generating SQL...');
  console.log();

  let count = 0;
  let skipped = 0;
  const statements = [];

  for (const file of allFiles) {
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${DOCUMENTS_BUCKET}/${file.name}`;

    if (existingUrls.has(fileUrl)) {
      skipped++;
      console.log(`  ⊘ ${file.name}`);
      continue;
    }

    const title = escapeSql(generateTitle(file.name));
    const cleanName = escapeSql(cleanFilename(file.name));
    const category = detectCategory(file.name);
    const year = extractYear(file.name);
    const fileType = getFileType(file.name);
    const fileSize = file.metadata?.size || 0;

    const stmt = `INSERT INTO documents (title, description, file_url, file_name, file_size, file_type, category, subcategory, document_year, division_id, season_id, is_public)
VALUES ('${title}', '', '${fileUrl}', '${cleanName}', ${fileSize}, '${fileType}', '${category}', NULL, ${year || 'NULL'}, NULL, NULL, true)
ON CONFLICT DO NOTHING;`;

    statements.push(stmt);
    count++;
    console.log(`  [${count}] ${file.name} → ${category}`);
  }

  console.log();
  console.log('='.repeat(70));
  console.log(`✓ Generated ${count} new INSERT statements (${skipped} skipped)`);
  console.log('='.repeat(70));
  console.log();

  const sql = `-- Document Migration SQL
-- Generated: ${new Date().toISOString()}
-- Total new documents: ${count}
-- Skipped (already exist): ${skipped}

${statements.join('\n\n')}

-- Verify
SELECT COUNT(*) as total FROM documents;`;

  console.log('%c📋 SQL Generated Below (also copied to clipboard):', 'font-size:14px;font-weight:bold;color:green;');
  console.log();
  console.log(sql);

  // Copy to clipboard
  navigator.clipboard.writeText(sql).then(() => {
    console.log('%c✓ SQL copied to clipboard!', 'font-size:12px;font-weight:bold;color:green;');
  }).catch(() => {
    console.log('%cCould not auto-copy - select and copy manually', 'color:orange;');
  });

})();