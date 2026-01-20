import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterRowProps {
  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Status Filter
  statusOptions?: FilterOption[];
  statusValue?: string;
  onStatusChange?: (value: string | undefined) => void;
  statusPlaceholder?: string;

  // Type Filter (optional second dropdown)
  typeOptions?: FilterOption[];
  typeValue?: string;
  onTypeChange?: (value: string | undefined) => void;
  typePlaceholder?: string;

  // Reset
  onReset?: () => void;
  showReset?: boolean;

  className?: string;
}

export function FilterRow({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Suche...',
  statusOptions,
  statusValue,
  onStatusChange,
  statusPlaceholder = 'Status',
  typeOptions,
  typeValue,
  onTypeChange,
  typePlaceholder = 'Typ',
  onReset,
  showReset = false,
  className,
}: FilterRowProps) {
  const hasActiveFilters = searchValue || statusValue || typeValue;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Filters Row */}
      <div className="flex gap-2 flex-wrap">
        {/* Status Select */}
        {statusOptions && onStatusChange && (
          <Select
            value={statusValue || '__all__'}
            onValueChange={(v) => onStatusChange(v === '__all__' ? undefined : v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={statusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Type Select */}
        {typeOptions && onTypeChange && (
          <Select
            value={typeValue || '__all__'}
            onValueChange={(v) => onTypeChange(v === '__all__' ? undefined : v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={typePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle</SelectItem>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Reset Button */}
        {(showReset || hasActiveFilters) && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
}
