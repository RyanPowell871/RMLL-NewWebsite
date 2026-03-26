import React from 'react';

interface SubdivisionFilterProps {
  availableSubdivisions: string[];
  selectedSubdivision: string;
  setSelectedSubdivision: (sub: string) => void;
  /** Optional accent color for the active state. Defaults to #013fac */
  accentColor?: string;
}

export function SubdivisionFilter({
  availableSubdivisions,
  selectedSubdivision,
  setSelectedSubdivision,
  accentColor = '#013fac',
}: SubdivisionFilterProps) {
  if (availableSubdivisions.length === 0) return null;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {availableSubdivisions.map(sub => (
        <button
          key={sub}
          onClick={() => setSelectedSubdivision(sub)}
          className={`px-3 py-1.5 text-xs font-bold tracking-wide whitespace-nowrap rounded-lg transition-all duration-200 ${
            selectedSubdivision === sub
              ? 'text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
          }`}
          style={selectedSubdivision === sub ? { backgroundColor: accentColor } : undefined}
        >
          {sub}
        </button>
      ))}
    </div>
  );
}
