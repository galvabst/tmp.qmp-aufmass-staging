import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

interface ProductImageSlideshowProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ProductImageSlideshow({ images, alt, className }: ProductImageSlideshowProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const labels = ['Vorderseite', 'Rückseite'];

  return (
    <div className={cn('w-full', className)}>
      <Carousel setApi={setApi} className="w-full max-w-xs mx-auto">
        <CarouselContent>
          {images.map((img, index) => (
            <CarouselItem key={index}>
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                <img
                  src={img}
                  alt={`${alt} - ${labels[index] || `Bild ${index + 1}`}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>

      {/* Label für aktuelle Ansicht */}
      <p className="text-center text-sm text-muted-foreground mt-2">
        {labels[current] || `Bild ${current + 1}`}
      </p>

      {/* Progress-Dots */}
      <div className="flex justify-center gap-2 mt-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              current === index ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
            aria-label={`Gehe zu ${labels[index] || `Bild ${index + 1}`}`}
          />
        ))}
      </div>
    </div>
  );
}
