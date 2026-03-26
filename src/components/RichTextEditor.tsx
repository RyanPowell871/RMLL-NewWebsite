import { useEffect, useRef } from 'react';
import { Label } from './ui/label';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  id?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  label, 
  placeholder = 'Start writing...',
  id = 'editor'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const formatButton = (title: string, command: string, icon: string) => (
    <button
      type="button"
      onClick={() => execCommand(command)}
      className="p-2 hover:bg-gray-100 rounded transition-colors"
      title={title}
      aria-label={title}
    >
      {icon}
    </button>
  );

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
          {formatButton('Bold', 'bold', <span className="font-bold">B</span>)}
          {formatButton('Italic', 'italic', <span className="italic">I</span>)}
          {formatButton('Underline', 'underline', <span className="underline">U</span>)}
          
          <div className="w-px bg-gray-300 mx-1"></div>
          
          {formatButton('Heading 1', 'formatBlock', <span className="font-bold">H1</span>)}
          {formatButton('Heading 2', 'formatBlock', <span className="font-bold">H2</span>)}
          {formatButton('Heading 3', 'formatBlock', <span className="font-bold">H3</span>)}
          
          <div className="w-px bg-gray-300 mx-1"></div>
          
          {formatButton('Bullet List', 'insertUnorderedList', '• List')}
          {formatButton('Numbered List', 'insertOrderedList', '1. List')}
          
          <div className="w-px bg-gray-300 mx-1"></div>
          
          <button
            type="button"
            onClick={() => {
              const url = prompt('Enter link URL:');
              if (url) execCommand('createLink', url);
            }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Insert Link"
            aria-label="Insert Link"
          >
            <span className="text-blue-600 underline">Link</span>
          </button>
          
          <button
            type="button"
            onClick={() => execCommand('unlink')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Remove Link"
            aria-label="Remove Link"
          >
            <span className="text-gray-600">⛓️‍💥</span>
          </button>
          
          <div className="w-px bg-gray-300 mx-1"></div>
          
          {formatButton('Align Left', 'justifyLeft', '⬅️')}
          {formatButton('Align Center', 'justifyCenter', '↔️')}
          {formatButton('Align Right', 'justifyRight', '➡️')}
          
          <div className="w-px bg-gray-300 mx-1"></div>
          
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all formatting?')) {
                execCommand('removeFormat');
              }
            }}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-red-600"
            title="Clear Formatting"
            aria-label="Clear Formatting"
          >
            ✕
          </button>
        </div>

        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[300px] p-4 focus:outline-none prose prose-sm max-w-none"
          data-placeholder={placeholder}
          id={id}
          style={{
            // Show placeholder when empty
            ...((!value || value === '') && {
              position: 'relative',
            })
          }}
        />
      </div>
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
        }
        [contenteditable] {
          outline: none;
        }
        [contenteditable]:focus {
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
        }
      `}</style>
    </div>
  );
}
