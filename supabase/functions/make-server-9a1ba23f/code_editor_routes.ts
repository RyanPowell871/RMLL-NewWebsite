/**
 * Code Editor Routes - Direct code editing with Git integration
 *
 * Provides API endpoints for:
 * - Listing and reading files in src/components/league-info/
 * - Writing file contents with validation
 * - Git operations: commit, history, diff, rollback, push
 *
 * Uses GitHub API for file operations instead of local filesystem.
 */

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.ts";

const app = new Hono();

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Constants
const GITHUB_REPO = 'RyanPowell871/RMLL-NewWebsite';
const GITHUB_API_URL = 'https://api.github.com';

// ============================================
// GitHub API Helper Functions
// ============================================

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
}

async function getGitHubToken(): Promise<string> {
  const token = Deno.env.get('GITHUB_TOKEN');
  if (!token) {
    throw new Error('GitHub token not configured');
  }
  return token;
}

async function githubRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getGitHubToken();
  const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * List files in a GitHub directory
 */
async function listGitHubFiles(path: string): Promise<GitHubFile[]> {
  try {
    const files = await githubRequest<any[]>(`/repos/${GITHUB_REPO}/contents/${path}`);
    return files.map((f: any) => ({
      name: f.name,
      path: f.path,
      type: f.type,
      size: f.size,
    }));
  } catch (error) {
    console.error('Error listing GitHub files for path:', path, error);
    throw error;
  }
}

/**
 * Recursively scan directory for all editable files
 */
async function scanDirectoryForFiles(basePath: string): Promise<GitHubFile[]> {
  const files: GitHubFile[] = [];

  async function scan(path: string) {
    try {
      const contents = await listGitHubFiles(path);

      for (const item of contents) {
        // Skip hidden files and certain directories
        if (item.name.startsWith('.') || item.name === 'node_modules') {
          continue;
        }

        if (item.type === 'dir') {
          await scan(item.path);
        } else if (item.type === 'file') {
          const ext = item.name.slice(item.name.lastIndexOf('.'));
          if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
            files.push(item);
          }
        }
      }
    } catch (error) {
      console.error('Error scanning directory:', path, error);
    }
  }

  await scan(basePath);
  return files;
}

/**
 * Get file content from GitHub
 */
async function getGitHubFile(path: string): Promise<{ content: string; sha: string }> {
  const result = await githubRequest<any>(`/repos/${GITHUB_REPO}/contents/${path}`);
  // Content is base64 encoded
  const content = atob(result.content);
  return { content, sha: result.sha };
}

/**
 * Write file content to GitHub (creates a commit)
 */
async function writeGitHubFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<{ sha: string }> {
  const token = await getGitHubToken();
  const contentEncoded = btoa(content);

  const body: any = {
    message,
    content: contentEncoded,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  const result = await response.json();
  return { sha: result.content.sha };
}

/**
 * Get commit history for a file
 */
async function getGitHubFileHistory(path: string, limit = 20): Promise<Commit[]> {
  const result = await githubRequest<any[]>(`/repos/${GITHUB_REPO}/commits?path=${encodeURIComponent(path)}&per_page=${limit}`);

  return result.map((commit: any) => ({
    hash: commit.sha,
    author: commit.author?.login || commit.commit.author.name,
    email: commit.commit.author.email,
    date: commit.commit.author.date,
    message: commit.commit.message,
  }));
}

/**
 * Get diff between two commits for a file
 */
async function getGitHubDiff(path: string, fromHash: string, toHash = 'HEAD'): Promise<string> {
  // Get the file content at the from commit
  const fromFile = await githubRequest<any>(`/repos/${GITHUB_REPO}/contents/${path}?ref=${fromHash}`);

  // Get current file content
  const toFile = await githubRequest<any>(`/repos/${GITHUB_REPO}/contents/${path}`);

  // Decode both contents
  const fromContent = fromFile.content ? atob(fromFile.content) : '';
  const toContent = toFile.content ? atob(toFile.content) : '';

  // Generate a simple diff
  const diff = generateSimpleDiff(fromContent, toContent);
  return diff;
}

/**
 * Generate a simple unified diff
 */
function generateSimpleDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  let diff = `--- a/file\n+++ b/file\n`;
  diff += `@@ -1,${oldLines.length} +1,${newLines.length} @@\n`;

  // Simple line-by-line comparison
  for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      diff += ` ${oldLine}\n`;
    } else {
      if (oldLine !== undefined) {
        diff += `-${oldLine}\n`;
      }
      if (newLine !== undefined) {
        diff += `+${newLine}\n`;
      }
    }
  }

  return diff;
}

