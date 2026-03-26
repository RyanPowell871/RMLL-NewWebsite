import { useState, useCallback, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

// ============================================================================
// Sort Direction & State
// ============================================================================
export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string;
  direction: SortDirection;
}

// ============================================================================
// useTableSort Hook
// ============================================================================
export function useTableSort(defaultColumn?: string, defaultDirection?: SortDirection) {
  const [sort, setSort] = useState<SortState>({
    column: defaultColumn || '',
    direction: defaultDirection || null,
  });

  const toggleSort = useCallback((column: string) => {
    setSort(prev => {
      if (prev.column !== column) return { column, direction: 'asc' };
      if (prev.direction === 'asc') return { column, direction: 'desc' };
      if (prev.direction === 'desc') return { column: '', direction: null };
      return { column, direction: 'asc' };
    });
  }, []);

  // Generic sort function: pass data array and a getValue(item, columnKey) function
  const sortData = useCallback(<T,>(data: T[], getValue: (item: T, column: string) => any): T[] => {
    if (!sort.column || !sort.direction) return data;
    
    return [...data].sort((a, b) => {
      const aVal = getValue(a, sort.column);
      const bVal = getValue(b, sort.column);
      
      // Handle nulls/undefined — push to bottom
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
        return sort.direction === 'asc' ? cmp : -cmp;
      }
      
      // Numeric
      const numA = typeof aVal === 'number' ? aVal : parseFloat(aVal);
      const numB = typeof bVal === 'number' ? bVal : parseFloat(bVal);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return sort.direction === 'asc' ? numA - numB : numB - numA;
      }
      
      // Fallback string
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [sort]);

  return { sort, toggleSort, sortData };
}

// ============================================================================
// SortableHeader Component
// ============================================================================
interface SortableHeaderProps {
  column: string;
  label: string;
  sort: SortState;
  onSort: (column: string) => void;
  className?: string;
  /** Use dark theme (white text, for colored header rows) */
  dark?: boolean;
}

export function SortableHeader({ column, label, sort, onSort, className = '', dark = false }: SortableHeaderProps) {
  const isActive = sort.column === column && sort.direction !== null;
  
  const baseClasses = dark
    ? `cursor-pointer select-none hover:bg-white/10 transition-colors ${className}`
    : `cursor-pointer select-none hover:bg-gray-100 transition-colors ${className}`;

  const iconColor = dark 
    ? (isActive ? 'text-white' : 'text-white/40') 
    : (isActive ? 'text-gray-700' : 'text-gray-300');

  // Detect alignment from className to set flex justify
  const isCenter = className.includes('text-center');
  const isRight = className.includes('text-right');
  const justifyClass = isCenter ? 'justify-center' : isRight ? 'justify-end' : 'justify-start';
  
  return (
    <th className={baseClasses} onClick={() => onSort(column)}>
      <div className={`flex items-center gap-1 ${justifyClass}`}>
        <span>{label}</span>
        <span className={`inline-flex ${iconColor}`}>
          {isActive && sort.direction === 'asc' ? (
            <ArrowUp className="w-3 h-3" />
          ) : isActive && sort.direction === 'desc' ? (
            <ArrowDown className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-40" />
          )}
        </span>
      </div>
    </th>
  );
}