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
import { OnboardingProduct } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface OrdersStepProps {
  products: OnboardingProduct[];
  orderedProducts: string[];
  onProductOrder: (productId: string) => void;
}

export function OrdersStep({ products, orderedProducts, onProductOrder }: OrdersStepProps) {
  const [confirmingProduct, setConfirmingProduct] = useState<OnboardingProduct | null>(null);

  // Sortiere Produkte nach Reihenfolge
  const sortedProducts = [...products].sort((a, b) => a.reihenfolge - b.reihenfolge);

  // Finde das aktuelle (nächste nicht-bestellte) Produkt
  const currentProduct = sortedProducts.find(p => !orderedProducts.includes(p.id));
  const currentIndex = sortedProducts.findIndex(p => p.id === currentProduct?.id);

  const handleOrderClick = (product: OnboardingProduct) => {
    // Öffne externen Link in neuem Tab
    window.open(product.externLink, '_blank', 'noopener,noreferrer');
    // Zeige Bestätigungs-Dialog
    setConfirmingProduct(product);
  };

  const handleConfirmOrder = () => {
    if (confirmingProduct) {
      onProductOrder(confirmingProduct.id);
      setConfirmingProduct(null);
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
        {/* Produktbild */}
        <div className="aspect-square max-w-xs mx-auto rounded-xl bg-muted overflow-hidden mb-6">
          <img
            src={currentProduct.bildUrl || '/placeholder.svg'}
            alt={currentProduct.name}
            className="w-full h-full object-cover"
          />
        </div>

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
    </div>
  );
}
