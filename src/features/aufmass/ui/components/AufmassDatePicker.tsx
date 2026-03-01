import { useState, useMemo } from 'react';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AufmassDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Earliest selectable year */
  fromYear?: number;
  /** Latest selectable year */
  toYear?: number;
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export function AufmassDatePicker({
  value,
  onChange,
  disabled,
  placeholder = 'Datum wählen',
  fromYear = 1900,
  toYear = new Date().getFullYear(),
}: AufmassDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    try {
      return parse(value, 'yyyy-MM-dd', new Date());
    } catch {
      return undefined;
    }
  }, [value]);

  const [viewMonth, setViewMonth] = useState<Date>(selectedDate ?? new Date());

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = toYear; y >= fromYear; y--) arr.push(y);
    return arr;
  }, [fromYear, toYear]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(format(date, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const handleYearChange = (year: string) => {
    const d = new Date(viewMonth);
    d.setFullYear(Number(year));
    setViewMonth(d);
  };

  const handleMonthChange = (month: string) => {
    const d = new Date(viewMonth);
    d.setMonth(Number(month));
    setViewMonth(d);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, 'dd.MM.yyyy') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-2 p-3 pb-0">
          <Select value={String(viewMonth.getMonth())} onValueChange={handleMonthChange}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(viewMonth.getFullYear())} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[90px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={viewMonth}
          onMonthChange={setViewMonth}
          locale={de}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
