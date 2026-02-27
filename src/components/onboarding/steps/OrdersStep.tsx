import { useState } from 'react';
import { ShoppingCart, Check, ArrowLeft, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OnboardingProduct, ClothingVariant, OberteilAuswahl } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { ProductImageSlideshow } from '../ProductImageSlideshow';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { SizeSelector } from '../SizeSelector';
import { QuantitySelector } from '../QuantitySelector';
import { useOnboardingSizes } from '@/hooks/useOnboardingSizes';
import { brauchtGroessenauswahl } from '@/lib/onboarding-sizes';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';

// Import Kleidungsbilder
import tshirtVorne from '@/assets/onboarding/kleidung/tshirt-vorne.png';
import tshirtHinten from '@/assets/onboarding/kleidung/tshirt-hinten.png';
import poloshirtVorne from '@/assets/onboarding/kleidung/poloshirt-vorne.png';
import poloshirtHinten from '@/assets/onboarding/kleidung/poloshirt-hinten.png';
import pulloverVorne from '@/assets/onboarding/kleidung/pullover-vorne.png';
import pulloverHinten from '@/assets/onboarding/kleidung/pullover-hinten.png';
import schlappen from '@/assets/onboarding/kleidung/schlappen.png';
import ausweiskarteVorne from '@/assets/onboarding/kleidung/ausweiskarte-vorne.png';
import ausweiskarteHinten from '@/assets/onboarding/kleidung/ausweiskarte-hinten.png';

// Import Lizenz-Bilder
import scannerLizenz from '@/assets/onboarding/lizenzen/scanner-lizenz.png';
import googleWorkspace from '@/assets/onboarding/lizenzen/google-workspace.png';

// Bilder für Slideshows
export const PULLOVER_BILDER = [pulloverVorne, pulloverHinten];
export const AUSWEISKARTE_BILDER = [ausweiskarteVorne, ausweiskarteHinten];

// Oberteil-Varianten mit Bildern (ohne externLink - Stripe-Integration)
const OBERTEIL_VARIANTEN: ClothingVariant[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    bildUrls: [tshirtVorne, tshirtHinten],
    externLink: '', // Legacy - nicht mehr genutzt
  },
  {
    id: 'poloshirt',
    name: 'Poloshirt',
    bildUrls: [poloshirtVorne, poloshirtHinten],
    externLink: '', // Legacy - nicht mehr genutzt
  },
];

function PriceInfoBanner() {
  return (
    <div className="rounded-2xl bg-muted/50 px-5 py-4">
      <div className="flex gap-3">
        <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Jedes Kleidungsstück wird <span className="text-foreground font-medium">individuell mit deinem Namen</span> bedruckt. 
          Die Druckereipreise geben wir <span className="text-foreground font-medium">1:1 ohne Aufschlag</span> weiter. 
          Die Kosten könnten als Betriebsausgaben absetzbar sein — sprich das mit deinem Steuerberater ab.
        </p>
      </div>
    </div>
  );
}

interface OrdersStepProps {
  products: OnboardingProduct[];
  orderedProducts: string[];
  onProductOrder: (productId: string) => void;
  oberteilAuswahl: OberteilAuswahl;
  onOberteilAuswahl: (auswahl: OberteilAuswahl) => void;
  isLoadingOrders?: boolean;
}

