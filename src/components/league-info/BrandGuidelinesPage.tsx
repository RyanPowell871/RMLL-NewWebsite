'use client';

import { useState } from 'react';
import { Palette, Download, Check, Copy, X, AlertTriangle, CheckCircle, Type, Image, Layers, Shield } from 'lucide-react';

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------
interface ColorSwatch {
  name: string;
  hex: string;
  rgb: string;
  usage: string;
  className: string;            // Tailwind bg- for preview
  textClassName?: string;       // override text colour on swatch
}

const BRAND_COLORS: ColorSwatch[] = [
  {
    name: 'RMLL Navy',
    hex: '#001741',
    rgb: '0, 23, 65',
    usage: 'Primary dark background, footer, header accents',
    className: 'bg-[#001741]',
  },
  {
    name: 'RMLL Blue',
    hex: '#013FAC',
    rgb: '1, 63, 172',
    usage: 'Primary brand colour, buttons, headings, links',
    className: 'bg-[#013fac]',
  },
  {
    name: 'RMLL Blue Light',
    hex: '#0149C9',
    rgb: '1, 73, 201',
    usage: 'Hover states, gradients, secondary accents',
    className: 'bg-[#0149c9]',
  },
  {
    name: 'RMLL Red',
    hex: '#DC2626',
    rgb: '220, 38, 38',
    usage: 'Accent colour, alerts, highlights, score tickers',
    className: 'bg-[#dc2626]',
  },
  {
    name: 'White',
    hex: '#FFFFFF',
    rgb: '255, 255, 255',
    usage: 'Backgrounds, text on dark surfaces',
    className: 'bg-white border border-gray-200',
    textClassName: 'text-gray-900',
  },
  {
    name: 'Dark Slate',
    hex: '#0F2942',
    rgb: '15, 41, 66',
    usage: 'Card backgrounds, secondary dark surfaces',
    className: 'bg-[#0F2942]',
  },
];


// ---------------------------------------------------------------------------
// Logo variant definitions
// ---------------------------------------------------------------------------
interface LogoVariant {
  id: string;
  name: string;
  description: string;
  src: string;
  bgClass: string;
  downloads: { label: string; size: string }[];
}

const LOGO_VARIANTS: LogoVariant[] = [
  {
    id: 'shield',
    name: 'Shield Logo (Primary)',
    description: 'The primary RMLL shield crest. Use this as the main mark wherever the league is represented.',
    src: 'https://nkfbehspyjookipapdbp.supabase.co/storage/v1/object/public/make-9a1ba23f-images/1774223389508-kcvcngeu67.png',
    bgClass: 'bg-white',
    downloads: [
      { label: 'PNG - Full Size', size: 'Original' },
      { label: 'PNG - Large (512w)', size: '512w' },
      { label: 'PNG - Medium (256w)', size: '256w' },
      { label: 'PNG - Small (128w)', size: '128w' },
    ],
  },
  {
    id: 'horizontal',
    name: 'Horizontal Logo',
    description: 'The horizontal lockup combining the crest with the league name. Ideal for headers and banners.',
    src: 'https://nkfbehspyjookipapdbp.supabase.co/storage/v1/object/public/make-9a1ba23f-images/1774223389516-e9kz3q3g3k.png',
    bgClass: 'bg-white',
    downloads: [
      { label: 'PNG - Full Size', size: 'Original' },
      { label: 'PNG - Banner (800w)', size: '800w' },
      { label: 'PNG - Medium (400w)', size: '400w' },
    ],
  },
  // Jersey Shoulder Patch Logo Variant
  {
    id: 'shoulder-patch',
    name: 'Shoulder Patch Logo',
    description: 'The official RMLL shield crest with red accent bottom, specifically designed for use on jersey shoulder patches.',
    src: 'https://nkfbehspyjookipapdbp.supabase.co/storage/v1/object/public/make-9a1ba23f-images/1774223389508-kcvcngeu67.png',
    bgClass: 'bg-[#001741]', // Navy background for contrast
    downloads: [
      { label: 'PNG - Full Size', size: 'Original' },
      { label: 'PNG - Large (512w)', size: '512w' },
      { label: 'PNG - Medium (256w)', size: '256w' },
    ],
  },
  {
    id: 'shield-dark',
    name: 'Shield on Dark',
    description: 'The shield crest for use on dark backgrounds. Ensure sufficient contrast around the mark.',
    src: 'https://nkfbehspyjookipapdbp.supabase.co/storage/v1/object/public/make-9a1ba23f-images/1774223389508-kcvcngeu67.png',
    bgClass: 'bg-[#001741]',
    downloads: [
      { label: 'PNG - Full Size', size: 'Original' },
      { label: 'PNG - Large (512w)', size: '512w' },
    ],
  },
  {
    id: 'horizontal-dark',
    name: 'Horizontal on Dark',
    description: 'Horizontal lockup on dark background. Suitable for dark-themed media and print.',
    src: 'https://nkfbehspyjookipapdbp.supabase.co/storage/v1/object/public/make-9a1ba23f-images/1774223389516-e9kz3q3g3k.png',
    bgClass: 'bg-[#001741]',
    downloads: [
      { label: 'PNG - Full Size', size: 'Original' },
      { label: 'PNG - Banner (800w)', size: '800w' },
    ],
  },
];


