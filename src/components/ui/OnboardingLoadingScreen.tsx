import { Loader2 } from 'lucide-react';
import { GalvanekLogo } from '@/components/GalvanekLogo';

interface OnboardingLoadingScreenProps {
  message?: string;
}

export function OnboardingLoadingScreen({ message = 'Lade Onboarding-Status...' }: OnboardingLoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6">
        <GalvanekLogo className="h-12 w-auto opacity-80" />
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{message}</span>
        </div>
      </div>
    </div>
  );
}