export function OrdersStep({ 
  products, 
  orderedProducts, 
  onProductOrder,
  oberteilAuswahl,
  onOberteilAuswahl,
  isLoadingOrders = false,
}: OrdersStepProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ClothingVariant | null>(OBERTEIL_VARIANTEN[0]);
  
  // Größenauswahl State
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { updateSize, isUpdating } = useOnboardingSizes();
  
  // Stripe Checkout Hook
  const { startCheckout, startMultiCheckout, isLoading: isCheckoutLoading } = useStripeCheckout();

  // Loading-State: Zeige Skeleton bis DB-Bestellungen geladen sind
  if (isLoadingOrders) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-6 shadow-card animate-pulse">
          <div className="aspect-[3/4] max-w-xs mx-auto rounded-xl bg-muted mb-6" />
          <div className="space-y-3 text-center">
            <div className="h-7 bg-muted rounded w-48 mx-auto" />
            <div className="h-4 bg-muted rounded w-64 mx-auto" />
            <div className="h-8 bg-muted rounded w-32 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const KLEIDUNG_IDS = ['tshirt', 'poloshirt', 'pullover', 'schlappen', 'ausweiskarte', 'oberteil'];
  const isKleidungsProdukt = (id: string) => KLEIDUNG_IDS.includes(id);

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

  const handleSizeSelect = async (produktId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [produktId]: size }));
    // Größe direkt in DB speichern
    try {
      await updateSize({ produktId, groesse: size });
    } catch (error) {
      console.error('[OrdersStep] Failed to save size:', error);
      // Trotzdem lokal speichern für UX
    }
  };

  // Helper: Ist Produkt mehrfach bestellbar?
  const isMultiOrder = (produktId: string): boolean => {
    return ['tshirt', 'poloshirt', 'pullover', 'schlappen'].includes(produktId);
  };

  const getQuantity = (produktId: string): number => quantities[produktId] || 1;

  // Stripe Checkout starten statt externem Link
  const handleOrderClick = async (product: OnboardingProduct) => {
    const sizeType = brauchtGroessenauswahl(product.id);
    
    // Prüfe ob Größe ausgewählt wurde (falls erforderlich)
    if (sizeType && !selectedSizes[product.id]) {
      return; // Button sollte disabled sein, aber sicherheitshalber
    }
    
    // Starte Stripe Checkout mit Menge
    await startCheckout(product.id, selectedSizes[product.id], getQuantity(product.id));
  };

  // Stripe Checkout für Oberteil-Varianten
  const handleVariantOrderClick = async (variant: ClothingVariant) => {
    const sizeType = brauchtGroessenauswahl(variant.id);
    
    // Prüfe ob Größe ausgewählt wurde (falls erforderlich)
    if (sizeType && !selectedSizes[variant.id]) {
      return; // Button sollte disabled sein
    }
    
    // Starte Stripe Checkout mit Menge
    await startCheckout(variant.id, selectedSizes[variant.id], getQuantity(variant.id));
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
        <PriceInfoBanner />
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

        {/* Bestell-Ansicht nach Auswahl: Einzelnes Oberteil */}
        {oberteilAuswahl && oberteilAuswahl !== 'beides' && nextVariant && (
          <div className="bg-card rounded-2xl p-6 shadow-card">
            {/* Auswahl ändern - nur wenn noch kein Oberteil bestellt */}
            {!orderedProducts.includes('tshirt') && !orderedProducts.includes('poloshirt') && (
              <button
                type="button"
                onClick={() => onOberteilAuswahl(null)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Auswahl ändern
              </button>
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

            <div className="mt-4">
              <QuantitySelector
                value={getQuantity(nextVariant.id)}
                onChange={(v) => setQuantities(prev => ({ ...prev, [nextVariant.id]: v }))}
                disabled={isUpdating || isCheckoutLoading}
              />
            </div>

            <div className="mt-4">
              <SizeSelector
                type="kleidung"
                selectedSize={selectedSizes[nextVariant.id] || null}
                onSizeSelect={(size) => handleSizeSelect(nextVariant.id, size)}
                disabled={isUpdating || isCheckoutLoading}
              />
            </div>

            <Button
              size="lg"
              className="w-full mt-6"
              onClick={() => handleVariantOrderClick(nextVariant)}
              disabled={!selectedSizes[nextVariant.id] || isUpdating || isCheckoutLoading}
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Weiterleitung zu Stripe...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {selectedSizes[nextVariant.id] 
                    ? `Jetzt bestellen (Größe ${selectedSizes[nextVariant.id]})`
                    : 'Zuerst Größe wählen'
                  }
                </>
              )}
            </Button>
          </div>
        )}

        {/* Sammel-Checkout: Beide Oberteile auf einer Seite */}
        {oberteilAuswahl === 'beides' && !isOberteilComplete() && (
          <div className="space-y-4">
            {/* Auswahl ändern */}
            {!orderedProducts.includes('tshirt') && !orderedProducts.includes('poloshirt') && (
              <button
                type="button"
                onClick={() => onOberteilAuswahl(null)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Auswahl ändern
              </button>
            )}

            {OBERTEIL_VARIANTEN.filter(v => !orderedProducts.includes(v.id)).map((variant) => (
              <div key={variant.id} className="bg-card rounded-2xl p-6 shadow-card">
                <ProductImageSlideshow
                  images={variant.bildUrls}
                  alt={`Thermocheck ${variant.name}`}
                />
                <div className="text-center mt-4 space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    Thermocheck {variant.name}
                  </h3>
                  <Badge variant="secondary">Preis im Shop (einmalig)</Badge>
                </div>

                <div className="mt-4">
                  <QuantitySelector
                    value={getQuantity(variant.id)}
                    onChange={(v) => setQuantities(prev => ({ ...prev, [variant.id]: v }))}
                    disabled={isUpdating || isCheckoutLoading}
                  />
                </div>

                <div className="mt-4">
                  <SizeSelector
                    type="kleidung"
                    selectedSize={selectedSizes[variant.id] || null}
                    onSizeSelect={(size) => handleSizeSelect(variant.id, size)}
                    disabled={isUpdating || isCheckoutLoading}
                  />
                </div>
              </div>
            ))}

            {/* Gemeinsamer Bestell-Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={async () => {
                const itemsToOrder = OBERTEIL_VARIANTEN
                  .filter(v => !orderedProducts.includes(v.id))
                  .map(v => ({
                    produktKey: v.id,
                    groesse: selectedSizes[v.id],
                    menge: getQuantity(v.id),
                  }));
                await startMultiCheckout(itemsToOrder);
              }}
              disabled={
                OBERTEIL_VARIANTEN
                  .filter(v => !orderedProducts.includes(v.id))
                  .some(v => !selectedSizes[v.id]) ||
                isUpdating || isCheckoutLoading
              }
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Weiterleitung zu Stripe...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Beide jetzt bestellen
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Standard-Produkt-Ansicht
  return (
    <div className="space-y-6">
      {isKleidungsProdukt(currentProduct.id) && <PriceInfoBanner />}
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
        ) : currentProduct.id === 'ausweiskarte' ? (
          <ProductImageSlideshow
            images={AUSWEISKARTE_BILDER}
            alt={currentProduct.name}
            className="mb-6"
          />
        ) : currentProduct.id === 'scanner-lizenz' ? (
          <div 
            className="relative w-full max-w-md mx-auto mb-6 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setLightboxImage(scannerLizenz)}
            role="button"
            aria-label={`${currentProduct.name} vergrößern`}
          >
            <img 
              src={scannerLizenz}
              alt={currentProduct.name}
              className="w-full rounded-lg shadow-lg"
            />
            <p className="text-center text-sm text-muted-foreground mt-2">
              Tippen zum Vergrößern
            </p>
          </div>
        ) : currentProduct.id === 'google-workspace' ? (
          <div 
            className="relative w-full max-w-md mx-auto mb-6 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setLightboxImage(googleWorkspace)}
            role="button"
            aria-label={`${currentProduct.name} vergrößern`}
          >
            <img 
              src={googleWorkspace}
              alt={currentProduct.name}
              className="w-full rounded-lg shadow-lg"
            />
            <p className="text-center text-sm text-muted-foreground mt-2">
              Tippen zum Vergrößern
            </p>
          </div>
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

        {/* Größenauswahl für Produkte die es benötigen */}
        {brauchtGroessenauswahl(currentProduct.id) && (
          <div className="mt-6">
            <SizeSelector
              type={brauchtGroessenauswahl(currentProduct.id)!}
              selectedSize={selectedSizes[currentProduct.id] || null}
              onSizeSelect={(size) => handleSizeSelect(currentProduct.id, size)}
              disabled={isUpdating || isCheckoutLoading}
            />
          </div>
        )}

        {/* Mengenauswahl für Kleidungsprodukte */}
        {isMultiOrder(currentProduct.id) && (
          <div className="mt-6">
            <QuantitySelector
              value={getQuantity(currentProduct.id)}
              onChange={(v) => setQuantities(prev => ({ ...prev, [currentProduct.id]: v }))}
              disabled={isCheckoutLoading}
            />
          </div>
        )}

        {/* Bestell-Button mit Stripe */}
        <Button
          size="lg"
          className="w-full mt-6"
          onClick={() => handleOrderClick(currentProduct)}
          disabled={
            (brauchtGroessenauswahl(currentProduct.id) && !selectedSizes[currentProduct.id]) ||
            isCheckoutLoading
          }
        >
          {isCheckoutLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Weiterleitung zu Stripe...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              {brauchtGroessenauswahl(currentProduct.id) && selectedSizes[currentProduct.id]
                ? `Jetzt bestellen (Größe ${selectedSizes[currentProduct.id]})`
                : brauchtGroessenauswahl(currentProduct.id)
                  ? 'Zuerst Größe wählen'
                  : 'Jetzt bestellen'
              }
            </>
          )}
        </Button>
      </div>

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
