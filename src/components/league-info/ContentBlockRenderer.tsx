/**
 * ContentBlockRenderer
 * 
 * Renders structured content blocks into styled React components
 * matching the existing League Info page visual style.
 */
import { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, Trophy, Shield, Star, Heart, Target, Users,
  Handshake, History, Award, Landmark, BookOpen, ExternalLink, Info,
  AlertTriangle, CheckCircle, Briefcase, Scale, Wrench, FileText,
  Mail, MapPin, Phone, Calendar, Clock, DollarSign, Palette,
  ClipboardList, GraduationCap, Megaphone, Globe, ArrowRight,
  Folder, type LucideIcon
} from 'lucide-react';
import type {
  ContentBlock, ContentSection, PageContentSchema,
  HeroBlock, ParagraphBlock, HeadingBlock, BlockquoteBlock,
  ListBlock, LetteredListBlock, StepsBlock, CardGridBlock,
  LinkListBlock, TableBlock, ChampionshipListBlock, InfoBoxBlock,
  ContactTableBlock, DividerBlock, ButtonLinkBlock, KeyValueBlock
} from '../../utils/page-content-types';

// ─── Icon Registry ───
const ICON_MAP: Record<string, LucideIcon> = {
  Shield, Star, Heart, Target, Users, Handshake, History, Award, Landmark,
  BookOpen, ExternalLink, Info, AlertTriangle, CheckCircle, Briefcase,
  Scale, Wrench, FileText, Mail, MapPin, Phone, Calendar, Clock,
  DollarSign, Palette, ClipboardList, GraduationCap, Megaphone,
  Globe, ArrowRight, Trophy, ChevronDown, ChevronRight, Folder,
};

function getIcon(name?: string): LucideIcon {
  if (!name) return FileText;
  return ICON_MAP[name] || FileText;
}

// ─── Block Renderers ───

function RenderHero({ block }: { block: HeroBlock }) {
  const Icon = getIcon(block.icon);
  const accent = block.accentColor || '#013fac';
  return (
    <div className="bg-gradient-to-br from-[#013fac]/5 via-white to-red-50 border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-lg shadow-md" style={{ backgroundColor: accent }}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{block.title}</h2>
          <div className="h-1 w-20 rounded" style={{ backgroundColor: accent }}></div>
        </div>
      </div>
      {block.subtitle && (
        <p
          className="text-sm sm:text-base text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: block.subtitle }}
        />
      )}
    </div>
  );
}

function RenderParagraph({ block }: { block: ParagraphBlock }) {
  return (
    <p
      className="text-sm sm:text-base text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: block.text }}
    />
  );
}

function RenderHeading({ block }: { block: HeadingBlock }) {
  const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
  const classes = {
    2: 'text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b-2 border-[#013fac]',
    3: 'text-base sm:text-lg font-bold text-gray-900 mt-4 mb-2',
    4: 'text-sm sm:text-base font-bold text-gray-800 mt-3 mb-1.5',
  };
  return <Tag className={classes[block.level]}>{block.text}</Tag>;
}

function RenderBlockquote({ block }: { block: BlockquoteBlock }) {
  return (
    <blockquote className="border-l-4 border-[#013fac] bg-blue-50 pl-5 pr-4 py-3 my-4 rounded-r-lg">
      <div
        className="text-sm sm:text-base text-gray-800 leading-relaxed italic"
        dangerouslySetInnerHTML={{ __html: block.text }}
      />
    </blockquote>
  );
}

