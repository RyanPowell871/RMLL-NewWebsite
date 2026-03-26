/**
 * LeagueInfoContentEditor
 * 
 * CMS editor for structured League Info page content.
 * Allows admins to edit individual blocks within each page's sections.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Save, RotateCcw, Plus, Trash2, ChevronDown, ChevronRight,
  GripVertical, Eye, Edit3, X, Copy, ArrowUp, ArrowDown,
  AlertTriangle, CheckCircle, Loader2, Settings2, Palette
} from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getPageDefaults, getEditablePages } from '../../utils/page-defaults';
import { BLOCK_TYPE_LABELS, ALL_BLOCK_TYPES } from '../../utils/page-content-types';
import type {
  PageContentSchema, ContentSection, ContentBlock,
  ParagraphBlock, HeadingBlock, ListBlock, CardGridBlock,
  InfoBoxBlock, ContactTableBlock, TableBlock, ChampionshipListBlock,
  LetteredListBlock, StepsBlock, LinkListBlock, BlockquoteBlock,
  HeroBlock, ButtonLinkBlock, KeyValueBlock
} from '../../utils/page-content-types';

// ─── Page Selector ───

function PageSelector({
  pages,
  selectedPage,
  onSelect,
  overriddenPages,
}: {
  pages: { id: string; title: string }[];
  selectedPage: string;
  onSelect: (id: string) => void;
  overriddenPages: Set<string>;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-700">League Info Pages</h3>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => onSelect(page.id)}
            className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 flex items-center gap-2 transition-colors ${
              selectedPage === page.id
                ? 'bg-blue-50 text-blue-900 font-semibold'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate">{page.title}</span>
            {overriddenPages.has(page.id) && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-green-500" title="Has custom content" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Block Editors ───

function ParagraphEditor({ block, onChange }: { block: ParagraphBlock; onChange: (b: ParagraphBlock) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">Text (HTML supported)</label>
      <textarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

function HeadingEditor({ block, onChange }: { block: HeadingBlock; onChange: (b: HeadingBlock) => void }) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="block text-xs font-semibold text-gray-500 mb-1">Heading Text</label>
        <input
          type="text"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="w-24">
        <label className="block text-xs font-semibold text-gray-500 mb-1">Level</label>
        <select
          value={block.level}
          onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 2 | 3 | 4 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value={2}>H2</option>
          <option value={3}>H3</option>
          <option value={4}>H4</option>
        </select>
      </div>
    </div>
  );
}

function BlockquoteEditor({ block, onChange }: { block: BlockquoteBlock; onChange: (b: BlockquoteBlock) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">Quote Text (HTML supported)</label>
      <textarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function HeroEditor({ block, onChange }: { block: HeroBlock; onChange: (b: HeroBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
          <input type="text" value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Icon (lucide name)</label>
          <input type="text" value={block.icon || ''} onChange={(e) => onChange({ ...block, icon: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Shield" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Subtitle (HTML supported)</label>
        <textarea value={block.subtitle || ''} onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
          rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="w-40">
        <label className="block text-xs font-semibold text-gray-500 mb-1">Accent Color</label>
        <input type="text" value={block.accentColor || '#013fac'} onChange={(e) => onChange({ ...block, accentColor: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
    </div>
  );
}

function ListEditor({ block, onChange }: { block: ListBlock; onChange: (b: ListBlock) => void }) {
  const updateItem = (index: number, value: string) => {
    const items = [...block.items];
    items[index] = value;
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, ''] });
  const removeItem = (index: number) => onChange({ ...block, items: block.items.filter((_, i) => i !== index) });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500">List Items</label>
        <label className="flex items-center gap-1 text-xs text-gray-500">
          <input type="checkbox" checked={block.ordered || false} onChange={(e) => onChange({ ...block, ordered: e.target.checked })} />
          Ordered
        </label>
      </div>
      {block.items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input type="text" value={item} onChange={(e) => updateItem(i, e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm" />
          <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 px-1"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Item
      </button>
    </div>
  );
}

function LetteredListEditor({ block, onChange }: { block: LetteredListBlock; onChange: (b: LetteredListBlock) => void }) {
  const updateItem = (index: number, field: 'letter' | 'text', value: string) => {
    const items = [...block.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, { letter: String.fromCharCode(65 + block.items.length), text: '' }] });
  const removeItem = (index: number) => onChange({ ...block, items: block.items.filter((_, i) => i !== index) });

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500">Lettered Items</label>
      {block.items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input type="text" value={item.letter} onChange={(e) => updateItem(i, 'letter', e.target.value)}
            className="w-12 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-center font-bold" />
          <textarea value={item.text} onChange={(e) => updateItem(i, 'text', e.target.value)}
            rows={2} className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm" />
          <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 px-1 mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Item
      </button>
    </div>
  );
}

function StepsEditor({ block, onChange }: { block: StepsBlock; onChange: (b: StepsBlock) => void }) {
  const updateItem = (index: number, field: string, value: any) => {
    const items = [...block.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, { step: block.items.length + 1, title: '', description: '' }] });
  const removeItem = (index: number) => {
    const items = block.items.filter((_, i) => i !== index).map((item, i) => ({ ...item, step: i + 1 }));
    onChange({ ...block, items });
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-gray-500">Steps</label>
      {block.items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Step {item.step}</span>
            <input type="text" value={item.title} onChange={(e) => updateItem(i, 'title', e.target.value)}
              placeholder="Step title" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-semibold" />
            <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <textarea value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
            rows={2} placeholder="Step description" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Step
      </button>
    </div>
  );
}

function CardGridEditor({ block, onChange }: { block: CardGridBlock; onChange: (b: CardGridBlock) => void }) {
  const updateCard = (index: number, field: string, value: any) => {
    const items = [...block.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...block, items });
  };
  const addCard = () => onChange({ ...block, items: [...block.items, { title: '', description: '', icon: 'FileText', color: 'blue' as const }] });
  const removeCard = (index: number) => onChange({ ...block, items: block.items.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-gray-500">Cards</label>
        <select value={block.columns || 2} onChange={(e) => onChange({ ...block, columns: Number(e.target.value) as 1 | 2 | 3 })}
          className="px-2 py-1 border border-gray-300 rounded text-xs">
          <option value={1}>1 Column</option>
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns</option>
        </select>
      </div>
      {block.items.map((card, i) => (
        <div key={i} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex gap-2">
            <input type="text" value={card.title} onChange={(e) => updateCard(i, 'title', e.target.value)}
              placeholder="Title" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-semibold" />
            <input type="text" value={card.icon || ''} onChange={(e) => updateCard(i, 'icon', e.target.value)}
              placeholder="Icon" className="w-24 px-2 py-1 border border-gray-300 rounded text-sm" />
            <select value={card.color || 'blue'} onChange={(e) => updateCard(i, 'color', e.target.value)}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm">
              <option value="blue">Blue</option><option value="red">Red</option>
              <option value="green">Green</option><option value="purple">Purple</option>
              <option value="amber">Amber</option><option value="gray">Gray</option>
            </select>
            <button onClick={() => removeCard(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <textarea value={card.description} onChange={(e) => updateCard(i, 'description', e.target.value)}
            rows={2} placeholder="Description" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
        </div>
      ))}
      <button onClick={addCard} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Card
      </button>
    </div>
  );
}

function LinkListEditor({ block, onChange }: { block: LinkListBlock; onChange: (b: LinkListBlock) => void }) {
  const updateLink = (index: number, field: string, value: string) => {
    const items = [...block.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...block, items });
  };
  const addLink = () => onChange({ ...block, items: [...block.items, { label: '', url: '', description: '' }] });
  const removeLink = (index: number) => onChange({ ...block, items: block.items.filter((_, i) => i !== index) });

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500">Links</label>
      {block.items.map((link, i) => (
        <div key={i} className="border border-gray-200 rounded p-2 space-y-1">
          <div className="flex gap-2">
            <input type="text" value={link.label} onChange={(e) => updateLink(i, 'label', e.target.value)}
              placeholder="Label" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
            <input type="text" value={link.url} onChange={(e) => updateLink(i, 'url', e.target.value)}
              placeholder="URL" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
            <button onClick={() => removeLink(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <input type="text" value={link.description || ''} onChange={(e) => updateLink(i, 'description', e.target.value)}
            placeholder="Description (optional)" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
        </div>
      ))}
      <button onClick={addLink} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Link
      </button>
    </div>
  );
}

function TableEditor({ block, onChange }: { block: TableBlock; onChange: (b: TableBlock) => void }) {
  const updateHeader = (index: number, value: string) => {
    const headers = [...block.headers];
    headers[index] = value;
    onChange({ ...block, headers });
  };
  const updateCell = (row: number, col: number, value: string) => {
    const rows = block.rows.map(r => [...r]);
    rows[row][col] = value;
    onChange({ ...block, rows });
  };
  const addRow = () => onChange({ ...block, rows: [...block.rows, block.headers.map(() => '')] });
  const removeRow = (index: number) => onChange({ ...block, rows: block.rows.filter((_, i) => i !== index) });
  const addColumn = () => {
    onChange({
      ...block,
      headers: [...block.headers, ''],
      rows: block.rows.map(r => [...r, '']),
    });
  };
  const removeColumn = (index: number) => {
    onChange({
      ...block,
      headers: block.headers.filter((_, i) => i !== index),
      rows: block.rows.map(r => r.filter((_, i) => i !== index)),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-gray-500">Table</label>
        <input type="text" value={block.title || ''} onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Table title (optional)" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs border border-gray-300">
          <thead>
            <tr>
              {block.headers.map((h, i) => (
                <th key={i} className="border border-gray-300 p-1">
                  <div className="flex items-center gap-1">
                    <input type="text" value={h} onChange={(e) => updateHeader(i, e.target.value)}
                      className="w-20 px-1 py-0.5 border border-gray-200 rounded text-xs" />
                    <button onClick={() => removeColumn(i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                  </div>
                </th>
              ))}
              <th className="border border-gray-300 p-1">
                <button onClick={addColumn} className="text-blue-500 hover:text-blue-700 text-xs">+Col</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-gray-300 p-1">
                    <input type="text" value={cell} onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="w-20 px-1 py-0.5 border border-gray-200 rounded text-xs" />
                  </td>
                ))}
                <td className="border border-gray-300 p-1">
                  <button onClick={() => removeRow(ri)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button onClick={addRow} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Row
        </button>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Note (optional)</label>
        <input type="text" value={block.note || ''} onChange={(e) => onChange({ ...block, note: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
      </div>
    </div>
  );
}

function ChampionshipListEditor({ block, onChange }: { block: ChampionshipListBlock; onChange: (b: ChampionshipListBlock) => void }) {
  const updateItem = (index: number, field: string, value: any) => {
    const items = [...block.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, { year: '', detail: '', highlight: false }] });
  const removeItem = (index: number) => onChange({ ...block, items: block.items.filter((_, i) => i !== index) });

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500">Championship List</label>
      {block.items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input type="text" value={item.year} onChange={(e) => updateItem(i, 'year', e.target.value)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm font-mono" placeholder="Year" />
          <input type="text" value={item.detail} onChange={(e) => updateItem(i, 'detail', e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Detail" />
          <label className="flex items-center gap-1 text-xs shrink-0">
            <input type="checkbox" checked={item.highlight || false} onChange={(e) => updateItem(i, 'highlight', e.target.checked)} />
            Win
          </label>
          <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Entry
      </button>
    </div>
  );
}

function InfoBoxEditor({ block, onChange }: { block: InfoBoxBlock; onChange: (b: InfoBoxBlock) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Title (optional)</label>
          <input type="text" value={block.title || ''} onChange={(e) => onChange({ ...block, title: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
        </div>
        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Variant</label>
          <select value={block.variant || 'info'} onChange={(e) => onChange({ ...block, variant: e.target.value as any })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Content (HTML)</label>
        <textarea value={block.content} onChange={(e) => onChange({ ...block, content: e.target.value })}
          rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono" />
      </div>
    </div>
  );
}

function ContactTableEditor({ block, onChange }: { block: ContactTableBlock; onChange: (b: ContactTableBlock) => void }) {
  const updateItem = (index: number, field: string, value: string) => {
    const items = [...block.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, { position: '', name: '', email: '' }] });
  const removeItem = (index: number) => onChange({ ...block, items: block.items.filter((_, i) => i !== index) });

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500">Contacts</label>
      {block.items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input type="text" value={item.position} onChange={(e) => updateItem(i, 'position', e.target.value)}
            placeholder="Position" className="w-40 px-2 py-1 border border-gray-300 rounded text-sm" />
          <input type="text" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)}
            placeholder="Name" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
          <input type="text" value={item.email || ''} onChange={(e) => updateItem(i, 'email', e.target.value)}
            placeholder="Email" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
          <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Contact
      </button>
    </div>
  );
}

function ButtonLinkEditor({ block, onChange }: { block: ButtonLinkBlock; onChange: (b: ButtonLinkBlock) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Label</label>
        <input type="text" value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">URL</label>
        <input type="text" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Sub-label (optional)</label>
        <input type="text" value={block.sublabel || ''} onChange={(e) => onChange({ ...block, sublabel: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Icon</label>
        <input type="text" value={block.icon || ''} onChange={(e) => onChange({ ...block, icon: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="ExternalLink" />
      </div>
    </div>
  );
}

function KeyValueEditor({ block, onChange }: { block: KeyValueBlock; onChange: (b: KeyValueBlock) => void }) {
  const updateItem = (index: number, field: string, value: string) => {
    const items = [...block.items];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, { label: '', value: '', icon: '' }] });
  const removeItem = (index: number) => onChange({ ...block, items: block.items.filter((_, i) => i !== index) });

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500">Key-Value Pairs</label>
      {block.items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input type="text" value={item.icon || ''} onChange={(e) => updateItem(i, 'icon', e.target.value)}
            placeholder="Icon" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
          <input type="text" value={item.label} onChange={(e) => updateItem(i, 'label', e.target.value)}
            placeholder="Label" className="w-24 px-2 py-1 border border-gray-300 rounded text-sm font-semibold" />
          <input type="text" value={item.value} onChange={(e) => updateItem(i, 'value', e.target.value)}
            placeholder="Value (HTML)" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
          <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Pair
      </button>
    </div>
  );
}

// ─── Block Editor Dispatcher ───

function BlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
  switch (block.type) {
    case 'hero': return <HeroEditor block={block} onChange={onChange as any} />;
    case 'paragraph': return <ParagraphEditor block={block} onChange={onChange as any} />;
    case 'heading': return <HeadingEditor block={block} onChange={onChange as any} />;
    case 'blockquote': return <BlockquoteEditor block={block} onChange={onChange as any} />;
    case 'list': return <ListEditor block={block} onChange={onChange as any} />;
    case 'lettered-list': return <LetteredListEditor block={block} onChange={onChange as any} />;
    case 'steps': return <StepsEditor block={block} onChange={onChange as any} />;
    case 'card-grid': return <CardGridEditor block={block} onChange={onChange as any} />;
    case 'link-list': return <LinkListEditor block={block} onChange={onChange as any} />;
    case 'table': return <TableEditor block={block} onChange={onChange as any} />;
    case 'championship-list': return <ChampionshipListEditor block={block} onChange={onChange as any} />;
    case 'info-box': return <InfoBoxEditor block={block} onChange={onChange as any} />;
    case 'contact-table': return <ContactTableEditor block={block} onChange={onChange as any} />;
    case 'button-link': return <ButtonLinkEditor block={block} onChange={onChange as any} />;
    case 'key-value': return <KeyValueEditor block={block} onChange={onChange as any} />;
    case 'divider': return <p className="text-xs text-gray-400 italic">Horizontal divider — no settings</p>;
    default: return <p className="text-xs text-red-500">Unknown block type: {(block as any).type}</p>;
  }
}

// ─── Create default block for a given type ───

function createDefaultBlock(type: ContentBlock['type']): ContentBlock {
  switch (type) {
    case 'hero': return { type: 'hero', title: '', icon: 'FileText' };
    case 'paragraph': return { type: 'paragraph', text: '' };
    case 'heading': return { type: 'heading', text: '', level: 2 };
    case 'blockquote': return { type: 'blockquote', text: '' };
    case 'list': return { type: 'list', items: [''] };
    case 'lettered-list': return { type: 'lettered-list', items: [{ letter: 'A', text: '' }] };
    case 'steps': return { type: 'steps', items: [{ step: 1, title: '', description: '' }] };
    case 'card-grid': return { type: 'card-grid', columns: 2, items: [{ title: '', description: '', icon: 'FileText', color: 'blue' }] };
    case 'link-list': return { type: 'link-list', items: [{ label: '', url: '' }] };
    case 'table': return { type: 'table', headers: ['Column 1'], rows: [['']] };
    case 'championship-list': return { type: 'championship-list', items: [{ year: '', detail: '' }] };
    case 'info-box': return { type: 'info-box', content: '', variant: 'info' };
    case 'contact-table': return { type: 'contact-table', items: [{ position: '', name: '', email: '' }] };
    case 'divider': return { type: 'divider' };
    case 'button-link': return { type: 'button-link', label: '', url: '', icon: 'ExternalLink' };
    case 'key-value': return { type: 'key-value', items: [{ label: '', value: '' }] };
    default: return { type: 'paragraph', text: '' };
  }
}

// ─── Section Editor ───

function SectionEditor({
  section,
  sectionIndex,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  section: ContentSection;
  sectionIndex: number;
  onChange: (s: ContentSection) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);

  const updateBlock = (blockIndex: number, block: ContentBlock) => {
    const blocks = [...section.blocks];
    blocks[blockIndex] = block;
    onChange({ ...section, blocks });
  };

  const deleteBlock = (blockIndex: number) => {
    onChange({ ...section, blocks: section.blocks.filter((_, i) => i !== blockIndex) });
  };

  const moveBlock = (blockIndex: number, direction: -1 | 1) => {
    const blocks = [...section.blocks];
    const targetIndex = blockIndex + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [blocks[blockIndex], blocks[targetIndex]] = [blocks[targetIndex], blocks[blockIndex]];
    onChange({ ...section, blocks });
  };

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock = createDefaultBlock(type);
    onChange({ ...section, blocks: [...section.blocks, newBlock] });
    setShowAddBlock(false);
  };

  const duplicateBlock = (blockIndex: number) => {
    const blocks = [...section.blocks];
    blocks.splice(blockIndex + 1, 0, JSON.parse(JSON.stringify(blocks[blockIndex])));
    onChange({ ...section, blocks });
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Section Header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-700">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            className="font-bold text-gray-900 bg-transparent border-none outline-none text-sm w-full"
            placeholder="Section title"
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">{section.blocks.length} blocks</span>
        <div className="flex items-center gap-1 shrink-0">
          {section.collapsible !== undefined && (
            <label className="flex items-center gap-1 text-xs text-gray-500 mr-2">
              <input type="checkbox" checked={section.collapsible || false}
                onChange={(e) => onChange({ ...section, collapsible: e.target.checked })} />
              Collapse
            </label>
          )}
          <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Section Settings (collapsible section properties) */}
      {expanded && (
        <>
          <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">ID:</label>
              <input type="text" value={section.id} onChange={(e) => onChange({ ...section, id: e.target.value })}
                className="px-2 py-0.5 border border-gray-200 rounded text-xs w-32" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Icon:</label>
              <input type="text" value={section.icon || ''} onChange={(e) => onChange({ ...section, icon: e.target.value })}
                className="px-2 py-0.5 border border-gray-200 rounded text-xs w-24" placeholder="none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Color:</label>
              <input type="text" value={section.accentColor || ''} onChange={(e) => onChange({ ...section, accentColor: e.target.value })}
                className="px-2 py-0.5 border border-gray-200 rounded text-xs w-20" placeholder="#013fac" />
            </div>
            <label className="flex items-center gap-1 text-xs text-gray-500">
              <input type="checkbox" checked={section.collapsible || false}
                onChange={(e) => onChange({ ...section, collapsible: e.target.checked })} />
              Collapsible
            </label>
            {section.collapsible && (
              <label className="flex items-center gap-1 text-xs text-gray-500">
                <input type="checkbox" checked={section.defaultOpen || false}
                  onChange={(e) => onChange({ ...section, defaultOpen: e.target.checked })} />
                Default open
              </label>
            )}
          </div>

          {/* Blocks */}
          <div className="p-4 space-y-3">
            {section.blocks.map((block, bi) => (
              <div key={bi} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b border-gray-200">
                  <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                  <span className="text-xs font-bold text-gray-500 uppercase">{BLOCK_TYPE_LABELS[block.type] || block.type}</span>
                  <div className="flex-1" />
                  <button onClick={() => moveBlock(bi, -1)} disabled={bi === 0} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveBlock(bi, 1)} disabled={bi === section.blocks.length - 1} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button onClick={() => duplicateBlock(bi)} className="p-0.5 text-gray-400 hover:text-gray-600" title="Duplicate">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteBlock(bi)} className="p-0.5 text-red-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-3">
                  <BlockEditor block={block} onChange={(b) => updateBlock(bi, b)} />
                </div>
              </div>
            ))}

            {/* Add Block */}
            {showAddBlock ? (
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/30">
                <p className="text-xs font-semibold text-gray-600 mb-2">Select block type to add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_BLOCK_TYPES.map((type) => (
                    <button key={type} onClick={() => addBlock(type)}
                      className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-blue-50 hover:border-blue-400 transition-colors">
                      {BLOCK_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowAddBlock(false)} className="mt-2 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowAddBlock(true)}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Add Block
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Editor Component ───

export function LeagueInfoContentEditor() {
  const pages = useMemo(() => getEditablePages(), []);
  const [selectedPage, setSelectedPage] = useState(pages[0]?.id || '');
  const [schema, setSchema] = useState<PageContentSchema | null>(null);
  const [originalSchema, setOriginalSchema] = useState<PageContentSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [overriddenPages, setOverriddenPages] = useState<Set<string>>(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBulkResetDialog, setShowBulkResetDialog] = useState(false);
  const [bulkResetPages, setBulkResetPages] = useState<any[]>([]);
  const [loadingBulkReset, setLoadingBulkReset] = useState(false);

  // Load the list of pages that have overrides
  const loadOverridesList = useCallback(async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/structured-content-list`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setOverriddenPages(new Set((data.pages || []).map((p: any) => p.pageId)));
      }
    } catch (err) {
      console.error('Failed to load overrides list:', err);
    }
  }, []);

  useEffect(() => { loadOverridesList(); }, [loadOverridesList]);

  // Load content for the selected page
  const loadPageContent = useCallback(async (pageId: string) => {
    setLoading(true);
    try {
      // First, load any KV overrides
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/structured-content/${pageId}`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );

      const defaults = getPageDefaults(pageId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.content && data.hasOverride) {
          // Use the KV override merged with defaults
          const merged = defaults
            ? { ...defaults, ...data.content, sections: data.content.sections || defaults.sections }
            : data.content as PageContentSchema;
          setSchema(JSON.parse(JSON.stringify(merged)));
          setOriginalSchema(JSON.parse(JSON.stringify(merged)));
        } else if (defaults) {
          // No override — use defaults
          setSchema(JSON.parse(JSON.stringify(defaults)));
          setOriginalSchema(JSON.parse(JSON.stringify(defaults)));
        } else {
          // No defaults and no override — create empty schema
          const empty: PageContentSchema = {
            pageId,
            title: pageId,
            sections: [],
          };
          setSchema(empty);
          setOriginalSchema(JSON.parse(JSON.stringify(empty)));
        }
      } else if (defaults) {
        setSchema(JSON.parse(JSON.stringify(defaults)));
        setOriginalSchema(JSON.parse(JSON.stringify(defaults)));
      }

      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load page content:', err);
      const defaults = getPageDefaults(pageId);
      if (defaults) {
        setSchema(JSON.parse(JSON.stringify(defaults)));
        setOriginalSchema(JSON.parse(JSON.stringify(defaults)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPage) loadPageContent(selectedPage);
  }, [selectedPage, loadPageContent]);

  // Track changes
  useEffect(() => {
    if (schema && originalSchema) {
      setHasChanges(JSON.stringify(schema) !== JSON.stringify(originalSchema));
    }
  }, [schema, originalSchema]);

  // Save to KV
  const handleSave = async () => {
    if (!schema) return;
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/structured-content/${schema.pageId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: schema.title,
            sections: schema.sections,
          }),
        }
      );

      if (response.ok) {
        toast.success('Content saved successfully');
        setOriginalSchema(JSON.parse(JSON.stringify(schema)));
        setHasChanges(false);
        loadOverridesList();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(`Failed to save: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/structured-content/${selectedPage}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resetToDefault: true }),
        }
      );

      if (response.ok) {
        toast.success('Reset to default content');
        await loadPageContent(selectedPage);
        loadOverridesList();
      } else {
        toast.error('Failed to reset');
      }
    } catch (err) {
      toast.error('Failed to reset');
    } finally {
      setSaving(false);
      setShowResetConfirm(false);
    }
  };

  // Discard changes
  const handleDiscard = () => {
    if (originalSchema) {
      setSchema(JSON.parse(JSON.stringify(originalSchema)));
      setHasChanges(false);
    }
  };

  // Load bulk reset dialog with list of overridden pages
  const handleShowBulkReset = async () => {
    setLoadingBulkReset(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/structured-content-list`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setBulkResetPages(data.pages || []);
        if ((data.pages || []).length > 0) {
          setShowBulkResetDialog(true);
        } else {
          toast.info('No pages with custom content to reset');
        }
      }
    } catch (err) {
      console.error('Failed to load override list:', err);
      toast.error('Failed to load pages');
    } finally {
      setLoadingBulkReset(false);
    }
  };

  // Perform bulk reset of all pages
  const handleBulkReset = async () => {
    setLoadingBulkReset(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/structured-content/reset-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Reset ${data.pagesReset.length} pages to defaults`);
        setBulkResetPages([]);
        setShowBulkResetDialog(false);
        loadOverridesList();
        // Reload current page if it was reset
        if (schema && data.pagesReset.includes(schema.pageId)) {
          await loadPageContent(schema.pageId);
        }
      } else {
        toast.error('Failed to reset pages');
      }
    } catch (err) {
      console.error('Bulk reset error:', err);
      toast.error('Failed to reset pages');
    } finally {
      setLoadingBulkReset(false);
    }
  };

  // Section operations
  const updateSection = (index: number, section: ContentSection) => {
    if (!schema) return;
    const sections = [...schema.sections];
    sections[index] = section;
    setSchema({ ...schema, sections });
  };

  const deleteSection = (index: number) => {
    if (!schema) return;
    setSchema({ ...schema, sections: schema.sections.filter((_, i) => i !== index) });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    if (!schema) return;
    const sections = [...schema.sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
    setSchema({ ...schema, sections });
  };

  const addSection = () => {
    if (!schema) return;
    const newSection: ContentSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      blocks: [],
    };
    setSchema({ ...schema, sections: [...schema.sections, newSection] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">League Info Content</h2>
          <p className="text-gray-600 dark:text-gray-400">Edit structured content for League Information pages</p>
        </div>
        <div className="flex items-center gap-2">
          {overriddenPages.size > 0 && (
            <Button variant="outline" onClick={handleShowBulkReset} disabled={loadingBulkReset}>
              {loadingBulkReset ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
              Reset All ({overriddenPages.size})
            </Button>
          )}
          {hasChanges && (
            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Unsaved changes
            </span>
          )}
          <Button variant="outline" onClick={handleDiscard} disabled={!hasChanges}>
            Discard
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-[#013fac] hover:bg-[#0149c9]"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      {/* Layout: Sidebar + Editor */}
      <div className="flex gap-6">
        {/* Page Selector Sidebar */}
        <div className="w-64 shrink-0">
          <PageSelector
            pages={pages}
            selectedPage={selectedPage}
            onSelect={setSelectedPage}
            overriddenPages={overriddenPages}
          />
          {overriddenPages.has(selectedPage) && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full mt-2 px-3 py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Reset to Default
            </button>
          )}
        </div>

        {/* Main Editor */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : schema ? (
            <div className="space-y-4">
              {/* Page Title */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Page Title</label>
                <input
                  type="text"
                  value={schema.title}
                  onChange={(e) => setSchema({ ...schema, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Sections */}
              {schema.sections.map((section, si) => (
                <SectionEditor
                  key={`${section.id}-${si}`}
                  section={section}
                  sectionIndex={si}
                  onChange={(s) => updateSection(si, s)}
                  onDelete={() => deleteSection(si)}
                  onMoveUp={() => moveSection(si, -1)}
                  onMoveDown={() => moveSection(si, 1)}
                  isFirst={si === 0}
                  isLast={si === schema.sections.length - 1}
                />
              ))}

              {/* Add Section */}
              <button onClick={addSection}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              Select a page to edit
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirm Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset to Default?</DialogTitle>
            <DialogDescription>
              This will remove all custom content edits for this page and restore the built-in defaults. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Reset to Default
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Reset Dialog */}
      <Dialog open={showBulkResetDialog} onOpenChange={setShowBulkResetDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reset All Pages to Defaults?</DialogTitle>
            <DialogDescription>
              This will remove custom content from {bulkResetPages.length} page(s) and restore the built-in defaults. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {bulkResetPages.length > 0 && (
            <div className="my-4 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Pages to be reset:</p>
              <ul className="text-sm space-y-1">
                {bulkResetPages.map((page, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>{page.title}</span>
                    <span className="text-xs text-gray-400">({page.pageId})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowBulkResetDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkReset} className="bg-red-600 hover:bg-red-700 text-white">
              {loadingBulkReset ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Reset All {bulkResetPages.length} Pages
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}