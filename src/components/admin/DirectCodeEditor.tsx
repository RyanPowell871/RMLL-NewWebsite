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
  Sparkles,
  X,
  CheckCheck,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
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
import { DiffViewer, CompactDiffViewer } from './DiffViewer';
import { LinkInserter, type LinkInsertOptions } from './LinkInserter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

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
  // AI Assistant states
  aiPromptOpen: boolean;
  aiPrompt: string;
  aiGenerating: boolean;
  aiResultOpen: boolean;
  aiOriginalContent: string;
  aiNewContent: string;
  aiFileName: string;
  aiLinkInserterOpen: boolean;
  aiRiskLevel: 'low' | 'medium' | 'high';
  aiWarnings: string[];
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
    // AI Assistant states
    aiPromptOpen: false,
    aiPrompt: '',
    aiGenerating: false,
    aiResultOpen: false,
    aiOriginalContent: '',
    aiNewContent: '',
    aiFileName: '',
    aiLinkInserterOpen: false,
    aiRiskLevel: 'low',
    aiWarnings: [],
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

  // Handle link insertion into AI prompt
  const handleInsertLinkToPrompt = (options: LinkInsertOptions) => {
    const linkText = options.title || options.url;
    const linkInfo = `\n\n[Link to insert: ${linkText} -> ${options.url}]`;
    setState((prev) => ({
      ...prev,
      aiPrompt: prev.aiPrompt + linkInfo,
      aiLinkInserterOpen: false,
    }));
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

  // AI Assistant handlers
  // Analyze prompt for potentially complex or dangerous changes
  const analyzePromptForComplexity = (prompt: string, fileName: string): {
    warnings: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } => {
    const warnings: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // File-level operations (high risk)
    const fileOperations = ['create new file', 'new component', 'add file', 'write a new', 'build a component'];
    if (fileOperations.some(op => lowerPrompt.includes(op))) {
      warnings.push('You are asking to create a new file/component. This may require multiple files and could impact the site structure.');
    }

    // Complex structural changes (medium-high risk)
    const structuralChanges = [
      'refactor', 'rewrite', 'restructure', 'redesign', 'rebuild', 'reimplement',
      'major change', 'significant change', 'complete overhaul', 'completely new'
    ];
    if (structuralChanges.some(op => lowerPrompt.includes(op))) {
      warnings.push('This request involves significant structural changes that could affect multiple parts of the code.');
    }

    // Function/component creation (medium risk)
    if (lowerPrompt.includes('create') && (lowerPrompt.includes('function') || lowerPrompt.includes('component') || lowerPrompt.includes('hook'))) {
      warnings.push('You are asking to create new functions or components. Ensure you understand the existing code structure.');
    }

    // Multiple changes at once (medium risk)
    const changeCount = (prompt.match(/change|update|modify|add|remove|delete/gi) || []).length;
    if (changeCount > 3) {
      warnings.push('This request involves multiple changes. Consider making changes one at a time for easier review.');
    }

    // Import/export changes (medium risk)
    if (lowerPrompt.includes('import') || lowerPrompt.includes('export') || lowerPrompt.includes('require')) {
      warnings.push('You are modifying imports/exports. This could affect dependencies across the application.');
    }

    // State management changes (medium risk)
    if (lowerPrompt.includes('state') || lowerPrompt.includes('useeffect') || lowerPrompt.includes('usestate')) {
      warnings.push('You are modifying React state or effects. Changes here can affect component behavior.');
    }

    // API/Data fetching changes (medium risk)
    if (lowerPrompt.includes('fetch') || lowerPrompt.includes('api') || lowerPrompt.includes('endpoint')) {
      warnings.push('You are modifying API calls or data fetching. This could affect how data loads in the application.');
    }

    // Routing/navigation changes (high risk)
    if (lowerPrompt.includes('route') || lowerPrompt.includes('navigate') || lowerPrompt.includes('link') || lowerPrompt.includes('href')) {
      warnings.push('You are modifying navigation or routing. Changes here can affect user navigation across the site.');
    }

    // Styling changes (low risk - league info pages are meant for this)
    const stylingChanges = ['color', 'style', 'css', 'font', 'size', 'align', 'spacing'];
    const isStylingOnly = stylingChanges.some(s => lowerPrompt.includes(s)) &&
      !structuralChanges.some(op => lowerPrompt.includes(op)) &&
      !fileOperations.some(op => lowerPrompt.includes(op));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (warnings.length === 0) {
      riskLevel = 'low';
    } else if (warnings.length <= 2 && isStylingOnly) {
      riskLevel = 'low';
    } else if (warnings.length >= 3 || structuralChanges.some(op => lowerPrompt.includes(op))) {
      riskLevel = 'high';
    } else {
      riskLevel = 'medium';
    }

    return { warnings, riskLevel };
  };

  const handleApplyAIChanges = async () => {
    if (!state.selectedFile || !state.aiPrompt.trim()) {
      toast.error('Please enter a prompt for the AI');
      return;
    }

    const { warnings, riskLevel } = analyzePromptForComplexity(state.aiPrompt, state.selectedFile || '');

    // For high risk, show confirmation dialog
    if (riskLevel === 'high') {
      const confirmed = window.confirm(
        `⚠️ This request involves complex changes that could potentially affect the site.\n\n${warnings.join('\n\n')}\n\nDo you want to continue?`
      );
      if (!confirmed) {
        return;
      }
    }

    // Store risk level and warnings before generating
    setState((prev) => ({
      ...prev,
      aiGenerating: true,
      aiPromptOpen: false,
      aiRiskLevel: riskLevel,
      aiWarnings: warnings,
    }));

    try {
      const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/code-editor/ai/apply-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify({
          filePath: state.selectedFile,
          currentContent: state.fileContent,
          prompt: state.aiPrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to apply AI changes');
      }

      const result = await response.json();

      setState((prev) => ({
        ...prev,
        aiGenerating: false,
        aiResultOpen: true,
        aiOriginalContent: state.fileContent,
        aiNewContent: result.data.newContent,
        aiFileName: result.data.fileName,
        aiPrompt: '',
      }));
    } catch (error) {
      console.error('Error applying AI changes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply AI changes');
      setState((prev) => ({
        ...prev,
        aiGenerating: false,
      }));
    }
  };

  const handleAcceptAIChanges = () => {
    setState((prev) => ({
      ...prev,
      fileContent: state.aiNewContent,
      originalContent: state.aiNewContent,
      isDirty: true,
      aiResultOpen: false,
    }));
    toast.success('AI changes applied to editor');
  };

  const handleRejectAIChanges = () => {
    setState((prev) => ({
      ...prev,
      aiResultOpen: false,
    }));
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
          {state.selectedFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState((prev) => ({ ...prev, aiPromptOpen: true }))}
              title="AI Assistant - Ask to make changes"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
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
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
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
          {/* AI Loading Overlay */}
          {state.aiGenerating && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-4 text-center p-8">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">AI is working...</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Analyzing code and applying your changes</p>
                </div>
              </div>
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

      {/* AI Prompt Dialog */}
      <Dialog open={state.aiPromptOpen} onOpenChange={(open) => setState((prev) => ({ ...prev, aiPromptOpen: open }))}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Assistant
            </DialogTitle>
            <DialogDescription>
              Describe the changes you want to make to the code. The AI will analyze the current file and apply your changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="ai-prompt">Your Request</Label>
                <LinkInserter
                  open={state.aiLinkInserterOpen}
                  onOpenChange={(open) => setState((prev) => ({ ...prev, aiLinkInserterOpen: open }))}
                  onInsert={handleInsertLinkToPrompt}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setState((prev) => ({ ...prev, aiLinkInserterOpen: true }))}
                      className="h-7 text-xs"
                    >
                      <Link2 className="w-3 h-3 mr-1.5" />
                      Insert Link
                    </Button>
                  }
                />
              </div>
              <Textarea
                id="ai-prompt"
                placeholder="e.g., Change the welcome message to be more welcoming, update the colors to match the new brand, add a new section for..."
                value={state.aiPrompt}
                onChange={(e) => setState((prev) => ({ ...prev, aiPrompt: e.target.value }))}
                rows={10}
                className="mt-2 resize-none"
              />
            </div>

            {/* Dynamic Warnings */}
            {state.aiPrompt.trim() && (() => {
              const { warnings, riskLevel } = analyzePromptForComplexity(state.aiPrompt, state.selectedFile || '');

              if (riskLevel === 'low') {
                return null;
              }

              const riskColors = {
                medium: {
                  bg: 'bg-amber-50 dark:bg-amber-950/30',
                  border: 'border-amber-200 dark:border-amber-800',
                  text: 'text-amber-800 dark:text-amber-200',
                  icon: 'text-amber-500'
                },
                high: {
                  bg: 'bg-red-50 dark:bg-red-950/30',
                  border: 'border-red-200 dark:border-red-800',
                  text: 'text-red-800 dark:text-red-200',
                  icon: 'text-red-500'
                }
              };
              const colors = riskColors[riskLevel];

              return (
                <div className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 ${colors.icon} shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${colors.text} mb-1`}>
                        {riskLevel === 'high' ? '⚠️ Potentially Complex Change' : 'ℹ️ Consider Reviewing'}
                      </div>
                      <ul className="text-sm space-y-1">
                        {warnings.map((warning, idx) => (
                          <li key={idx} className={`text-gray-700 dark:text-gray-300 pl-2 border-l-2 ${riskLevel === 'high' ? 'border-red-400' : 'border-amber-400'}`}>
                            {warning}
                          </li>
                        ))}
                      </ul>
                      {riskLevel === 'high' && (
                        <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            💡 Tip: For best results with league info pages, stick to text content, styling, and simple data changes. Avoid structural code changes.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Default info message */}
            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p>
                The AI will show you a side-by-side comparison before applying any changes. You can review and accept or reject the changes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setState((prev) => ({ ...prev, aiPromptOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyAIChanges}
              disabled={!state.aiPrompt.trim() || state.aiGenerating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {state.aiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Result Dialog - Diff Viewer */}
      <Dialog open={state.aiResultOpen} onOpenChange={(open) => !open && handleRejectAIChanges()}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg mb-1">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Review AI Changes
                </DialogTitle>
                <DialogDescription>
                  Review the changes below. Accept to apply them to the editor, or reject to cancel.
                </DialogDescription>
              </div>
              <button
                onClick={handleRejectAIChanges}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* Risk Level Display */}
            {state.aiRiskLevel !== 'low' && (
              <div className={`p-3 rounded-lg border ${
                state.aiRiskLevel === 'high'
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    state.aiRiskLevel === 'high' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <div className="flex-1">
                    <div className={`font-semibold text-sm mb-1 ${
                      state.aiRiskLevel === 'high'
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-amber-800 dark:text-amber-200'
                    }`}>
                      {state.aiRiskLevel === 'high' ? '⚠️ High Risk Change' : 'ℹ️ Medium Risk Change'}
                    </div>
                    {state.aiWarnings.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {state.aiWarnings.map((warning, idx) => (
                          <li key={idx} className="text-gray-700 dark:text-gray-300 pl-2 border-l-2">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Diff content */}
          <div className="flex-1 overflow-hidden min-h-0">
            <CompactDiffViewer
              oldContent={state.aiOriginalContent}
              newContent={state.aiNewContent}
              fileName={state.aiFileName}
            />
          </div>

          {/* Footer with accept/reject buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Badge variant="outline" className="text-xs">
                {state.aiFileName}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRejectAIChanges}
                className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleAcceptAIChanges}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Accept Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}