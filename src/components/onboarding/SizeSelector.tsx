import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { KLEIDUNGSGROESSEN, SCHUHGROESSEN, Kleidungsgroesse, Schuhgroesse } from '@/lib/onboarding-sizes';

interface SizeSelectorProps {
  type: 'kleidung' | 'schuhe';
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  disabled?: boolean;
}

export function SizeSelector({ type, selectedSize, onSizeSelect, disabled }: SizeSelectorProps) {
  const sizes = type === 'kleidung' ? KLEIDUNGSGROESSEN : SCHUHGROESSEN;
  const label = type === 'kleidung' ? 'Kleidergröße' : 'Schuhgröße';
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} auswählen:
      </label>
      <div className="flex flex-wrap gap-2 justify-center">
        {sizes.map((size) => (
          <Button
            key={size}
            variant={selectedSize === size ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSizeSelect(size)}
            disabled={disabled}
            className={cn(
              'min-w-[3rem]',
              selectedSize === size && 'ring-2 ring-primary ring-offset-2'
            )}
          >
            {size}
          </Button>
        ))}
      </div>
    </div>
  );
}
