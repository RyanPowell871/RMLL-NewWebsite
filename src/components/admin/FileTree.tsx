/**
 * FileTree - Simple file list component for league-info files
 */

import { FileCode } from 'lucide-react';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
}

interface FileTreeProps {
  files: FileNode[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  className?: string;
}

export function FileTree({ files, selectedFile, onSelectFile, className = '' }: FileTreeProps) {
  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      <div className="p-2 space-y-0.5">
        {files.map((file) => {
          const isSelected = selectedFile === file.path;
          const ext = file.name.slice(file.name.lastIndexOf('.'));

          return (
            <button
              key={file.path}
              onClick={() => onSelectFile(file.path)}
              className={`
                w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors
                ${isSelected ? 'bg-[#013fac]/10 text-[#013fac] font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
            >
              <FileCode className={`w-4 h-4 ${['.tsx', '.jsx'].includes(ext) ? 'text-blue-500' : 'text-gray-500'}`} />
              <span className="text-sm truncate">{file.name}</span>
            </button>
          );
        })}
        {files.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No files found
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Helper function to build a tree structure from a flat file list
 * NOTE: Currently not used - files are shown as a flat list
 */
export function buildFileTree(files: Array<{ name: string; path: string; type: 'file' | 'dir' }>): FileNode[] {
  // For now, just return the files as-is since we're showing them as a flat list
  return files;
}

/**
 * Get file type icon for display
 */
export function getFileIcon(path: string) {
  const ext = path.slice(path.lastIndexOf('.'));
  if (['.tsx', '.jsx'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-blue-500" />;
  }
  return <FileCode className="w-4 h-4 text-gray-500" />;
}