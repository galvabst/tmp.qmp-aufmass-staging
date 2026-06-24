import { useState } from 'react';
import { Sparkles, X, Maximize2 } from 'lucide-react';
import type { FotoBeispielData } from '../../data/foto-beispiele';

/**
 * Beispielbild „so sieht ein gutes Foto aus". Trägt IMMER ein sichtbares
 * „Beispiel (illustrativ)"-Badge (die Bilder sind KI-generiert, kein echtes
 * Kundenfoto) und eine Caption, die sagt, WORAUF zu achten ist. Antippen =
 * Vollbild (mobile-tauglich). Rein erklärend, nie ein Messwert.
 */
export function FotoBeispiel({ src, alt, caption }: FotoBeispielData) {
  const [offen, setOffen] = useState(false);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="relative block w-full overflow-hidden rounded-xl border border-border active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
        aria-label="Beispielbild vergrößern"
      >
        <img src={src} alt={alt} className="w-full h-auto object-cover" loading="lazy" />
        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white">
          <Sparkles className="h-3 w-3" /> Beispiel (illustrativ)
        </span>
        <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 p-1 text-white">
          <Maximize2 className="h-3 w-3" />
        </span>
      </button>
      <p className="text-xs text-muted-foreground leading-snug">{caption}</p>

      {offen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Beispielbild groß"
          onClick={() => setOffen(false)}
        >
          <img src={src} alt={alt} className="max-h-full max-w-full rounded-lg" />
          <button
            type="button"
            onClick={() => setOffen(false)}
            aria-label="Schließen"
            className="absolute top-4 right-4 rounded-full bg-white/15 p-2 text-white active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