function RenderList({ block }: { block: ListBlock }) {
  const Tag = block.ordered ? 'ol' : 'ul';
  return (
    <Tag className={`space-y-1.5 my-3 ${block.ordered ? 'list-decimal' : 'list-disc'} pl-5 text-sm sm:text-base text-gray-700`}>
      {block.items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </Tag>
  );
}

function RenderLetteredList({ block }: { block: LetteredListBlock }) {
  return (
    <div className="space-y-3 my-4">
      {block.items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex-shrink-0 w-8 h-8 bg-[#013fac] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
            {item.letter}
          </div>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed flex-1">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

function RenderSteps({ block }: { block: StepsBlock }) {
  return (
    <div className="space-y-4 my-4">
      {block.items.map((item) => (
        <div key={item.step} className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#013fac] to-[#0149c9] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
            {item.step}
          </div>
          <div className="flex-1 pt-1">
            <h4 className="font-bold text-gray-900 text-base mb-0.5">{item.title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderCardGrid({ block }: { block: CardGridBlock }) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }[block.columns || 2];

  const colorMap: Record<string, { border: string; bg: string; iconBg: string }> = {
    blue:   { border: 'border-l-[#013fac]', bg: 'bg-blue-50/50',    iconBg: 'bg-[#013fac]/10 text-[#013fac]' },
    red:    { border: 'border-l-red-600',   bg: 'bg-red-50/30',     iconBg: 'bg-red-600/10 text-red-600' },
    green:  { border: 'border-l-green-600', bg: 'bg-green-50/30',   iconBg: 'bg-green-600/10 text-green-600' },
    purple: { border: 'border-l-purple-600',bg: 'bg-purple-50/30',  iconBg: 'bg-purple-600/10 text-purple-600' },
    amber:  { border: 'border-l-amber-600', bg: 'bg-amber-50/30',   iconBg: 'bg-amber-600/10 text-amber-600' },
    gray:   { border: 'border-l-gray-500',  bg: 'bg-gray-50/50',    iconBg: 'bg-gray-500/10 text-gray-600' },
  };

  return (
    <div className={`grid ${colsClass} gap-4 my-4`}>
      {block.items.map((card, i) => {
        const color = colorMap[card.color || 'blue'];
        const Icon = getIcon(card.icon);
        return (
          <div
            key={i}
            className={`border-l-4 ${color.border} ${color.bg} border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${color.iconBg} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1.5">{card.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RenderLinkList({ block }: { block: LinkListBlock }) {
  return (
    <div className="space-y-2 my-4">
      {block.items.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all group"
        >
          <ExternalLink className="w-4 h-4 text-[#013fac] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-[#013fac] group-hover:text-[#0149c9] text-sm sm:text-base">
              {link.label}
            </span>
            {link.description && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{link.description}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

function RenderTable({ block }: { block: TableBlock }) {
  return (
    <div className="my-4">
      {block.title && <h5 className="font-bold text-gray-800 text-sm mb-2">{block.title}</h5>}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border border-gray-200 rounded">
          <thead>
            <tr className="bg-gray-50">
              {block.headers.map((h, hi) => (
                <th key={hi} className="px-2 sm:px-3 py-2 text-left font-bold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                {row.map((cell, j) => (
                  <td key={j} className="px-2 sm:px-3 py-1.5 border-b border-gray-100 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.note && <p className="text-xs text-gray-500 mt-1.5 italic">{block.note}</p>}
    </div>
  );
}

function RenderChampionshipList({ block }: { block: ChampionshipListBlock }) {
  return (
    <div className="space-y-1 my-3">
      {block.items.map((item, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 px-3 py-1.5 rounded text-sm ${
            item.highlight ? 'bg-yellow-50 border border-yellow-200 font-bold text-gray-900' : 'text-gray-700'
          }`}
        >
          <span className="font-mono font-bold text-gray-500 shrink-0 w-10">{item.year}</span>
          <span className="flex-1">
            {item.highlight && <Trophy className="w-3.5 h-3.5 inline mr-1 text-yellow-600 -mt-0.5" />}
            {item.detail}
          </span>
        </div>
      ))}
    </div>
  );
}

function RenderInfoBox({ block }: { block: InfoBoxBlock }) {
  const variants = {
    info:    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: Info },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: AlertTriangle },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: CheckCircle },
    dark:    { bg: 'bg-gradient-to-r from-[#0F2942] to-[#1a3a5c]', border: 'border-transparent', text: 'text-white', icon: Info },
  };
  const v = variants[block.variant || 'info'];
  const Icon = v.icon;

  if (block.variant === 'dark') {
    return (
      <div className={`${v.bg} ${v.text} rounded-lg p-6 sm:p-8 shadow-lg my-4`}>
        {block.title && <h3 className="text-lg sm:text-xl font-bold mb-4">{block.title}</h3>}
        <div
          className="text-sm sm:text-base text-blue-100 leading-relaxed space-y-3"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      </div>
    );
  }

  return (
    <div className={`${v.bg} border ${v.border} ${v.text} rounded-lg p-4 my-4`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          {block.title && <h4 className="font-bold mb-1">{block.title}</h4>}
          <div
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        </div>
      </div>
    </div>
  );
}

function RenderContactTable({ block }: { block: ContactTableBlock }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white">
            <th className="px-4 py-2.5 text-left font-bold">Position</th>
            <th className="px-4 py-2.5 text-left font-bold">Name</th>
            <th className="px-4 py-2.5 text-left font-bold">Email</th>
          </tr>
        </thead>
        <tbody>
          {block.items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 border-b border-gray-100 font-medium text-gray-900">{item.position}</td>
              <td className="px-4 py-2 border-b border-gray-100 text-gray-700">{item.name}</td>
              <td className="px-4 py-2 border-b border-gray-100">
                {item.email ? (
                  <a href={`mailto:${item.email}`} className="text-[#013fac] hover:text-[#0149c9] font-medium">
                    {item.email}
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenderButtonLink({ block }: { block: ButtonLinkBlock }) {
  const Icon = getIcon(block.icon);
  return (
    <div className="my-6">
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-base"
      >
        <Icon className="w-6 h-6" />
        <div>
          {block.sublabel && <div className="text-sm opacity-80">{block.sublabel}</div>}
          <div>{block.label}</div>
        </div>
        <ExternalLink className="w-5 h-5 ml-2" />
      </a>
    </div>
  );
}

function RenderKeyValue({ block }: { block: KeyValueBlock }) {
  return (
    <div className="space-y-2 my-4">
      {block.items.map((item, i) => {
        const Icon = getIcon(item.icon);
        return (
          <div key={i} className="flex items-start gap-3">
            <div className="flex items-center gap-1.5 shrink-0 w-28">
              <Icon className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.label}</span>
            </div>
            <div
              className="flex-1 min-w-0 text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: item.value }}
            />
          </div>
        );
      })}
    </div>
  );
}

function RenderDivider() {
  return <hr className="my-6 border-gray-200" />;
}

// ─── Main Block Renderer ───

function RenderBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'hero': return <RenderHero block={block} />;
    case 'paragraph': return <RenderParagraph block={block} />;
    case 'heading': return <RenderHeading block={block} />;
    case 'blockquote': return <RenderBlockquote block={block} />;
    case 'list': return <RenderList block={block} />;
    case 'lettered-list': return <RenderLetteredList block={block} />;
    case 'steps': return <RenderSteps block={block} />;
    case 'card-grid': return <RenderCardGrid block={block} />;
    case 'link-list': return <RenderLinkList block={block} />;
    case 'table': return <RenderTable block={block} />;
    case 'championship-list': return <RenderChampionshipList block={block} />;
    case 'info-box': return <RenderInfoBox block={block} />;
    case 'contact-table': return <RenderContactTable block={block} />;
    case 'divider': return <RenderDivider />;
    case 'button-link': return <RenderButtonLink block={block} />;
    case 'key-value': return <RenderKeyValue block={block} />;
    default: return null;
  }
}

// ─── Collapsible Section Wrapper ───

function CollapsibleSectionWrapper({
  section,
  children,
  expandAll,
}: {
  section: ContentSection;
  children: React.ReactNode;
  expandAll?: boolean;
}) {
  const [open, setOpen] = useState(section.defaultOpen ?? false);
  const [manuallyToggled, setManuallyToggled] = useState(false);
  const Icon = getIcon(section.icon);
  const accent = section.accentColor || '#013fac';

  // Sync with expandAll when it changes, but respect manual toggles
  useEffect(() => {
    if (expandAll !== undefined && !manuallyToggled) {
      setOpen(expandAll);
    }
  }, [expandAll, manuallyToggled]);

  const handleToggle = () => {
    setOpen(!open);
    setManuallyToggled(true);
  };

  // Extract number from title (e.g., "1 — Name" -> "1", "2 — Interpretation" -> "2")
  // Also handle formats like "Bylaw 1", "Section 1", etc.
  const numberMatch = section.title.match(/^(\d+)[\s—-]|bylaw\s+(\d+)/i);
  const sectionNumber = numberMatch ? (numberMatch[1] || numberMatch[2]) : '';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        {sectionNumber ? (
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-[#013fac] text-white text-xs font-bold shrink-0">
            {sectionNumber}
          </span>
        ) : (
          <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: accent }}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <span className="flex-1 font-bold text-gray-900 text-sm sm:text-base">{section.title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-5 pt-2 bg-white border-t border-gray-100 text-sm sm:text-base text-gray-700 leading-relaxed space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Section Renderer ───

function RenderSection({ section, expandAll }: { section: ContentSection; expandAll?: boolean }) {
  const content = (
    <div className="space-y-4">
      {section.blocks.map((block, i) => (
        <RenderBlock key={`${section.id}-block-${i}`} block={block} />
      ))}
    </div>
  );

  if (section.collapsible) {
    return <CollapsibleSectionWrapper section={section} expandAll={expandAll}>{content}</CollapsibleSectionWrapper>;
  }

  return <div className="space-y-4">{content}</div>;
}

// ─── Page Renderer with Expand/Collapse All Support ───

export function ContentPageRenderer({ schema }: { schema: PageContentSchema }) {
  const [expandAll, setExpandAll] = useState(false);
  const hasCollapsibleSections = schema.sections.some(s => s.collapsible);

  // Find hero section if it exists (for placing expand/collapse button)
  const heroSection = schema.sections.find(s => s.blocks.some(b => b.type === 'hero'));
  const heroBlock = heroSection?.blocks.find(b => b.type === 'hero') as HeroBlock | undefined;
  const HeroIcon = heroBlock ? getIcon(heroBlock.icon) : Scale;

  return (
    <div className="space-y-5">
      {heroBlock && (
        <div className="bg-gradient-to-br from-[#013fac]/5 via-white to-red-50 border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-[#013fac] rounded-lg shadow-md">
              <HeroIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{heroBlock.title}</h2>
              <div className="h-1 w-20 bg-[#013fac] rounded"></div>
            </div>
          </div>
          {heroBlock.subtitle && (
            <p
              className="text-sm sm:text-base text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: heroBlock.subtitle }}
            />
          )}
          {hasCollapsibleSections && (
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="mt-4 flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded border-2 border-[#013fac] text-[#013fac] hover:bg-[#013fac] hover:text-white transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {expandAll ? 'Collapse All Sections' : 'Expand All Sections'}
            </button>
          )}
        </div>
      )}
      <div className="space-y-5">
        {schema.sections
          .filter(s => !s.blocks.some(b => b.type === 'hero'))
          .map((section) => (
            <RenderSection key={section.id} section={section} expandAll={expandAll} />
          ))}
      </div>
    </div>
  );
}

// Export individual block renderer for CMS preview
export { RenderBlock, RenderSection };
