'use client';

import { useState } from 'react';
import {
  ChevronDown, ChevronRight, ExternalLink,
  Globe, FileText, Shield, Scale, BookOpen, Heart, Megaphone, ClipboardList, LucideIcon
} from 'lucide-react';

/* ─── Collapsible Section ─── */
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: string;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, accent = '#013fac' }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${accent}15` }}>
          {icon}
        </div>
        <span className="font-bold text-gray-900 flex-1 text-sm sm:text-base" style={{ fontFamily: 'var(--font-secondary)' }}>{title}</span>
        {open
          ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
          : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
      </button>
      {open && <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100">{children}</div>}
    </div>
  );
}

/* ─── Link Card ─── */
interface LinkItem {
  label: string;
  url: string;
  description: string;
  iconName: string;
  type: 'webpage' | 'pdf';
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Scale,
  ClipboardList,
  Shield,
  BookOpen,
  FileText,
  Megaphone,
  Globe,
};

function LinkCard({ item }: { item: LinkItem }) {
  const Icon = iconMap[item.iconName] || Globe;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#013fac]/40 hover:bg-blue-50/30 transition-all group"
    >
      <div className="p-2 rounded-lg bg-[#013fac]/10 flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#013fac]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 group-hover:text-[#013fac] transition-colors">
            {item.label}
          </span>
          {item.type === 'pdf' && (
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-600">
              PDF
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#013fac] flex-shrink-0 mt-1 transition-colors" />
    </a>
  );
}

/* ─── Data ─── */
const LC_LINKS: LinkItem[] = [
  {
    label: 'Lacrosse Canada Bylaws',
    url: 'https://lacrosse.ca/bylaws/',
    description: 'National bylaws and constitutional documents governing lacrosse in Canada.',
    iconName: 'Scale',
    type: 'webpage',
  },
  {
    label: 'Lacrosse Canada Transfers',
    url: 'https://lacrosse.ca/transfers/',
    description: 'Information on player transfer policies and procedures between provincial associations.',
    iconName: 'ClipboardList',
    type: 'webpage',
  },
  {
    label: 'Anti-Doping Program',
    url: 'https://lacrosse.ca/development/athletes/anti-doping/',
    description: 'Lacrosse Canada anti-doping resources, policies, and athlete information.',
    iconName: 'Shield',
    type: 'webpage',
  },
];

const ALA_LINKS: LinkItem[] = [
  {
    label: 'ALA Governance',
    url: 'https://www.albertalacrosse.com/content/governance',
    description: 'Alberta Lacrosse Association governance documents, board information, and organizational structure.',
    iconName: 'BookOpen',
    type: 'webpage',
  },
  {
    label: 'ALA Insurance Brochure',
    url: 'https://cloud.rampinteractive.com/ablax/files/2025/Insurance%20BFL%20ALA%20Brochure%20.pdf',
    description: 'BFL insurance brochure outlining coverage details for ALA-affiliated programs and events.',
    iconName: 'Shield',
    type: 'pdf',
  },
  {
    label: 'ALA Insurance Claim Form',
    url: 'https://cloud.rampinteractive.com/ablax/files/ALA%20Insurance%20Claim%20Form%202.pdf',
    description: 'Official form for submitting insurance claims through the Alberta Lacrosse Association.',
    iconName: 'FileText',
    type: 'pdf',
  },
  {
    label: 'ALA Strategic Plan',
    url: 'https://www.albertalacrosse.com/content/ala-strategic-plan',
    description: 'The Alberta Lacrosse Association\'s strategic plan and long-term organizational goals.',
    iconName: 'Megaphone',
    type: 'webpage',
  },
  {
    label: 'ALA Social Media Policy',
    url: 'https://cloud.rampinteractive.com/ablax/files/%20bylaws-regulations-policies/policies/ALA-Social-Media-Policy-Master-v5.pdf',
    description: 'Guidelines and policies for social media use within ALA-affiliated organizations.',
    iconName: 'Globe',
    type: 'pdf',
  },
  {
    label: 'ALA Forms & Guides',
    url: 'https://www.albertalacrosse.com/content/forms-and-guides',
    description: 'Collection of forms, guides, and templates for ALA programs and administration.',
    iconName: 'ClipboardList',
    type: 'webpage',
  },
];

/* ─── Main Page ─── */
export function LCALAInfoPage() {

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-[#013fac]/10 rounded-xl">
            <Globe className="w-7 h-7 text-[#013fac]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-secondary)' }}>
              LC &amp; ALA Info
            </h1>
            <p className="text-sm text-gray-500">Lacrosse Canada &amp; Alberta Lacrosse Association Resources</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Lacrosse Canada ── */}
        <CollapsibleSection
          title="Lacrosse Canada"
          icon={<Globe className="w-5 h-5 text-[#013fac]" />}
          defaultOpen={true}
          accent="#013fac"
        >
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Lacrosse Canada is the national governing body for lacrosse. Below are key resources and documents from the national level.
            </p>
            {LC_LINKS.map((item, i) => (
              <LinkCard key={i} item={item} />
            ))}
          </div>
        </CollapsibleSection>

        {/* ── Alberta Lacrosse Association ── */}
        <CollapsibleSection
          title="Alberta Lacrosse Association (ALA)"
          icon={<Heart className="w-5 h-5 text-[#7c3aed]" />}
          defaultOpen={true}
          accent="#7c3aed"
        >
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              The Alberta Lacrosse Association oversees lacrosse in Alberta. Below are governance documents, insurance information, forms, and policies.
            </p>
            {ALA_LINKS.map((item, i) => (
              <LinkCard key={i} item={item} />
            ))}
          </div>
        </CollapsibleSection>

      </div>
    </div>
  );
}