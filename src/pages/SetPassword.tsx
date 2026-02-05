import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GalvanekLogo } from '@/components/GalvanekLogo';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, { message: 'Passwort muss mindestens 8 Zeichen haben' })
    .max(72, { message: 'Passwort darf maximal 72 Zeichen haben' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Check if user has a valid session (required for password update)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[SetPassword] Session check:', session?.user?.email ?? 'none');
      setHasSession(!!session);
    };
    checkSession();

    // Also listen for session changes (in case Auth.tsx set it just before redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[SetPassword] Auth state changed:', session?.user?.email ?? 'none');
        setHasSession(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        console.error('[SetPassword] Error:', error.message);
        if (error.message.includes('should be different')) {
          toast.error('Neues Passwort muss sich vom alten unterscheiden');
        } else {
          toast.error(error.message);
        }
        return;
      }

      console.log('[SetPassword] Password updated successfully');
      toast.success('Passwort erfolgreich gesetzt!');
      
      // Redirect to home - onboarding will start automatically
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[SetPassword] Unexpected error:', err);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (hasSession === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No session - link expired or invalid
  if (!hasSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <GalvanekLogo className="h-10 w-auto mx-auto opacity-80" />
          
          <div className="bg-secondary border border-border rounded-lg p-6 space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            
            <h1 className="text-xl font-semibold text-foreground">
              Link abgelaufen
            </h1>
            
            <p className="text-sm text-muted-foreground">
              Der Link zum Passwort setzen ist abgelaufen oder ungültig. 
              Bitte fordere einen neuen Link an.
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/login', { replace: true })}
            className="w-full"
          >
            Zum Login
          </Button>
        </div>
      </div>
    );
  }

  // Has session - show password form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <GalvanekLogo className="h-10 w-auto mx-auto opacity-80" />
          <h1 className="text-xl font-semibold text-foreground">Passwort festlegen</h1>
          <p className="text-sm text-muted-foreground">
            Wähle ein sicheres Passwort für deinen Account.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neues Passwort</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort bestätigen</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Passwort speichern
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
