/**
 * CommitHistory - Git commit history panel
 */

import { useState } from 'react';
import {
  GitCommit,
  Clock,
  User,
  ArrowLeftRight,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface Commit {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

interface CommitHistoryProps {
  commits: Commit[];
  isLoading: boolean;
  onRollback?: (commitHash: string) => void;
  onViewDiff?: (commitHash: string) => void;
  selectedCommit?: string | null;
  onSelectCommit?: (commitHash: string) => void;
}

export function CommitHistory({
  commits,
  isLoading,
  onRollback,
  onViewDiff,
  selectedCommit,
  onSelectCommit,
}: CommitHistoryProps) {
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());

  const toggleExpand = (hash: string) => {
    setExpandedCommits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(hash)) {
        newSet.delete(hash);
      } else {
        newSet.add(hash);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getShortHash = (hash: string) => hash.slice(0, 7);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-sm">Commit History</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {commits.length} commits
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="w-6 h-6 border-2 border-[#013fac] border-t-transparent rounded-full animate-spin mr-2" />
            Loading history...
          </div>
        ) : commits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <GitCommit className="w-8 h-8 mb-2 text-gray-300" />
            <p className="text-sm">No commits yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {commits.map((commit, index) => {
              const isExpanded = expandedCommits.has(commit.hash);
              const isSelected = selectedCommit === commit.hash;

              return (
                <div
                  key={commit.hash}
                  className={`
                    transition-colors
                    ${isSelected ? 'bg-[#013fac]/5' : ''}
                  `}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <button
                          onClick={() => onSelectCommit?.(commit.hash)}
                          className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono
                            ${isSelected ? 'bg-[#013fac] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}
                          `}
                        >
                          {index + 1}
                        </button>
                        {index < commits.length - 1 && (
                          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => toggleExpand(commit.hash)}
                              className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white hover:text-[#013fac] dark:hover:text-[#013fac] transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              <span className="truncate">{commit.message}</span>
                            </button>
                          </div>

                          {index < commits.length - 1 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <span className="sr-only">Actions</span>
                                  <div className="w-4 h-0.5 bg-gray-400 rounded" />
                                  <div className="w-4 h-0.5 bg-gray-400 rounded mt-0.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewDiff?.(commit.hash)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Diff
                                </DropdownMenuItem>
                                {onRollback && (
                                  <DropdownMenuItem
                                    onClick={() => onRollback(commit.hash)}
                                    className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Rollback
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mt-2 pl-1 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(commit.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <User className="w-3 h-3" />
                              <span>{commit.author}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                              <GitCommit className="w-3 h-3" />
                              <span>{getShortHash(commit.hash)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * CommitDiff - Show diff between two commits
 */
interface CommitDiffProps {
  diff: string;
  fromHash: string;
  toHash: string;
  fileName: string;
  onClose: () => void;
}

export function CommitDiff({ diff, fromHash, toHash, fileName, onClose }: CommitDiffProps) {
  const parseDiff = (diffText: string) => {
    const lines = diffText.split('\n');
    const parsed = lines.map((line, index) => ({
      index,
      content: line,
      type: line.startsWith('+') ? 'add' : line.startsWith('-') ? 'remove' : 'neutral',
      isHeader: line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff') || line.startsWith('index'),
    }));
    return parsed;
  };

  const parsedDiff = parseDiff(diff);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="font-semibold">Diff View</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fileName}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="font-mono text-xs bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
            {parsedDiff.map((line) => (
              <div
                key={line.index}
                className={`
                  flex
                  ${line.type === 'add' ? 'bg-green-100/50 dark:bg-green-900/20' : ''}
                  ${line.type === 'remove' ? 'bg-red-100/50 dark:bg-red-900/20' : ''}
                  ${line.isHeader ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : ''}
                `}
              >
                <span className={`
                  inline-flex items-center justify-center w-12 shrink-0 border-r border-gray-200 dark:border-gray-700 text-gray-400 select-none
                  ${line.type === 'add' ? 'text-green-600' : ''}
                  ${line.type === 'remove' ? 'text-red-600' : ''}
                `}>
                  {line.index + 1}
                </span>
                <pre className="flex-1 overflow-x-auto p-0.5">
                  <span className={`
                    ${line.type === 'add' ? 'text-green-700 dark:text-green-400' : ''}
                    ${line.type === 'remove' ? 'text-red-700 dark:text-red-400' : ''}
                    ${line.isHeader ? 'text-gray-500' : 'text-gray-800 dark:text-gray-300'}
                  `}>
                    {line.content}
                  </span>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}