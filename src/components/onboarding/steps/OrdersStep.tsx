import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OnboardingProduct, ClothingVariant, OberteilAuswahl } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { ProductImageSlideshow } from '../ProductImageSlideshow';
import { ImageLightbox } from '@/components/ui/image-lightbox';

// Import Kleidungsbilder
import tshirtVorne from '@/assets/onboarding/kleidung/tshirt-vorne.png';
import tshirtHinten from '@/assets/onboarding/kleidung/tshirt-hinten.png';
import poloshirtVorne from '@/assets/onboarding/kleidung/poloshirt-vorne.png';
import poloshirtHinten from '@/assets/onboarding/kleidung/poloshirt-hinten.png';
import pulloverVorne from '@/assets/onboarding/kleidung/pullover-vorne.png';
import pulloverHinten from '@/assets/onboarding/kleidung/pullover-hinten.png';
import schlappen from '@/assets/onboarding/kleidung/schlappen.png';

// Pullover-Bilder für Slideshow
export const PULLOVER_BILDER = [pulloverVorne, pulloverHinten];

// Oberteil-Varianten mit Bildern
const OBERTEIL_VARIANTEN: ClothingVariant[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    bildUrls: [tshirtVorne, tshirtHinten],
    externLink: 'https://shop.thermocheck.de/tshirt',
  },
  {
    id: 'poloshirt',
    name: 'Poloshirt',
    bildUrls: [poloshirtVorne, poloshirtHinten],
    externLink: 'https://shop.thermocheck.de/poloshirt',
  },
];

interface OrdersStepProps {
  products: OnboardingProduct[];
  orderedProducts: string[];
  onProductOrder: (productId: string) => void;
  oberteilAuswahl: OberteilAuswahl;
  onOberteilAuswahl: (auswahl: OberteilAuswahl) => void;
}