// ---------------------------------------------------------------------------
// Usage rules
// ---------------------------------------------------------------------------
interface UsageRule {
  allowed: boolean;
  text: string;
}

const USAGE_RULES: UsageRule[] = [
  { allowed: true, text: 'Use on a clean, uncluttered background with adequate clear space' },
  { allowed: true, text: 'Maintain the original aspect ratio when scaling' },
  { allowed: true, text: 'Use approved colour combinations (full colour, white, or navy)' },
  { allowed: true, text: 'Use the horizontal lockup for headers, banners, and printed materials' },
  { allowed: true, text: 'Place the shield crest alone when space is limited (favicons, avatars)' },
  { allowed: false, text: 'Stretch, skew, or distort the logo in any way' },
  { allowed: false, text: 'Change the logo colours outside of approved palettes' },
  { allowed: false, text: 'Add drop shadows, gradients, or effects to the logo' },
  { allowed: false, text: 'Place the logo over busy imagery without a background container' },
  { allowed: false, text: 'Rotate the logo or rearrange any elements within it' },
  { allowed: false, text: 'Use the logo as part of another organisation\'s branding without approval' },
];


// ---------------------------------------------------------------------------
// Download helper - resizes via an off-screen canvas then triggers a download
// Refactored to compute height proportionally to prevent squishing
// ---------------------------------------------------------------------------
function downloadLogo(src: string, fileName: string, targetSize: string) {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');

    if (targetSize === 'Original') {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    } else {
      // Parse width from targetSize like '512w' or '800px'
      const match = targetSize.match(/(\d+)/);
      if (match) {
        const targetWidth = parseInt(match[1], 10);
        const ratio = img.naturalWidth / img.naturalHeight;
        canvas.width = targetWidth;
        canvas.height = Math.round(targetWidth / ratio);
      } else {
        // Fallback to original size if size cannot be parsed
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Enable anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };
  img.src = src;
}

// ---------------------------------------------------------------------------
// Clipboard copy helper
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/20 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function BrandGuidelinesPage() {
  // Get logo URLs for inline references
  const shieldLogo = LOGO_VARIANTS.find(v => v.id === 'shield')?.src || '';
  const horizontalLogo = LOGO_VARIANTS.find(v => v.id === 'horizontal')?.src || '';

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#013fac]/5 via-white to-red-50 border-2 border-[#013fac]/20 rounded-lg p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#013fac] rounded-lg shadow-md">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Brand Guidelines</h2>
            <div className="h-1 w-20 bg-[#013fac] rounded"></div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          These guidelines ensure the RMLL brand is represented consistently across all media -
          from team websites and social media to print materials and arena signage. When in doubt,
          contact the RMLL Executive Director for approval.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1 - Logo Downloads                                          */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-[#013fac]/10 text-[#013fac]">
            <Image className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Logo Suite</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {LOGO_VARIANTS.map((variant) => (
            <div
              key={variant.id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Preview */}
              <div className={`${variant.bgClass} flex items-center justify-center p-8 sm:p-10 min-h-[180px]`}>
                <img
                  src={variant.src}
                  alt={variant.name}
                  className="max-h-28 sm:max-h-36 w-auto object-contain"
                />
              </div>

              {/* Info & Downloads */}
              <div className="p-4 sm:p-5 bg-white">
                <h4 className="font-bold text-gray-900 mb-1">{variant.name}</h4>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{variant.description}</p>

                <div className="flex flex-wrap gap-2">
                  {variant.downloads.map((dl) => {
                    const sizeForFile = dl.size === 'Original' ? 'full' : dl.size.replace('w', 'w');
                    const fileName = `rmll-${variant.id}-${sizeForFile}.png`;
                    return (
                      <button
                        key={dl.label}
                        onClick={() => downloadLogo(variant.src, fileName, dl.size)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#013fac]/10 text-[#013fac] hover:bg-[#013fac] hover:text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {dl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vector request notice */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Need vector formats?</span>{' '}
            SVG, EPS, and AI source files are available upon request. Contact the RMLL Executive Director
            at{' '}
            <a href="mailto:christinethielen@hotmail.com" className="underline hover:text-amber-900">
              christinethielen@hotmail.com
            </a>{' '}
            for high-resolution or vector logo files.
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2 - Clear Space & Minimum Size                              */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-[#013fac]/10 text-[#013fac]">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Clear Space & Minimum Size</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Clear space demo */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Clear Space</h4>
            <div className="flex items-center justify-center">
              <div className="relative border-2 border-dashed border-blue-300 p-8 sm:p-10 rounded-lg bg-blue-50/30">
                <img src={shieldLogo} alt="Clear space demo" className="h-20 w-auto mx-auto" />
                {/* Measurement arrows */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-blue-500 bg-white px-1 rounded">X</div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-blue-500 bg-white px-1 rounded">X</div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-blue-500 bg-white px-1 rounded">X</div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-blue-500 bg-white px-1 rounded">X</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center leading-relaxed">
              Maintain clear space equal to "X" (the height of the shield's top ornament) on all sides.
              No text, imagery, or other logos should encroach on this space.
            </p>
          </div>

          {/* Minimum sizes */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Minimum Size</h4>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-500 mb-2">Digital / Screen (shield):</p>
                <div className="flex items-end gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <img src={shieldLogo} alt="" className="h-8 w-auto" />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">48px</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <img src={shieldLogo} alt="" className="h-5 w-auto" />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">32px min</span>
                  </div>
                  <div className="flex flex-col items-center opacity-40">
                    <div className="w-4 h-4 bg-gray-100 rounded border border-red-300 flex items-center justify-center">
                      <img src={shieldLogo} alt="" className="h-2.5 w-auto" />
                    </div>
                    <span className="text-[10px] text-red-400 mt-1">Too small</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Print:</p>
                <p className="text-sm text-gray-700">
                  Minimum 0.5″ (12.7 mm) width for the shield mark. Minimum 1.5″ (38 mm) width for the horizontal lockup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3 - Colour Palette                                          */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-[#013fac]/10 text-[#013fac]">
            <Palette className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Colour Palette</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BRAND_COLORS.map((color) => (
            <div key={color.hex} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Swatch */}
              <div className={`${color.className} h-24 sm:h-28 flex items-end p-3`}>
                <span className={`text-xs font-bold ${color.textClassName || 'text-white'}`}>
                  {color.name}
                </span>
              </div>
              {/* Values */}
              <div className="p-3 bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">HEX</span>
                  <span className="text-xs font-mono font-semibold text-gray-800 flex items-center gap-1">
                    {color.hex} <CopyButton text={color.hex} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">RGB</span>
                  <span className="text-xs font-mono font-semibold text-gray-800 flex items-center gap-1">
                    {color.rgb} <CopyButton text={color.rgb} />
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-100 leading-relaxed">
                  {color.usage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4 - Typography                                              */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-[#013fac]/10 text-[#013fac]">
            <Type className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Typography</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Primary */}
          <div className="border border-gray-200 rounded-xl p-5 sm:p-6 bg-white">
            <span className="text-[10px] font-bold text-[#013fac] uppercase tracking-widest">Primary Typeface</span>
            <h4 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Inter
            </h4>
            <p className="text-xs text-gray-500 mb-4">Weights: 400 (Regular), 600 (Semibold), 700 (Bold), 800 (Extra Bold), 900 (Black)</p>
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <p className="text-2xl font-black text-gray-900">Heading - Black 900</p>
              <p className="text-lg font-bold text-gray-800">Subheading - Bold 700</p>
              <p className="text-base font-semibold text-gray-700">Label - Semibold 600</p>
              <p className="text-sm text-gray-600">Body text - Regular 400. The quick brown fox jumps over the lazy dog.</p>
            </div>
          </div>

          {/* Guidance */}
          <div className="border border-gray-200 rounded-xl p-5 sm:p-6 bg-white">
            <span className="text-[10px] font-bold text-[#013fac] uppercase tracking-widest">Usage Guidance</span>
            <div className="mt-3 space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>
                <strong className="text-gray-900">Headings</strong> should use Inter <em>Black (900)</em> or <em>Extra Bold (800)</em> in
                uppercase or title case. Page titles use RMLL Navy or RMLL Blue.
              </p>
              <p>
                <strong className="text-gray-900">Body copy</strong> should use Inter <em>Regular (400)</em> or <em>Semibold (600)</em> at
                14-16 px with a line-height of 1.5-1.75 for readability.
              </p>
              <p>
                <strong className="text-gray-900">Stats & scores</strong> use <em>Bold (700)</em> or <em>Black (900)</em> with
                tabular-nums enabled for alignment.
              </p>
              <p>
                <strong className="text-gray-900">Fallback stack:</strong>{' '}
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">Inter, system-ui, -apple-system, sans-serif</code>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 5 - Usage Do's & Don'ts                                     */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-[#013fac]/10 text-[#013fac]">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Usage Guidelines</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Do's */}
          <div className="border-2 border-green-200 bg-green-50/40 rounded-xl p-5">
            <h4 className="text-sm font-bold text-green-800 flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4" /> Do
            </h4>
            <ul className="space-y-2">
              {USAGE_RULES.filter((r) => r.allowed).map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  {rule.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Don'ts */}
          <div className="border-2 border-red-200 bg-red-50/40 rounded-xl p-5">
            <h4 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-3">
              <X className="w-4 h-4" /> Don't
            </h4>
            <ul className="space-y-2">
              {USAGE_RULES.filter((r) => !r.allowed).map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-red-900">
                  <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  {rule.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 6 - Quick Reference / Download All                          */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="bg-gradient-to-r from-[#0F2942] to-[#1a3a5c] text-white rounded-xl p-6 sm:p-8 shadow-lg">
          <h3 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
            <Download className="w-5 h-5" /> Quick Download
          </h3>
          <p className="text-sm text-blue-100 mb-5 leading-relaxed">
            Download individual logo files by clicking the buttons above, or contact the RMLL office
            for a complete brand kit including vector files, print-ready logos, and additional assets.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => downloadLogo(shieldLogo, 'rmll-shield-logo.png', 'Original')}
              className="inline-flex items-center gap-2 bg-white text-[#013fac] font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Shield Logo (PNG)
            </button>
            <button
              onClick={() => downloadLogo(horizontalLogo, 'rmll-horizontal-logo.png', 'Original')}
              className="inline-flex items-center gap-2 bg-white text-[#013fac] font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Horizontal Logo (PNG)
            </button>
            <a
              href="mailto:christinethielen@hotmail.com?subject=RMLL%20Brand%20Kit%20Request&body=Hi%2C%0A%0AI%20would%20like%20to%20request%20the%20full%20RMLL%20brand%20kit%20including%20vector%20files.%0A%0AThank%20you."
              className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              Request Full Brand Kit
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}