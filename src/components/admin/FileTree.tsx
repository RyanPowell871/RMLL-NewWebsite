/**
 * FileTree - Recursive file tree component for browsing league-info directory
 */

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileCode,
} from 'lucide-react';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  className?: string;
}

function FileIcon({ fileName, isExpanded, type }: { fileName: string; isExpanded?: boolean; type: 'file' | 'dir' }) {
  if (type === 'dir') {
    return isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />;
  }

  const ext = fileName.slice(fileName.lastIndexOf('.'));
  if (['.tsx', '.jsx'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-blue-500" />;
  }
  return <File className="w-4 h-4 text-gray-500" />;
}

interface TreeNodeProps {
  node: FileNode;
  level: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
}

function TreeNode({ node, level, selectedFile, onSelectFile, expandedDirs, onToggleDir }: TreeNodeProps) {
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (node.type === 'dir') {
      onToggleDir(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors
          ${isSelected ? 'bg-[#013fac]/10 text-[#013fac] font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {node.type === 'dir' && (
          <span className="w-4 h-4 flex items-center justify-center text-gray-400">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
        <FileIcon fileName={node.name} isExpanded={isExpanded} type={node.type} />
        <span className="text-sm truncate">{node.name}</span>
      </button>
      {node.type === 'dir' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, selectedFile, onSelectFile, className = '' }: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      <div className="p-2 space-y-0.5">
        {files.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            level={0}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
            expandedDirs={expandedDirs}
            onToggleDir={toggleDir}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Helper function to build a tree structure from a flat file list
 */
export function buildFileTree(files: Array<{ name: string; path: string; type: 'file' | 'dir' }>): FileNode[] {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  // First pass: create all nodes
  for (const file of files) {
    const node: FileNode = { ...file };
    map.set(file.path, node);
  }

  // Second pass: build hierarchy
  for (const file of files) {
    const node = map.get(file.path)!;
    const parts = file.path.split('/');
    const parentPath = parts.slice(0, -1).join('/');

    if (parentPath && map.has(parentPath)) {
      const parent = map.get(parentPath)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else if (parts.length === 1 || (parts.length === 2 && parts[0] === 'src')) {
      // This is a top-level item
      root.push(node);
    }
  }

  // Sort: directories first, then files, alphabetically
  function sortTree(nodes: FileNode[]): void {
    nodes.sort((a, b) => {
      if (a.type === 'dir' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children) sortTree(node.children);
    });
  }

  sortTree(root);

  return root;
}

/**
 * Get file type icon for display
 */
export function getFileIcon(path: string) {
  const ext = path.slice(path.lastIndexOf('.'));
  if (['.tsx', '.jsx'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-blue-500" />;
  }
  return <File className="w-4 h-4 text-gray-500" />;
}