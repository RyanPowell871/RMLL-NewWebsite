/**
 * Code Editor Routes - Direct code editing with Git integration
 *
 * Provides API endpoints for:
 * - Listing and reading files in src/components/league-info/
 * - Writing file contents with validation
 * - Git operations: commit, history, diff, rollback, push
 */

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Constants
const BASE_DIR = Deno.cwd();
const EDITABLE_DIR = `${BASE_DIR}/src/components/league-info`;

// ============================================
// Git Helper Functions
// ============================================

interface GitResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

async function runGit(args: string[]): Promise<GitResult> {
  const command = new Deno.Command('git', {
    args,
    cwd: BASE_DIR,
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stdout, stderr } = await command.output();
  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    success: code === 0,
  };
}

// ============================================
// File Path Validation
// ============================================

function validateFilePath(filePath: string): { valid: boolean; error?: string; fullPath?: string } {
  // Remove leading slashes and any ../ attempts
  const cleanPath = filePath.replace(/^\/+/, '').replace(/\.\.+/g, '');

  // Ensure the file is within the editable directory
  const fullPath = `${BASE_DIR}/${cleanPath}`;

  // Check if path is within src/components/league-info/
  const relativePath = fullPath.replace(BASE_DIR + '/', '');
  if (!relativePath.startsWith('src/components/league-info/')) {
    return {
      valid: false,
      error: 'File must be within src/components/league-info/',
    };
  }

  // Check file extension
  if (!relativePath.endsWith('.tsx') && !relativePath.endsWith('.ts') && !relativePath.endsWith('.jsx') && !relativePath.endsWith('.js')) {
    return {
      valid: false,
      error: 'Only TypeScript/JavaScript files are editable (.ts, .tsx, .js, .jsx)',
    };
  }

  return { valid: true, fullPath };
}

// ============================================
// TypeScript Syntax Validation
// ============================================

