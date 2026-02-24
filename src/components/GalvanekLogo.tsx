import galvanekLogo from '@/assets/galvanek-logo.png';
import { cn } from '@/lib/utils';

interface GalvanekLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
  className?: string;
}

const sizeMap = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-40 w-48',
};

export function GalvanekLogo({ size = 'md', variant = 'default', className }: GalvanekLogoProps) {
  return (
    <img 
      src={galvanekLogo} 
      alt="Galvanek" 
      className={cn(
        'object-contain',
        sizeMap[size],
        variant === 'white' && 'brightness-0 invert',
        className,
      )}
    />
  );
}
