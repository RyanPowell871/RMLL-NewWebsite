import { forwardRef, useRef, useState } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { LinkInserter } from './LinkInserter';
import { Bold, Italic, List, ListOrdered, Link2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface TextareaWithLinkInserterProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export interface LinkInsertOptions {
  url: string;
  title?: string;
  newTab?: boolean;
}

export const TextareaWithLinkInserter = forwardRef<HTMLTextAreaElement, TextareaWithLinkInserterProps>(
  function TextareaWithLinkInserter({
    label,
    placeholder,
    value,
    onChange,
    rows = 2,
    required = false,
    id,
    name,
    className,
  }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showFormatting, setShowFormatting] = useState(false);
    const [lastCursorPos, setLastCursorPos] = useState(0);
    const [showLinkInserter, setShowLinkInserter] = useState(false);

    // Track cursor position as user types and navigates
    const handleTextareaFocus = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        setLastCursorPos(textarea.selectionStart);
      }
    };

    const handleTextareaClick = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        setLastCursorPos(textarea.selectionStart);
      }
    };

    const handleTextareaKeyUp = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        setLastCursorPos(textarea.selectionStart);
      }
    };

    // Handle link insertion from LinkInserter
    const handleInsertLink = (options: LinkInsertOptions) => {
      const currentValue = value || '';

      // Determine insertion position - use last cursor position, or append to end if text exists
      let position = lastCursorPos;
      if (position === 0 && currentValue.length > 0) {
        position = currentValue.length;
      }

      // Build markdown: [text](url) or [text](url "_blank")
      const linkText = options.title || options.url;
      const targetAttr = options.newTab ? ' "_blank"' : '';
      const markdown = `[${linkText}](${options.url}${targetAttr})`;

      const newValue = currentValue.substring(0, position) + markdown + currentValue.substring(position);
      onChange?.(newValue);
      setShowLinkInserter(false);

      // Set cursor position after inserted text
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          const newPos = position + markdown.length;
          textarea.setSelectionRange(newPos, newPos);
          textarea.focus();
          setLastCursorPos(newPos);
        }
      }, 50);
    };

    // Handle toolbar actions
    const handleFormat = (format: 'bold' | 'italic' | 'ul' | 'ol') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const currentValue = value || '';
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = currentValue.substring(start, end);

      let formattedText = '';
      switch (format) {
        case 'bold':
          formattedText = `**${selectedText || 'bold text'}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText || 'italic text'}*`;
          break;
        case 'ul':
          formattedText = selectedText
            ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
            : '- list item';
          break;
        case 'ol':
          formattedText = selectedText
            ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
            : '1. list item';
          break;
      }

      const newValue = currentValue.substring(0, start) + formattedText + currentValue.substring(end);
      onChange?.(newValue);
      setShowFormatting(false);

      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
        textarea.focus();
      }, 0);
    };

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id || name} className="flex items-center gap-2">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-gray-50 border border-gray-200 rounded-t-lg rounded-b-none border-b-0">
          <LinkInserter
            open={showLinkInserter}
            onOpenChange={setShowLinkInserter}
            onInsert={handleInsertLink}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowLinkInserter(true)}
                title="Insert Link"
              >
                <Link2 className="w-4 h-4" />
              </Button>
            }
          />

          <Popover open={showFormatting} onOpenChange={setShowFormatting}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" title="Text Formatting">
                <List className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1" align="start">
              <div className="grid grid-cols-2 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat('bold')}
                  className="h-8 text-xs"
                >
                  <Bold className="w-3 h-3 mr-1.5" />
                  Bold
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat('italic')}
                  className="h-8 text-xs"
                >
                  <Italic className="w-3 h-3 mr-1.5" />
                  Italic
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat('ul')}
                  className="h-8 text-xs"
                >
                  <List className="w-3 h-3 mr-1.5" />
                  Bullet
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat('ol')}
                  className="h-8 text-xs"
                >
                  <ListOrdered className="w-3 h-3 mr-1.5" />
                  Numbered
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Textarea */}
        <Textarea
          id={id}
          name={name}
          ref={(el) => {
            if (typeof ref === 'function') ref(el);
            else if (ref) ref.current = el;
            textareaRef.current = el;
          }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={handleTextareaFocus}
          onClick={handleTextareaClick}
          onKeyUp={handleTextareaKeyUp}
          rows={rows}
          className={`${className || ''} rounded-t-none border-t-0`}
        />
      </div>
    );
  }
);