/**
 * Rollback a file to a specific commit
 */
async function rollbackGitHubFile(path: string, commitHash: string): Promise<void> {
  // Get the file content at the specified commit
  const result = await githubRequest<any>(`/repos/${GITHUB_REPO}/contents/${path}?ref=${commitHash}`);
  const content = result.content ? atob(result.content) : '';

  // Get current SHA for updating
  const currentResult = await githubRequest<any>(`/repos/${GITHUB_REPO}/contents/${path}`);

  // Write the old content with a new commit
  await writeGitHubFile(
    path,
    content,
    `Rollback ${path} to ${commitHash.slice(0, 7)}`,
    currentResult.sha
  );
}

export interface Commit {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

// ============================================
// TypeScript Syntax Validation
// ============================================

async function validateTypeScriptCode(code: string, filePath: string): Promise<{ valid: boolean; errors?: string[] }> {
  // Basic syntax check
  try {
    const issues: string[] = [];

    // Check for unmatched brackets
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unmatched parentheses: ${openParens} opening, ${closeParens} closing`);
    }

    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push(`Unmatched brackets: ${openBrackets} opening, ${closeBrackets} closing`);
    }

    // Check for unterminated strings
    const singleQuoteCount = (code.match(/'/g) || []).length;
    const doubleQuoteCount = (code.match(/"/g) || []).length;
    if (singleQuoteCount % 2 !== 0) {
      issues.push('Possible unterminated single-quoted string');
    }
    if (doubleQuoteCount % 2 !== 0) {
      issues.push('Possible unterminated double-quoted string');
    }

    return issues.length > 0 ? { valid: false, errors: issues } : { valid: true };
  } catch (e) {
    return { valid: true }; // Allow on validation errors
  }
}

// ============================================
// File Path Validation
// ============================================

function validateFilePath(filePath: string): { valid: boolean; error?: string } {
  // URL decode the path (Hono should do this but let's be safe)
  const decodedPath = decodeURIComponent(filePath);

  // Remove leading slashes and any ../ attempts
  const cleanPath = decodedPath.replace(/^\/+/, '').replace(/\.\.+/g, '');

  // Check if path is within src/components/league-info/
  if (!cleanPath.startsWith('src/components/league-info/')) {
    return {
      valid: false,
      error: 'File must be within src/components/league-info/',
    };
  }

  // Check file extension
  if (!cleanPath.endsWith('.tsx') && !cleanPath.endsWith('.ts') && !cleanPath.endsWith('.jsx') && !cleanPath.endsWith('.js')) {
    return {
      valid: false,
      error: 'Only TypeScript/JavaScript files are editable (.ts, .tsx, .js, .jsx)',
    };
  }

  return { valid: true };
}

// ============================================
// Authentication Middleware
// ============================================

async function verifyAuthUser(authHeader: string | null): Promise<{ authorized: boolean; userId?: string; role?: string; user?: any; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'No authorization token provided' };
  }

  const token = authHeader.substring(7);

  // Get user from token
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    return { authorized: false, error: 'Invalid token' };
  }

  // Get user role from database
  const userProfile = await db.getUserById(user.id);

  if (!userProfile) {
    return { authorized: false, error: 'User profile not found' };
  }

  if (!['admin', 'editor'].includes(userProfile.role)) {
    return { authorized: false, error: 'Access denied: Admin or Editor role required' };
  }

  return { authorized: true, userId: user.id, role: userProfile.role, user };
}

app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const { authorized, error } = await verifyAuthUser(authHeader);

  if (!authorized) {
    return c.json({ success: false, error: error || 'Unauthorized' }, 401);
  }

  await next();
});

// ============================================
// Routes
// ============================================

/**
 * GET /code-editor/files
 * List all editable files in src/components/league-info/
 */
app.get('/code-editor/files', async (c) => {
  console.log('[CodeEditor] Listing files in src/components/league-info');

  // Fallback list of known league-info files
  const fallbackFiles = [
    { name: 'AffiliateLinksPage.tsx', path: 'src/components/league-info/AffiliateLinksPage.tsx', type: 'file' },
    { name: 'AwardsPage.tsx', path: 'src/components/league-info/AwardsPage.tsx', type: 'file' },
    { name: 'BadStandingPage.tsx', path: 'src/components/league-info/BadStandingPage.tsx', type: 'file' },
    { name: 'BrandGuidelinesPage.tsx', path: 'src/components/league-info/BrandGuidelinesPage.tsx', type: 'file' },
    { name: 'BylawsPage.tsx', path: 'src/components/league-info/BylawsPage.tsx', type: 'file' },
    { name: 'CodeOfConductPage.tsx', path: 'src/components/league-info/CodeOfConductPage.tsx', type: 'file' },
    { name: 'CoachingRequirementsPage.tsx', path: 'src/components/league-info/CoachingRequirementsPage.tsx', type: 'file' },
    { name: 'CombinesPage.tsx', path: 'src/components/league-info/CombinesPage.tsx', type: 'file' },
    { name: 'ContentBlockRenderer.tsx', path: 'src/components/league-info/ContentBlockRenderer.tsx', type: 'file' },
    { name: 'FacilitiesPage.tsx', path: 'src/components/league-info/FacilitiesPage.tsx', type: 'file' },
    { name: 'GraduatingU17InfoPage.tsx', path: 'src/components/league-info/GraduatingU17InfoPage.tsx', type: 'file' },
    { name: 'HistoryPage.tsx', path: 'src/components/league-info/HistoryPage.tsx', type: 'file' },
    { name: 'JrBTier1DivisionAwards.tsx', path: 'src/components/league-info/JrBTier1DivisionAwards.tsx', type: 'file' },
    { name: 'LCALAInfoPage.tsx', path: 'src/components/league-info/LCALAInfoPage.tsx', type: 'file' },
    { name: 'MissionStatementPage.tsx', path: 'src/components/league-info/MissionStatementPage.tsx', type: 'file' },
    { name: 'NewPlayerInfoFemalePage.tsx', path: 'src/components/league-info/NewPlayerInfoFemalePage.tsx', type: 'file' },
    { name: 'NewPlayerInfoPage.tsx', path: 'src/components/league-info/NewPlayerInfoPage.tsx', type: 'file' },
    { name: 'OfficiatingApplicationFormPage.tsx', path: 'src/components/league-info/OfficiatingApplicationFormPage.tsx', type: 'file' },
    { name: 'OfficiatingFloorEquipmentPage.tsx', path: 'src/components/league-info/OfficiatingFloorEquipmentPage.tsx', type: 'file' },
    { name: 'OfficiatingOffFloorOfficialsPage.tsx', path: 'src/components/league-info/OfficiatingOffFloorOfficialsPage.tsx', type: 'file' },
    { name: 'OfficiatingRuleInterpretationsPage.tsx', path: 'src/components/league-info/OfficiatingRuleInterpretationsPage.tsx', type: 'file' },
    { name: 'OfficiatingRulebookPage.tsx', path: 'src/components/league-info/OfficiatingRulebookPage.tsx', type: 'file' },
    { name: 'PlanningMeetingAGMPage.tsx', path: 'src/components/league-info/PlanningMeetingAGMPage.tsx', type: 'file' },
    { name: 'PointLeaderAwards.tsx', path: 'src/components/league-info/PointLeaderAwards.tsx', type: 'file' },
    { name: 'PrivacyPolicyPage.tsx', path: 'src/components/league-info/PrivacyPolicyPage.tsx', type: 'file' },
    { name: 'RMLLExecutivePage.tsx', path: 'src/components/league-info/RMLLExecutivePage.tsx', type: 'file' },
    { name: 'RecordBooksPage.tsx', path: 'src/components/league-info/RecordBooksPage.tsx', type: 'file' },
    { name: 'RegulationsPage.tsx', path: 'src/components/league-info/RegulationsPage.tsx', type: 'file' },
    { name: 'RegistrationPage.tsx', path: 'src/components/league-info/RegistrationPage.tsx', type: 'file' },
    { name: 'RulesOfPlayPage.tsx', path: 'src/components/league-info/RulesOfPlayPage.tsx', type: 'file' },
    { name: 'SuperCoachingClinicPage.tsx', path: 'src/components/league-info/SuperCoachingClinicPage.tsx', type: 'file' },
    { name: 'SuspensionsPage.tsx', path: 'src/components/league-info/SuspensionsPage.tsx', type: 'file' },
    { name: 'suspensions-data.ts', path: 'src/components/league-info/suspensions-data.ts', type: 'file' },
  ];

  try {
    // Try to fetch from GitHub API first
    const token = Deno.env.get('GITHUB_TOKEN');
    if (!token) {
      console.log('[CodeEditor] GitHub token not configured, using fallback');
      return c.json({
        success: true,
        data: { files: fallbackFiles },
      });
    }

    const files = await scanDirectoryForFiles('src/components/league-info');
    console.log('[CodeEditor] Found', files.length, 'files from GitHub API');

    if (files.length === 0) {
      console.log('[CodeEditor] No files from GitHub, using fallback');
      return c.json({
        success: true,
        data: { files: fallbackFiles },
      });
    }

    return c.json({
      success: true,
      data: { files },
    });
  } catch (error) {
    console.error('[CodeEditor] Error listing files, using fallback:', error);
    return c.json({
      success: true,
      data: { files: fallbackFiles },
    });
  }
});

/**
 * GET /code-editor/file?path=xxx
 * Read file contents
 */
app.get('/code-editor/file', async (c) => {
  const filePath = c.req.query('path') || '';

  try {
    const validation = validateFilePath(filePath);

    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    const { content, sha } = await getGitHubFile(filePath);

    return c.json({
      success: true,
      data: {
        content,
        path: filePath,
        sha,
      },
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file',
    }, 500);
  }
});

/**
 * POST /code-editor/file
 * Write file contents with validation
 */
app.post('/code-editor/file', async (c) => {
  try {
    const filePath = c.req.query('path') || '';
    const validation = validateFilePath(filePath);

    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    const { content, sha } = await c.req.json();

    if (typeof content !== 'string') {
      return c.json({ success: false, error: 'Content must be a string' }, 400);
    }

    // Validate TypeScript syntax
    const validation2 = await validateTypeScriptCode(content, filePath);
    if (!validation2.valid) {
      return c.json({
        success: false,
        error: 'TypeScript syntax validation failed',
        errors: validation2.errors,
      }, 400);
    }

    // Get current SHA if not provided (GitHub requires it for existing files)
    let fileSha = sha;
    if (!fileSha) {
      try {
        const currentFile = await githubRequest<any>(`/repos/${GITHUB_REPO}/contents/${filePath}`);
        fileSha = currentFile.sha;
      } catch {
        // File doesn't exist yet, sha is not required
      }
    }

    // Write to GitHub
    const result = await writeGitHubFile(
      filePath,
      content,
      'Draft changes via Code Editor',
      fileSha
    );

    return c.json({
      success: true,
      data: {
        path: filePath,
        sha: result.sha,
        message: 'File written successfully',
      },
    });
  } catch (error) {
    console.error('Error writing file:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to write file',
    }, 500);
  }
});

/**
 * POST /code-editor/commit
 * Commit changes to git (via GitHub API)
 */
app.post('/code-editor/commit', async (c) => {
  try {
    const { filePaths, message } = await c.req.json();

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return c.json({ success: false, error: 'No files specified' }, 400);
    }

    if (!message || typeof message !== 'string') {
      return c.json({ success: false, error: 'Commit message is required' }, 400);
    }

    // Get current SHA for each file and commit
    const results = [];
    for (const filePath of filePaths) {
      const validation = validateFilePath(filePath);
      if (!validation.valid) {
        return c.json({ success: false, error: validation.error }, 400);
      }

      try {
        // Get current file content and SHA
        const { content, sha } = await getGitHubFile(filePath);

        // Write with commit message
        const result = await writeGitHubFile(filePath, content, message, sha);
        results.push({ path: filePath, sha: result.sha });
      } catch (error) {
        // If file doesn't exist, just skip it
        console.error('Error committing file:', filePath, error);
      }
    }

    return c.json({
      success: true,
      data: {
        commits: results,
        message,
      },
    });
  } catch (error) {
    console.error('Error committing:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to commit',
    }, 500);
  }
});

/**
 * GET /code-editor/history
 * Get commit history for a file
 */
app.get('/code-editor/history', async (c) => {
  try {
    const filePath = c.req.query('file') || '';
    const validation = validateFilePath(filePath);

    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const commits = await getGitHubFileHistory(filePath, limit);

    return c.json({
      success: true,
      data: { commits },
    });
  } catch (error) {
    console.error('Error getting history:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history',
    }, 500);
  }
});

/**
 * GET /code-editor/diff
 * Get diff between commits
 * Query params: file (path), from (commit hash), to (commit hash, defaults to HEAD)
 */
app.get('/code-editor/diff', async (c) => {
  try {
    const filePath = c.req.query('file') || '';
    const validation = validateFilePath(filePath);

    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    const fromCommit = c.req.query('from');
    const toCommit = c.req.query('to') || 'HEAD';

    if (!fromCommit) {
      return c.json({ success: false, error: 'from commit hash is required' }, 400);
    }

    const diff = await getGitHubDiff(filePath, fromCommit);

    return c.json({
      success: true,
      data: {
        diff,
        from: fromCommit,
        to: toCommit,
        file: filePath,
      },
    });
  } catch (error) {
    console.error('Error getting diff:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get diff',
    }, 500);
  }
});

/**
 * POST /code-editor/rollback
 * Rollback file to specific commit
 */
app.post('/code-editor/rollback', async (c) => {
  try {
    const { filePath, commitHash } = await c.req.json();

    if (!filePath) {
      return c.json({ success: false, error: 'filePath is required' }, 400);
    }

    if (!commitHash) {
      return c.json({ success: false, error: 'commitHash is required' }, 400);
    }

    const validation = validateFilePath(filePath);
    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    await rollbackGitHubFile(filePath, commitHash);

    return c.json({
      success: true,
      data: {
        filePath,
        commitHash,
        message: 'File rolled back successfully',
      },
    });
  } catch (error) {
    console.error('Error rolling back:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rollback',
    }, 500);
  }
});

/**
 * POST /code-editor/push
 * Push commits to remote (no-op with GitHub API since commits are pushed immediately)
 */
app.post('/code-editor/push', async (c) => {
  try {
    // With GitHub API, files are pushed immediately
    // Vercel auto-deploys on GitHub push
    return c.json({
      success: true,
      data: {
        message: 'Changes already pushed to GitHub. Vercel deployment will begin shortly.',
        pushed: true,
      },
    });
  } catch (error) {
    console.error('Error pushing:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to push',
    }, 500);
  }
});

/**
 * GET /code-editor/status
 * Get status (placeholder for compatibility)
 */
app.get('/code-editor/status', async (c) => {
  return c.json({
    success: true,
    data: {
      modified: [],
      staged: [],
    },
  });
});

/**
 * POST /code-editor/discard
 * Discard uncommitted changes (placeholder for compatibility)
 */
app.post('/code-editor/discard', async (c) => {
  const { filePath } = await c.req.json();

  if (!filePath) {
    return c.json({ success: false, error: 'filePath is required' }, 400);
  }

  // With GitHub API, we can't really "discard" - just reload the file
  return c.json({
    success: true,
    data: {
      filePath,
      message: 'Reload file to discard changes',
    },
  });
});

// ============================================
// AI Assistant Routes
// ============================================

/**
 * POST /code-editor/ai/apply-changes
 * Use AI to apply changes to code based on a prompt
 */
app.post('/code-editor/ai/apply-changes', async (c) => {
  try {
    const { filePath, currentContent, prompt } = await c.req.json();

    if (!filePath) {
      return c.json({ success: false, error: 'filePath is required' }, 400);
    }
    if (!currentContent) {
      return c.json({ success: false, error: 'currentContent is required' }, 400);
    }
    if (!prompt || typeof prompt !== 'string') {
      return c.json({ success: false, error: 'prompt is required' }, 400);
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return c.json({ success: false, error: 'OpenAI API key not configured' }, 500);
    }

    // Get file name for context
    const fileName = filePath.split('/').pop() || 'file.tsx';

    // Build the AI prompt
    const systemPrompt = `You are an expert React/TypeScript developer. You will be given the content of a React component file and a request for changes.

Your task:
1. Carefully analyze the current code structure, imports, and syntax
2. Apply the requested changes while maintaining code integrity
3. Return ONLY the complete, updated file content - no explanations, no Markdown code blocks

CRITICAL SYNTAX RULES:
- Ensure ALL opening brackets/parens have matching closing brackets/parens
- Ensure ALL strings are properly quoted and closed
- Ensure ALL JSX tags are properly opened and closed
- Preserve exact import statements unless adding new ones
- Maintain the existing code formatting and style
- Do not truncate or cut off any code
- The output must be a complete, valid TypeScript/React file

OUTPUT REQUIREMENTS:
- Return ONLY the file content as a string, nothing else
- Do not include \`\`\`typescript or \`\`\`tsx markers
- Do not include any conversational text
- Do not include "Here is the updated code" or similar phrases
- The output must be syntactically valid and complete`;

    const userPrompt = `File: ${fileName}

Current code:
${currentContent}

Requested changes:
${prompt}

Return ONLY the complete updated file content:`;

    console.log('[CodeEditor AI] Processing request for file:', fileName);

    // Call OpenAI API (using GPT-4.1-nano for fast, accurate code generation)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Very low temperature for more accurate code
        max_tokens: 16000, // Allow for longer files
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CodeEditor AI] OpenAI API error:', errorText);
      return c.json({ success: false, error: 'Failed to process AI request: ' + errorText }, 500);
    }

    const result = await response.json();
    const newContent = result.choices?.[0]?.message?.content?.trim();

    if (!newContent) {
      return c.json({ success: false, error: 'AI returned no content' }, 500);
    }

    // Clean up any accidental markdown code blocks
    let cleanedContent = newContent;
    if (cleanedContent.startsWith('```')) {
      // Remove first code block marker
      cleanedContent = cleanedContent.replace(/^```[\w]*\n/, '');
      // Remove closing code block marker if present
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3).trim();
      }
    }

    console.log('[CodeEditor AI] Successfully generated new content');

    return c.json({
      success: true,
      data: {
        originalContent: currentContent,
        newContent: cleanedContent,
        fileName,
      },
    });
  } catch (error) {
    console.error('[CodeEditor AI] Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process AI request',
    }, 500);
  }
});

export default app;