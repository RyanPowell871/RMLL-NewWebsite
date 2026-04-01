/**
 * DirectCodeEditor - Monaco-based code editor with Git integration
 */

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { projectId } from '../../utils/supabase/info';
import { getAccessToken } from '../../utils/supabase-client';
import { toast } from 'sonner';
import {
  Save,
  RefreshCw,
  GitBranch,
  GitCommit,
  FileText,
  AlertTriangle,
  RotateCcw,
  Rocket,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Link2,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  FileTree,
  buildFileTree,
  type FileNode,
} from './FileTree';
import {
  CommitHistory,
  CommitDiff,
  type Commit,
} from './CommitHistory';
import { DiffViewer } from './DiffViewer';
import { LinkInserter, type LinkInsertOptions } from './LinkInserter';

const EDGE_FUNCTION_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f`;

interface ApiFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
}

interface EditorState {
  files: ApiFile[];
  fileTree: FileNode[];
  selectedFile: string | null;
  fileContent: string;
  originalContent: string;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isPushing: boolean;
  commitMessage: string;
  commits: Commit[];
  isLoadingHistory: boolean;
  selectedCommit: string | null;
  diffOpen: boolean;
  diffData: { diff: string; from: string; to: string; fileName: string } | null;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  showLivePreview: boolean;
  linkInserterOpen: boolean;
}

export function DirectCodeEditor() {
  const [state, setState] = useState<EditorState>({
    files: [],
    fileTree: [],
    selectedFile: null,
    fileContent: '',
    originalContent: '',
    isDirty: false,
    isLoading: true,
    isSaving: false,
    isPushing: false,
    commitMessage: '',
    commits: [],
    isLoadingHistory: false,
    selectedCommit: null,
    diffOpen: false,
    diffData: null,
    leftPanelOpen: true,
    rightPanelOpen: false,
    showLivePreview: false,
    linkInserterOpen: false,
  });

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const editorRef = useRef<any>(null);

  // Load file list on mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Load file content when file is selected
  useEffect(() => {
    if (state.selectedFile) {
      loadFile(state.selectedFile);
    } else {
      setState((prev) => ({
        ...prev,
        fileContent: '',
        originalContent: '',
        isDirty: false,
      }));
    }
  }, [state.selectedFile]);

  // Load commit history when file is selected
  useEffect(() => {
    if (state.selectedFile) {
      loadHistory(state.selectedFile);
    } else {
      setState((prev) => ({ ...prev, commits: [] }));
    }
  }, [state.selectedFile]);

  // Handle editor mount
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${EDGE_FUNCTION_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAccessToken()}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      let error = { error: `Server error: ${response.status}` };
      try {
        error = JSON.parse(responseText);
      } catch {
        // Keep default error
      }
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    return response.json();
  };

  const loadFiles = async () => {
    try {
      const result = await apiCall('/code-editor/files');

      if (!result.success) {
        throw new Error(result.error || 'Failed to load files');
      }

      const fileTree = buildFileTree(result.data.files || []);

      setState((prev) => ({
        ...prev,
        files: result.data.files,
        fileTree,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load files');
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const loadFile = async (filePath: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const result = await apiCall(`/code-editor/file?path=${encodeURIComponent(filePath)}`);

      if (!result.success) {
        throw new Error(result.error || 'Failed to load file');
      }

      setState((prev) => ({
        ...prev,
        fileContent: result.data.content,
        originalContent: result.data.content,
        isDirty: false,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load file');
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const loadHistory = async (filePath: string) => {
    try {
      setState((prev) => ({ ...prev, isLoadingHistory: true }));

      const result = await apiCall(`/code-editor/history?file=${encodeURIComponent(filePath)}&limit=20`);

      if (!result.success) {
        throw new Error(result.error || 'Failed to load history');
      }

      setState((prev) => ({
        ...prev,
        commits: result.data.commits,
        isLoadingHistory: false,
      }));
    } catch (error) {
      console.error('Error loading history:', error);
      setState((prev) => ({ ...prev, isLoadingHistory: false }));
    }
  };

  const handleSave = async () => {
    if (!state.selectedFile || !state.commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      // Write file
      await apiCall(`/code-editor/file?path=${encodeURIComponent(state.selectedFile)}`, {
        method: 'POST',
        body: JSON.stringify({ content: state.fileContent }),
      });

      // Commit changes
      const commitResult = await apiCall('/code-editor/commit', {
        method: 'POST',
        body: JSON.stringify({
          filePaths: [state.selectedFile],
          message: state.commitMessage,
        }),
      });

      if (!commitResult.success) {
        throw new Error(commitResult.error || 'Failed to commit changes');
      }

      // Push to remote
      setState((prev) => ({ ...prev, isSaving: false, isPushing: true }));

      const pushResult = await apiCall('/code-editor/push', {
        method: 'POST',
      });

      if (!pushResult.success) {
        toast.warn(`Committed locally but failed to push: ${pushResult.error}`);
      } else {
        toast.success('Saved, committed, and deployed to Vercel');
      }

      // Update state
      setState((prev) => ({
        ...prev,
        originalContent: state.fileContent,
        isDirty: false,
        commitMessage: '',
        isPushing: false,
      }));

      // Reload history
      if (state.selectedFile) {
        await loadHistory(state.selectedFile);
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save');
      setState((prev) => ({ ...prev, isSaving: false, isPushing: false }));
    }
  };

  const handleRollback = async (commitHash: string) => {
    if (!state.selectedFile) return;

    if (!confirm('Are you sure you want to rollback this file? This will replace the current content with the content from the selected commit.')) {
      return;
    }

    try {
      const result = await apiCall('/code-editor/rollback', {
        method: 'POST',
        body: JSON.stringify({
          filePath: state.selectedFile,
          commitHash,
        }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to rollback');
      }

      toast.success('File rolled back successfully');
      await loadFile(state.selectedFile);
    } catch (error) {
      console.error('Error rolling back:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to rollback');
    }
  };

  const handleViewDiff = async (commitHash: string) => {
    if (!state.selectedFile) return;

    try {
      const result = await apiCall(`/code-editor/diff?file=${encodeURIComponent(state.selectedFile)}&from=${commitHash}`);

      if (!result.success) {
        throw new Error(result.error || 'Failed to get diff');
      }

      setState((prev) => ({
        ...prev,
        diffOpen: true,
        diffData: {
          diff: result.data.diff,
          from: commitHash,
          to: 'HEAD',
          fileName: state.selectedFile,
        },
      }));
    } catch (error) {
      console.error('Error getting diff:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get diff');
    }
  };

  const handleDiscard = async () => {
    if (!state.selectedFile || !state.isDirty) return;

    if (!confirm('Are you sure you want to discard your unsaved changes?')) {
      return;
    }

    try {
      const result = await apiCall('/code-editor/discard', {
        method: 'POST',
        body: JSON.stringify({ filePath: state.selectedFile }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to discard changes');
      }

      toast.success('Changes discarded');
      await loadFile(state.selectedFile);
    } catch (error) {
      console.error('Error discarding changes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to discard changes');
    }
  };

  // Insert text at cursor position in Monaco Editor
  const insertTextAtCursor = (text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const position = editor.getPosition();
    if (!position) return;

    editor.executeEdits('insert-link', [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text,
      },
    ]);

    // Move cursor after inserted text
    const newPosition = {
      lineNumber: position.lineNumber,
      column: position.column + text.length,
    };
    editor.setPosition(newPosition);
    editor.focus();
  };

  // Handle link insertion from LinkInserter
  const handleInsertLink = (options: LinkInsertOptions) => {
    // Build markdown-style link: [text](url) or <a href="url" target="_blank">text</a> for JSX
    const linkText = options.title || options.url;
    const targetAttr = options.newTab ? ' target="_blank" rel="noopener noreferrer"' : '';

    // For React/JSX, use the <a> tag format
    const link = `<a href="${options.url}"${targetAttr}>${linkText}</a>`;

    insertTextAtCursor(link);
    setState((prev) => ({ ...prev, linkInserterOpen: false }));
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(state.fileContent);
      setCopyStatus('copied');
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getFileName = (path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#013fac]" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Code Editor</h1>
          </div>
          {state.selectedFile && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getFileName(state.selectedFile)}
              </Badge>
              {state.isDirty && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Unsaved
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LinkInserter
            open={state.linkInserterOpen}
            onOpenChange={(open) => setState((prev) => ({ ...prev, linkInserterOpen: open }))}
            onInsert={handleInsertLink}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, linkInserterOpen: true }))}
                title="Insert Link"
              >
                <Link2 className="w-4 h-4" />
              </Button>
            }
          />
          {state.selectedFile && state.isDirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState((prev) => ({ ...prev, showLivePreview: !prev.showLivePreview }))}
              title={state.showLivePreview ? 'Hide Preview' : 'Show Preview'}
            >
              {state.showLivePreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setState((prev) => ({ ...prev, leftPanelOpen: !prev.leftPanelOpen }))}
            title="Toggle file tree"
          >
            {state.leftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setState((prev) => ({ ...prev, rightPanelOpen: !prev.rightPanelOpen }))}
            title="Toggle history panel"
          >
            {state.rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>
          {state.isDirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              title="Discard changes"
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {state.selectedFile && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 max-w-md">
              <Label htmlFor="commit-message" className="sr-only">Commit message</Label>
              <Input
                id="commit-message"
                placeholder="Enter commit message..."
                value={state.commitMessage}
                onChange={(e) => setState((prev) => ({ ...prev, commitMessage: e.target.value }))}
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && state.isDirty) {
                    handleSave();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              title="Copy to clipboard"
            >
              {copyStatus === 'copied' ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!state.isDirty || !state.commitMessage.trim() || state.isSaving || state.isPushing}
              size="sm"
              className="bg-[#013fac] hover:bg-[#0149c9]"
            >
              {state.isSaving || state.isPushing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {state.isPushing ? 'Deploying...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save & Deploy
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - File Tree */}
        {state.leftPanelOpen && (
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/30 shrink-0">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <GitBranch className="w-4 h-4" />
                <span>Files</span>
              </div>
            </div>
            <FileTree
              files={state.fileTree}
              selectedFile={state.selectedFile}
              onSelectFile={(path) => setState((prev) => ({ ...prev, selectedFile: path }))}
              className="flex-1 overflow-y-auto"
            />
          </div>
        )}

        {/* Center - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {state.isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="w-8 h-8 border-3 border-[#013fac] border-t-transparent rounded-full animate-spin mr-3" />
              Loading...
            </div>
          ) : !state.selectedFile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <FileText className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a file to edit</p>
              <p className="text-sm mt-1">Choose from the file tree on the left</p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="typescript"
                value={state.fileContent}
                onChange={(value) => setState((prev) => ({
                  ...prev,
                  fileContent: value || '',
                  isDirty: value !== prev.originalContent,
                }))}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                beforeMount={(monaco) => {
                  // Configure TypeScript to suppress all diagnostics
                  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: true,
                  });
                  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: true,
                  });
                  // Disable all compiler options
                  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ES2020,
                    allowNonTsExtensions: true,
                    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                    module: monaco.languages.typescript.ModuleKind.CommonJS,
                    noEmit: true,
                    esModuleInterop: true,
                    jsx: monaco.languages.typescript.JsxEmit.React,
                    reactNamespace: 'React',
                    allowJs: true,
                    typeRoots: [],
                  });
                }}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  renderWhitespace: 'selection',
                  tabSize: 2,
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16 },
                  // Completely disable all validation
                  readOnly: false,
                  domReadOnly: false,
                  disableTranslate3D: true,
                  // Disable diagnostics at the model level
                  noValidation: true,
                  // Disable semantic highlighting to avoid type-based coloring
                  semanticHighlighting: { enabled: false },
                  // Disable all suggestions
                  suggestOnTriggerCharacters: false,
                  quickSuggestions: false,
                  // Disable hover
                  hover: { enabled: false },
                  // Disable parameter hints
                  parameterHints: { enabled: false },
                  // Disable code lens
                  codeLens: false,
                  // Disable folding
                  folding: false,
                  // Disable lightbulb actions
                  lightbulb: { enabled: false },
                }}
              />
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        {state.showLivePreview && state.selectedFile && (
          <div className="w-[500px] border-l border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/30 shrink-0">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-sm">Live Preview</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {state.isDirty ? 'Unsaved Changes' : 'No Changes'}
              </Badge>
            </div>
            <div className="flex-1 overflow-hidden">
              <DiffViewer
                oldContent={state.originalContent}
                newContent={state.fileContent}
                fileName={getFileName(state.selectedFile)}
              />
            </div>
          </div>
        )}

        {/* Right Panel - History */}
        {state.rightPanelOpen && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/30 shrink-0">
            <CommitHistory
              commits={state.commits}
              isLoading={state.isLoadingHistory}
              selectedCommit={state.selectedCommit}
              onSelectCommit={(hash) => setState((prev) => ({ ...prev, selectedCommit: hash }))}
              onViewDiff={handleViewDiff}
              onRollback={handleRollback}
            />
          </div>
        )}

        {/* Diff Panel */}
        {state.diffOpen && state.diffData && (
          <div className="w-[500px] border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
            <DiffViewer
              oldContent={state.originalContent}
              newContent={state.fileContent}
              fileName={state.diffData.fileName}
              onClose={() => setState((prev) => ({ ...prev, diffOpen: false, diffData: null }))}
            />
          </div>
        )}
      </div>

      {/* Git Diff Modal */}
      {state.diffOpen && state.diffData && state.diffData.diff && (
        <CommitDiff
          diff={state.diffData.diff}
          fromHash={state.diffData.from}
          toHash={state.diffData.to}
          fileName={state.diffData.fileName}
          onClose={() => setState((prev) => ({ ...prev, diffOpen: false, diffData: null }))}
        />
      )}

      {/* Info Banner */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <GitCommit className="w-3 h-3" />
            <span>Git integration enabled</span>
          </div>
          <div className="flex items-center gap-1">
            <Rocket className="w-3 h-3" />
            <span>Auto-deploys to Vercel on save</span>
          </div>
        </div>
        {state.selectedFile && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Editing:</span>
            <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
              {state.selectedFile}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}