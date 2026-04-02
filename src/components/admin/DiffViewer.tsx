/**
 * DiffViewer - Side-by-side diff view component
 */

import { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * CompactDiffViewer - Shows only changed lines (for AI review)
 */
interface CompactDiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName?: string;
}

export function CompactDiffViewer({ oldContent, newContent, fileName }: CompactDiffViewerProps) {
  const diffLines = useMemo(() => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const result: DiffLine[] = [];

    // Simple line-by-line diff
    let oldIdx = 0;
    let newIdx = 0;

    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      const oldLine = oldLines[oldIdx];
      const newLine = newLines[newIdx];

      if (oldIdx < oldLines.length && newIdx < newLines.length && oldLine === newLine) {
        // Lines are the same - skip in compact mode
        oldIdx++;
        newIdx++;
      } else {
        // Lines differ
        if (oldIdx < oldLines.length && newIdx < newLines.length) {
          // Both lines exist but are different - show as remove + add
          result.push({
            type: 'remove',
            content: oldLine,
            oldLineNum: oldIdx + 1,
          });
          result.push({
            type: 'add',
            content: newLine,
            newLineNum: newIdx + 1,
          });
          oldIdx++;
          newIdx++;
        } else if (oldIdx < oldLines.length) {
          // Only old lines remain
          result.push({
            type: 'remove',
            content: oldLine,
            oldLineNum: oldIdx + 1,
          });
          oldIdx++;
        } else {
          // Only new lines remain
          result.push({
            type: 'add',
            content: newLine,
            newLineNum: newIdx + 1,
          });
          newIdx++;
        }
      }
    }

    return result;
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    const additions = diffLines.filter((l) => l.type === 'add').length;
    const deletions = diffLines.filter((l) => l.type === 'remove').length;
    return { additions, deletions, changes: additions + deletions };
  }, [diffLines]);

  if (diffLines.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No changes detected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm">Changed Lines</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
              +{stats.additions}
            </Badge>
            <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
              -{stats.deletions}
            </Badge>
          </div>
        </div>
        {fileName && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{fileName}</span>
        )}
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto">
        <div className="font-mono text-xs">
          {diffLines.map((line, index) => (
            <div
              key={index}
              className={`
                flex border-b border-gray-100 dark:border-gray-800
                ${line.type === 'add' ? 'bg-green-50/50 dark:bg-green-900/10' : ''}
                ${line.type === 'remove' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
              `}
            >
              {/* Line number column */}
              <div className="shrink-0 flex flex-col w-16 border-r border-gray-200 dark:border-gray-700">
                {line.type === 'remove' ? (
                  <span className="h-6 flex items-center justify-center text-gray-400 select-none bg-red-100/30">
                    {line.oldLineNum}
                  </span>
                ) : (
                  <span className="h-6 flex items-center justify-center text-gray-400 select-none bg-green-100/30">
                    {line.newLineNum}
                  </span>
                )}
              </div>

              {/* Content column */}
              <pre className="flex-1 overflow-x-auto p-0.5">
                <code className={`
                  ${line.type === 'add' ? 'text-green-700 dark:text-green-400' : ''}
                  ${line.type === 'remove' ? 'text-red-700 dark:text-red-400' : ''}
                `}>
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}{line.content}
                </code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface DiffLine {
  type: 'add' | 'remove' | 'neutral' | 'header';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName?: string;
  onClose?: () => void;
}

export function DiffViewer({ oldContent, newContent, fileName, onClose }: DiffViewerProps) {
  const diffLines = useMemo(() => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const result: DiffLine[] = [];

    // Simple line-by-line diff (can be enhanced with more sophisticated algorithm)
    let oldIdx = 0;
    let newIdx = 0;

    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      const oldLine = oldLines[oldIdx];
      const newLine = newLines[newIdx];

      if (oldIdx < oldLines.length && newIdx < newLines.length && oldLine === newLine) {
        // Lines are the same
        result.push({
          type: 'neutral',
          content: oldLine,
          oldLineNum: oldIdx + 1,
          newLineNum: newIdx + 1,
        });
        oldIdx++;
        newIdx++;
      } else {
        // Lines differ
        if (oldIdx < oldLines.length && newIdx < newLines.length) {
          // Both lines exist but are different - show as remove + add
          result.push({
            type: 'remove',
            content: oldLine,
            oldLineNum: oldIdx + 1,
          });
          result.push({
            type: 'add',
            content: newLine,
            newLineNum: newIdx + 1,
          });
          oldIdx++;
          newIdx++;
        } else if (oldIdx < oldLines.length) {
          // Only old lines remain
          result.push({
            type: 'remove',
            content: oldLine,
            oldLineNum: oldIdx + 1,
          });
          oldIdx++;
        } else {
          // Only new lines remain
          result.push({
            type: 'add',
            content: newLine,
            newLineNum: newIdx + 1,
          });
          newIdx++;
        }
      }
    }

    return result;
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    const additions = diffLines.filter((l) => l.type === 'add').length;
    const deletions = diffLines.filter((l) => l.type === 'remove').length;
    const changes = diffLines.filter((l) => l.type === 'add' || l.type === 'remove').length;
    return { additions, deletions, changes };
  }, [diffLines]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm">Changes</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
              +{stats.additions}
            </Badge>
            <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
              -{stats.deletions}
            </Badge>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto">
        <div className="font-mono text-xs">
          {diffLines.map((line, index) => (
            <div
              key={index}
              className={`
                flex border-b border-gray-100 dark:border-gray-800
                ${line.type === 'add' ? 'bg-green-50/50 dark:bg-green-900/10' : ''}
                ${line.type === 'remove' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                ${line.type === 'header' ? 'bg-gray-100 dark:bg-gray-800' : ''}
              `}
            >
              {/* Line number column */}
              <div className="shrink-0 flex flex-col w-12 border-r border-gray-200 dark:border-gray-700">
                {line.type === 'remove' || line.type === 'neutral' ? (
                  <span className={`
                    h-5 flex items-center justify-center text-gray-400 select-none
                    ${line.type === 'remove' ? 'bg-red-100/30' : ''}
                  `}>
                    {line.oldLineNum}
                  </span>
                ) : (
                  <span className="h-5" />
                )}
                {line.type === 'add' || line.type === 'neutral' ? (
                  <span className={`
                    h-5 flex items-center justify-center text-gray-400 select-none
                    ${line.type === 'add' ? 'bg-green-100/30' : ''}
                  `}>
                    {line.newLineNum}
                  </span>
                ) : (
                  <span className="h-5" />
                )}
              </div>

              {/* Content column */}
              <pre className="flex-1 overflow-x-auto p-0.5">
                <code className={`
                  ${line.type === 'add' ? 'text-green-700 dark:text-green-400' : ''}
                  ${line.type === 'remove' ? 'text-red-700 dark:text-red-400' : ''}
                  ${line.type === 'neutral' ? 'text-gray-800 dark:text-gray-300' : ''}
                  ${line.type === 'header' ? 'text-gray-500' : ''}
                `}>
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}{line.content}
                </code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * UnifiedDiffViewer - Unified diff view (single column)
 */
export interface UnifiedDiffLine {
  type: 'add' | 'remove' | 'neutral' | 'header';
  content: string;
  lineNum?: number;
}

interface UnifiedDiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName?: string;
  onClose?: () => void;
}

export function UnifiedDiffViewer({ oldContent, newContent, fileName, onClose }: UnifiedDiffViewerProps) {
  const diffLines = useMemo(() => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const result: UnifiedDiffLine[] = [];

    // Simple line-by-line diff
    let oldIdx = 0;
    let newIdx = 0;

    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      const oldLine = oldLines[oldIdx];
      const newLine = newLines[newIdx];

      if (oldIdx < oldLines.length && newIdx < newLines.length && oldLine === newLine) {
        result.push({
          type: 'neutral',
          content: oldLine,
          lineNum: newIdx + 1,
        });
        oldIdx++;
        newIdx++;
      } else {
        if (oldIdx < oldLines.length && newIdx < newLines.length) {
          result.push({
            type: 'remove',
            content: oldLine,
            lineNum: oldIdx + 1,
          });
          result.push({
            type: 'add',
            content: newLine,
            lineNum: newIdx + 1,
          });
          oldIdx++;
          newIdx++;
        } else if (oldIdx < oldLines.length) {
          result.push({
            type: 'remove',
            content: oldLine,
            lineNum: oldIdx + 1,
          });
          oldIdx++;
        } else {
          result.push({
            type: 'add',
            content: newLine,
            lineNum: newIdx + 1,
          });
          newIdx++;
        }
      }
    }

    return result;
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    const additions = diffLines.filter((l) => l.type === 'add').length;
    const deletions = diffLines.filter((l) => l.type === 'remove').length;
    return { additions, deletions };
  }, [diffLines]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm">Diff View</h3>
          {fileName && <span className="text-sm text-gray-500 dark:text-gray-400">{fileName}</span>}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
              +{stats.additions}
            </Badge>
            <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
              -{stats.deletions}
            </Badge>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto">
        <div className="font-mono text-xs">
          {diffLines.map((line, index) => (
            <div
              key={index}
              className={`
                flex border-b border-gray-100 dark:border-gray-800
                ${line.type === 'add' ? 'bg-green-50/50 dark:bg-green-900/10' : ''}
                ${line.type === 'remove' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                ${line.type === 'header' ? 'bg-gray-100 dark:bg-gray-800' : ''}
              `}
            >
              {/* Line number */}
              <span className={`
                shrink-0 w-16 text-right pr-3 text-gray-400 select-none border-r border-gray-200 dark:border-gray-700
                ${line.type === 'add' ? 'bg-green-100/30' : ''}
                ${line.type === 'remove' ? 'bg-red-100/30' : ''}
              `}>
                {line.lineNum}
              </span>

              {/* Marker */}
              <span className={`
                shrink-0 w-6 text-center select-none
                ${line.type === 'add' ? 'text-green-600' : ''}
                ${line.type === 'remove' ? 'text-red-600' : ''}
                ${line.type === 'neutral' ? 'text-gray-400' : ''}
              `}>
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>

              {/* Content */}
              <pre className="flex-1 overflow-x-auto p-0.5">
                <code className={`
                  ${line.type === 'add' ? 'text-green-700 dark:text-green-400' : ''}
                  ${line.type === 'remove' ? 'text-red-700 dark:text-red-400' : ''}
                  ${line.type === 'neutral' ? 'text-gray-800 dark:text-gray-300' : ''}
                  ${line.type === 'header' ? 'text-gray-500' : ''}
                `}>
                  {line.content}
                </code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}