export function OrdersStep({ 
  products, 
  orderedProducts, 
  onProductOrder,
  oberteilAuswahl,
  onOberteilAuswahl,
}: OrdersStepProps) {
  const [confirmingProduct, setConfirmingProduct] = useState<OnboardingProduct | null>(null);
  const [confirmingVariant, setConfirmingVariant] = useState<ClothingVariant | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ClothingVariant | null>(OBERTEIL_VARIANTEN[0]);

  // Sortiere Produkte nach Reihenfolge
  const sortedProducts = [...products].sort((a, b) => a.reihenfolge - b.reihenfolge);

  // Prüfe ob alle Oberteil-Varianten bestellt sind (je nach Auswahl)
  const getRequiredOberteilIds = (): string[] => {
    if (oberteilAuswahl === 'beides') return ['tshirt', 'poloshirt'];
    if (oberteilAuswahl === 'tshirt') return ['tshirt'];
    if (oberteilAuswahl === 'poloshirt') return ['poloshirt'];
    return [];
  };

  const isOberteilComplete = (): boolean => {
    if (!oberteilAuswahl) return false;
    const required = getRequiredOberteilIds();
    return required.every(id => orderedProducts.includes(id));
  };

  // Finde das aktuelle (nächste nicht-bestellte) Produkt
  // Oberteil-Produkt überspringen wenn abgeschlossen
  const currentProduct = sortedProducts.find(p => {
    if (p.id === 'oberteil') {
      return !isOberteilComplete();
    }
    return !orderedProducts.includes(p.id);
  });
  
  const currentIndex = sortedProducts.findIndex(p => p.id === currentProduct?.id);

  // Nächste zu bestellende Oberteil-Variante
  const getNextOberteilVariant = (): ClothingVariant | null => {
    const required = getRequiredOberteilIds();
    for (const id of required) {
      if (!orderedProducts.includes(id)) {
        return OBERTEIL_VARIANTEN.find(v => v.id === id) || null;
      }
    }
    return null;
  };

  const handleOrderClick = (product: OnboardingProduct) => {
    // Öffne externen Link in neuem Tab
    window.open(product.externLink, '_blank', 'noopener,noreferrer');
    // Zeige Bestätigungs-Dialog
    setConfirmingProduct(product);
  };

  const handleVariantOrderClick = (variant: ClothingVariant) => {
    // Öffne externen Link in neuem Tab
    window.open(variant.externLink, '_blank', 'noopener,noreferrer');
    // Zeige Bestätigungs-Dialog
    setConfirmingVariant(variant);
  };

  const handleConfirmOrder = () => {
    if (confirmingProduct) {
      onProductOrder(confirmingProduct.id);
      setConfirmingProduct(null);
    }
  };

  const handleConfirmVariantOrder = () => {
    if (confirmingVariant) {
      onProductOrder(confirmingVariant.id);
      setConfirmingVariant(null);
    }
  };

  // Wenn alle bestellt sind
  if (!currentProduct) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-status-accepted mx-auto mb-4 flex items-center justify-center">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Alle Bestellungen abgeschlossen!</h3>
        <p className="text-muted-foreground mt-2">
          Du kannst jetzt zum nächsten Schritt gehen.
        </p>
      </div>
    );
  }

  // Spezielle Oberteil-Ansicht
  if (currentProduct.id === 'oberteil') {
    const nextVariant = getNextOberteilVariant();

    return (
      <div className="space-y-6">
        {/* Schritt-Anzeige */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Bestellung {currentIndex + 1} von {sortedProducts.length}: Oberteil
          </p>
        </div>

        {/* Auswahl-Buttons */}
        {!oberteilAuswahl && (
          <>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Was möchtest du bestellen?
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  onOberteilAuswahl('tshirt');
                  setSelectedVariant(OBERTEIL_VARIANTEN[0]);
                }}
                className="min-w-[100px]"
              >
                T-Shirt
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onOberteilAuswahl('poloshirt');
                  setSelectedVariant(OBERTEIL_VARIANTEN[1]);
                }}
                className="min-w-[100px]"
              >
                Poloshirt
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onOberteilAuswahl('beides');
                  setSelectedVariant(OBERTEIL_VARIANTEN[0]);
                }}
                className="min-w-[100px]"
              >
                Beides
              </Button>
            </div>

            {/* Vorschau-Slideshow */}
            <div className="bg-card rounded-2xl p-6 shadow-card">
              {/* Varianten-Tabs für Vorschau */}
              <div className="flex gap-2 justify-center mb-4">
                {OBERTEIL_VARIANTEN.map(variant => (
                  <Button
                    key={variant.id}
                    variant={selectedVariant?.id === variant.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {variant.name}
                  </Button>
                ))}
              </div>

              {selectedVariant && (
                <ProductImageSlideshow
                  images={selectedVariant.bildUrls}
                  alt={`Thermocheck ${selectedVariant.name}`}
                />
              )}

              <div className="text-center mt-4">
                <h3 className="text-xl font-bold text-foreground">
                  Thermocheck {selectedVariant?.name}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Hochwertige Arbeitskleidung mit deinem Namen und Thermocheck-Branding
                </p>
                <Badge variant="secondary" className="mt-2">
                  Preis im Shop (einmalig)
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* Bestell-Ansicht nach Auswahl */}
        {oberteilAuswahl && nextVariant && (
          <div className="bg-card rounded-2xl p-6 shadow-card">
            {/* Zeige was noch bestellt werden muss */}
            {oberteilAuswahl === 'beides' && (
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {orderedProducts.includes('tshirt') ? '2 von 2: Poloshirt' : '1 von 2: T-Shirt'}
                </p>
              </div>
            )}

            <ProductImageSlideshow
              images={nextVariant.bildUrls}
              alt={`Thermocheck ${nextVariant.name}`}
            />

            <div className="text-center mt-4 space-y-3">
              <h3 className="text-2xl font-bold text-foreground">
                Thermocheck {nextVariant.name}
              </h3>
              <p className="text-muted-foreground">
                Hochwertige Arbeitskleidung mit deinem Namen und Thermocheck-Branding
              </p>
              <Badge variant="secondary">Preis im Shop (einmalig)</Badge>
            </div>

            <Button
              size="lg"
              className="w-full mt-6"
              onClick={() => handleVariantOrderClick(nextVariant)}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Jetzt bestellen
            </Button>
          </div>
        )}

        {/* Progress-Dots */}
        <div className="flex justify-center gap-2">
          {sortedProducts.map((product, index) => (
            <div
              key={product.id}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-colors',
                product.id === 'oberteil'
                  ? isOberteilComplete()
                    ? 'bg-status-accepted'
                    : index === currentIndex
                      ? 'bg-primary'
                      : 'bg-muted'
                  : orderedProducts.includes(product.id)
                    ? 'bg-status-accepted'
                    : index === currentIndex
                      ? 'bg-primary'
                      : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Bestätigungs-Dialog für Variante */}
        <AlertDialog open={!!confirmingVariant} onOpenChange={() => setConfirmingVariant(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bestellung abgeschlossen?</AlertDialogTitle>
              <AlertDialogDescription>
                Hast du das <strong>Thermocheck {confirmingVariant?.name}</strong> im Shop bestellt?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Nein, noch nicht</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmVariantOrder}>
                Ja, bestellt
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Standard-Produkt-Ansicht
  return (
    <div className="space-y-6">
      {/* Schritt-Anzeige */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Bestellung {currentIndex + 1} von {sortedProducts.length}
        </p>
      </div>

      {/* Einzelnes Produkt groß darstellen */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        {/* Produktbild - mit Slideshow falls mehrere Bilder oder Pullover */}
        {currentProduct.id === 'schlappen' ? (
          <div className="aspect-square max-w-xs mx-auto rounded-xl bg-muted overflow-hidden mb-6">
            <img
              src={schlappen}
              alt={currentProduct.name}
              className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxImage(schlappen)}
            />
          </div>
        ) : currentProduct.id === 'pullover' ? (
          <ProductImageSlideshow
            images={PULLOVER_BILDER}
            alt={currentProduct.name}
            className="mb-6"
          />
        ) : currentProduct.bildUrls && currentProduct.bildUrls.length > 1 ? (
          <ProductImageSlideshow
            images={currentProduct.bildUrls}
            alt={currentProduct.name}
            className="mb-6"
          />
        ) : (
          <div className="aspect-square max-w-xs mx-auto rounded-xl bg-muted overflow-hidden mb-6">
            <img
              src={currentProduct.bildUrl || '/placeholder.svg'}
              alt={currentProduct.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Produkt-Info */}
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-bold text-foreground">{currentProduct.name}</h3>
          <p className="text-muted-foreground">{currentProduct.beschreibung}</p>

          {/* Preis */}
          <div className="flex items-center justify-center gap-2">
            {currentProduct.preisBrutto > 0 ? (
              <span className="text-2xl font-bold text-foreground">
                {currentProduct.preisBrutto.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </span>
            ) : (
              <span className="text-2xl font-bold text-foreground">Preis im Shop</span>
            )}
            <Badge variant="secondary">
              {currentProduct.preisTyp === 'monatlich' ? '/Monat' : 'einmalig'}
            </Badge>
          </div>
        </div>

        {/* Bestell-Button */}
        <Button
          size="lg"
          className="w-full mt-6"
          onClick={() => handleOrderClick(currentProduct)}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Jetzt bestellen
        </Button>
      </div>

      {/* Progress-Dots */}
      <div className="flex justify-center gap-2">
        {sortedProducts.map((product, index) => (
          <div
            key={product.id}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-colors',
              orderedProducts.includes(product.id)
                ? 'bg-status-accepted'
                : index === currentIndex
                  ? 'bg-primary'
                  : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Bestätigungs-Dialog */}
      <AlertDialog open={!!confirmingProduct} onOpenChange={() => setConfirmingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestellung abgeschlossen?</AlertDialogTitle>
            <AlertDialogDescription>
              Hast du <strong>{confirmingProduct?.name}</strong> im Shop bestellt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nein, noch nicht</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOrder}>
              Ja, bestellt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox für Schlappen */}
      <ImageLightbox
        src={lightboxImage || ''}
        alt="Thermocheck Hausschuhe"
        open={!!lightboxImage}
        onOpenChange={() => setLightboxImage(null)}
      />
    </div>
  );
}
