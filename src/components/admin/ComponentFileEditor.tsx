/**
 * Component File Editor - Direct Code Editor with Git Integration
 *
 * This component provides a code editor for editing React component files directly
 * with full Git version control (commit history, diffs, rollback, deploy).
 */

import { Code, FileText } from 'lucide-react';
import { DirectCodeEditor } from './DirectCodeEditor';

export function ComponentFileEditor() {
  return (
    <div className="h-full flex flex-col">
      <DirectCodeEditor />
    </div>
  );
}