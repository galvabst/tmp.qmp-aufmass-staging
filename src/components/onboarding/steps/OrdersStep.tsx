import { ExternalLink, Check, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OnboardingProduct } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface OrdersStepProps {
  products: OnboardingProduct[];
  orderedProducts: string[];
  onProductOrder: (productId: string) => void;
}

export function OrdersStep({ products, orderedProducts, onProductOrder }: OrdersStepProps) {
  const allRequiredOrdered = products
    .filter(p => p.pflicht)
    .every(p => orderedProducts.includes(p.id));

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex gap-3">
          <ShoppingCart className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">Pflichtbestellungen</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Diese Produkte sind für deine Arbeit als Thermocheck-Techniker erforderlich.
            </p>
          </div>
        </div>
      </div>

      {/* Produkte */}
      <div className="space-y-3">
        {products.map((product) => {
          const isOrdered = orderedProducts.includes(product.id);
          
          return (
            <div
              key={product.id}
              className={cn(
                'bg-card rounded-xl p-4 shadow-card transition-all',
                isOrdered && 'ring-2 ring-status-accepted'
              )}
            >
              <div className="flex gap-4">
                {/* Produktbild */}
                <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  <img 
                    src={product.bildUrl || '/placeholder.svg'} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{product.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.beschreibung}
                      </p>
                    </div>
                    {isOrdered && (
                      <div className="w-6 h-6 rounded-full bg-status-accepted flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Preis */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-foreground">
                      {product.preisBrutto.toLocaleString('de-DE', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {product.preisTyp === 'monatlich' ? '/Monat' : 'einmalig'}
                    </Badge>
                    {product.pflicht && (
                      <Badge variant="destructive" className="text-xs">Pflicht</Badge>
                    )}
                  </div>

                  {/* Button */}
                  <Button
                    size="sm"
                    variant={isOrdered ? 'outline' : 'default'}
                    onClick={() => onProductOrder(product.id)}
                    className="mt-3 w-full"
                    disabled={isOrdered}
                  >
                    {isOrdered ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Bestellt
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Jetzt bestellen
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hinweis */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>💡 Tipp:</strong> Während du auf deine Lieferungen wartest, 
          kannst du bereits mit der Akademie-Schulung beginnen!
        </p>
      </div>
    </div>
  );
}