async function validateTypeScriptCode(code: string, filePath: string): Promise<{ valid: boolean; errors?: string[] }> {
  // Use Deno's type checker to validate TypeScript
  const tempFile = `/tmp/temp_check_${Date.now()}.ts`;

  try {
    // Create temporary file
    await Deno.writeTextFile(tempFile, code);

    // Run Deno type check
    const command = new Deno.Command(Deno.execPath(), {
      args: ['check', '--no-check', tempFile],
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code, stderr } = await command.output();
    const errorOutput = new TextDecoder().decode(stderr);

    if (code !== 0) {
      // Parse errors from output
      const errors: string[] = [];
      const lines = errorOutput.split('\n');
      for (const line of lines) {
        if (line.includes('error:')) {
          errors.push(line.trim());
        }
      }
      return { valid: false, errors };
    }

    return { valid: true };
  } catch (e) {
    // If Deno check fails, do a basic syntax check
    try {
      // Check for basic syntax issues
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
    } finally {
      // Clean up temp file
      try {
        await Deno.remove(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  } finally {
    // Clean up temp file
    try {
      await Deno.remove(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================
// Authentication Middleware
// ============================================

interface User {
  id: string;
  email: string;
  role: string;
}

async function getUserFromToken(authorization: string | null): Promise<User | null> {
  if (!authorization) return null;

  const token = authorization.replace('Bearer ', '');
  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data.user) return null;

  // Get user role from database
  const { data: profile } = await supabaseClient
    .from('cms_users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (!profile) return null;

  return {
    id: data.user.id,
    email: data.user.email || '',
    role: profile.role,
  };
}

app.use('*', async (c, next) => {
  const authorization = c.req.header('Authorization');
  const user = await getUserFromToken(authorization);

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  c.set('user', user);
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
  try {
    const files: Array<{ name: string; path: string; type: 'file' | 'dir' }> = [];

    async function scanDirectory(dir: string, relativePath: string = '') {
      for await (const entry of Deno.readDir(dir)) {
        const entryPath = `${dir}/${entry.name}`;
        const relativeEntryPath = `${relativePath}${entry.name}`;

        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory) {
          files.push({
            name: entry.name,
            path: relativeEntryPath,
            type: 'dir',
          });
          await scanDirectory(entryPath, `${relativeEntryPath}/`);
        } else if (entry.isFile) {
          const ext = entry.name.slice(entry.name.lastIndexOf('.'));
          if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
            files.push({
              name: entry.name,
              path: relativeEntryPath,
              type: 'file',
            });
          }
        }
      }
    }

    await scanDirectory(EDITABLE_DIR, 'src/components/league-info/');

    return c.json({
      success: true,
      data: { files },
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    }, 500);
  }
});

/**
 * GET /code-editor/file/:path
 * Read file contents
 */
app.get('/code-editor/file/:path(.+)', async (c) => {
  try {
    const filePath = c.req.param('path') || '';
    const validation = validateFilePath(filePath);

    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    const content = await Deno.readTextFile(validation.fullPath!);
    const stats = await Deno.stat(validation.fullPath!);

    return c.json({
      success: true,
      data: {
        content,
        path: filePath,
        size: stats.size,
        modified: stats.mtime?.toISOString(),
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
 * POST /code-editor/file/:path
 * Write file contents with validation
 */
app.post('/code-editor/file/:path(.+)', async (c) => {
  try {
    const filePath = c.req.param('path') || '';
    const validation = validateFilePath(filePath);

    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    const { content } = await c.req.json();

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

    // Write file
    await Deno.writeTextFile(validation.fullPath!, content);

    return c.json({
      success: true,
      data: {
        path: filePath,
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
 * Stage and commit changes to git
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

    const user = c.get('user') as User;

    // Configure git user
    await runGit(['config', 'user.email', 'cms@rmll.com']);
    await runGit(['config', 'user.name', user.name || user.email]);

    // Stage files
    const validPaths = filePaths.map((p: string) => {
      const validation = validateFilePath(p);
      return validation.valid ? validation.fullPath : null;
    }).filter(Boolean);

    if (validPaths.length === 0) {
      return c.json({ success: false, error: 'No valid files to commit' }, 400);
    }

    const addResult = await runGit(['add', ...(validPaths as string[])]);
    if (!addResult.success) {
      return c.json({ success: false, error: 'Failed to stage files', stderr: addResult.stderr }, 500);
    }

    // Commit
    const commitResult = await runGit(['commit', '-m', message]);
    if (!commitResult.success) {
      return c.json({ success: false, error: 'Failed to commit', stderr: commitResult.stderr }, 500);
    }

    // Get commit hash
    const logResult = await runGit(['log', '-1', '--format=%H']);
    const commitHash = logResult.stdout.trim();

    return c.json({
      success: true,
      data: {
        commitHash,
        message,
        files: filePaths,
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
 * GET /code-editor/history/:file
 * Get commit history for a file
 */
app.get('/code-editor/history/:file(.+)', async (c) => {
  try {
    const filePath = c.req.param('file') || '';
    const validation = validateFilePath(filePath);

    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    const limit = parseInt(c.req.query('limit') || '20');

    // Get git log for file
    const result = await runGit([
      'log',
      '--format=%H|%an|%ae|%ad|%s',
      '--date=iso',
      `-${limit}`,
      '--',
      validation.fullPath!,
    ]);

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to get history' }, 500);
    }

    const commits = result.stdout.trim().split('\n').filter(Boolean).map(line => {
      const [hash, author, email, date, ...messageParts] = line.split('|');
      return {
        hash,
        author,
        email,
        date,
        message: messageParts.join('|'),
      };
    });

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
 * GET /code-editor/diff/:file
 * Get diff between commits
 * Query params: from (commit hash), to (commit hash, defaults to HEAD)
 */
app.get('/code-editor/diff/:file(.+)', async (c) => {
  try {
    const filePath = c.req.param('file') || '';
    const validation = validateFilePath(filePath);

    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    const fromCommit = c.req.query('from');
    const toCommit = c.req.query('to') || 'HEAD';

    if (!fromCommit) {
      return c.json({ success: false, error: 'from commit hash is required' }, 400);
    }

    const result = await runGit([
      'diff',
      `${fromCommit}..${toCommit}`,
      '--',
      validation.fullPath!,
    ]);

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to get diff' }, 500);
    }

    // Parse diff
    const diffOutput = result.stdout;

    return c.json({
      success: true,
      data: {
        diff: diffOutput,
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

    // Checkout file from commit
    const result = await runGit(['checkout', commitHash, '--', validation.fullPath!]);

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to rollback', stderr: result.stderr }, 500);
    }

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
 * Push commits to remote (triggers Vercel deployment)
 */
app.post('/code-editor/push', async (c) => {
  try {
    const user = c.get('user') as User;

    // Get GitHub token from environment
    const token = Deno.env.get('GITHUB_TOKEN');

    if (!token) {
      return c.json({
        success: false,
        error: 'GitHub token not configured',
      }, 500);
    }

    // Get current branch
    const branchResult = await runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (!branchResult.success) {
      return c.json({ success: false, error: 'Failed to get current branch' }, 500);
    }
    const branch = branchResult.stdout.trim();

    // Set remote URL with token
    const remoteUrl = `https://x-access-token:${token}@github.com/RyanPowell871/RMLL-NewWebsite.git`;
    await runGit(['remote', 'set-url', 'origin', remoteUrl]);

    // Configure git user
    await runGit(['config', 'user.email', 'cms@rmll.com']);
    await runGit(['config', 'user.name', user.name || user.email]);

    // Push to remote
    const result = await runGit(['push', 'origin', branch]);

    if (!result.success) {
      // Check if there's nothing to push
      if (result.stderr.includes('Everything up-to-date')) {
        return c.json({
          success: true,
          data: {
            message: 'Everything up-to-date',
            pushed: false,
          },
        });
      }

      return c.json({
        success: false,
        error: 'Failed to push',
        stderr: result.stderr,
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        branch,
        message: 'Pushed successfully. Vercel deployment will begin shortly.',
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
 * Get git status for working directory
 */
app.get('/code-editor/status', async (c) => {
  try {
    const result = await runGit(['status', '--porcelain']);

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to get status' }, 500);
    }

    const lines = result.stdout.trim().split('\n').filter(Boolean);
    const modified: string[] = [];
    const staged: string[] = [];

    for (const line of lines) {
      const status = line.substring(0, 2);
      const filePath = line.substring(3);

      // Only include files in src/components/league-info/
      if (filePath.startsWith('src/components/league-info/')) {
        if (status[0] !== ' ' && status[0] !== '?') {
          staged.push(filePath);
        }
        if (status[1] !== ' ') {
          modified.push(filePath);
        }
      }
    }

    return c.json({
      success: true,
      data: {
        modified,
        staged,
      },
    });
  } catch (error) {
    console.error('Error getting status:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get status',
    }, 500);
  }
});

/**
 * POST /code-editor/discard
 * Discard uncommitted changes for a file
 */
app.post('/code-editor/discard', async (c) => {
  try {
    const { filePath } = await c.req.json();

    if (!filePath) {
      return c.json({ success: false, error: 'filePath is required' }, 400);
    }

    const validation = validateFilePath(filePath);
    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }

    // Discard changes
    const result = await runGit(['checkout', '--', validation.fullPath!]);

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to discard changes' }, 500);
    }

    return c.json({
      success: true,
      data: {
        filePath,
        message: 'Changes discarded successfully',
      },
    });
  } catch (error) {
    console.error('Error discarding changes:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to discard changes',
    }, 500);
  }
});

export default app;