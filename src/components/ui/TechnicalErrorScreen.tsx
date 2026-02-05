import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GalvanekLogo } from '@/components/GalvanekLogo';

interface TechnicalErrorScreenProps {
  errorMessage: string;
  onRetry?: () => void;
}

export function TechnicalErrorScreen({ errorMessage, onRetry }: TechnicalErrorScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <GalvanekLogo className="w-32 h-auto mb-8" />
      
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <h2 className="text-xl font-semibold">Technischer Fehler</h2>
            
            <p className="text-muted-foreground text-sm">
              {errorMessage}
            </p>
            
            <div className="pt-4 space-y-3 w-full">
              {onRetry && (
                <Button 
                  onClick={onRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
              )}
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/login'}
              >
                Zurück zum Login
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground pt-4">
              Falls das Problem weiterhin besteht, kontaktiere bitte den Support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
