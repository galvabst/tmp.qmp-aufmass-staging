import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface ImageLightboxProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: string;
}

export function ImageLightbox({ src, alt, open, onOpenChange, label }: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-2 bg-black/95 border-none">
        <VisuallyHidden.Root>
          <DialogTitle>{alt}</DialogTitle>
          <DialogDescription>Detailansicht des Bildes</DialogDescription>
        </VisuallyHidden.Root>
        <div className="flex flex-col items-center">
          <img 
            src={src} 
            alt={alt} 
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
          {label && (
            <p className="text-white/80 text-sm mt-3">{label}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
