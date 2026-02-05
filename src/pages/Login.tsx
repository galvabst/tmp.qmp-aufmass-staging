import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Loader2, LogIn, Mail } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Bitte gültige E-Mail eingeben' }),
  password: z.string().min(1, { message: 'Passwort erforderlich' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('[Login] Error:', error.message);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('E-Mail oder Passwort falsch');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('E-Mail noch nicht bestätigt. Bitte prüfe dein Postfach.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      console.log('[Login] Success, redirecting to /');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      toast.error('Bitte E-Mail-Adresse eingeben');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      toast.error('Bitte gültige E-Mail-Adresse eingeben');
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        console.error('[Login] Reset password error:', error);
        toast.error('Fehler beim Senden der E-Mail');
        return;
      }

      toast.success('E-Mail gesendet! Bitte prüfe dein Postfach.');
      setIsResetMode(false);
      setResetEmail('');
    } catch (err) {
      console.error('[Login] Unexpected reset error:', err);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsResetting(false);
    }
  };

  // Password reset mode
  if (isResetMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full space-y-6">
          <div className="text-center space-y-2">
            <GalvanekLogo className="h-10 w-auto mx-auto opacity-80" />
            <h1 className="text-xl font-semibold text-foreground">Passwort zurücksetzen</h1>
            <p className="text-sm text-muted-foreground">
              Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium">
                E-Mail-Adresse
              </label>
              <Input
                id="reset-email"
                type="email"
                placeholder="name@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordReset()}
              />
            </div>

            <Button
              onClick={handlePasswordReset}
              disabled={isResetting}
              className="w-full gap-2"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Link senden
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setIsResetMode(false)}
              className="w-full"
            >
              Zurück zum Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <GalvanekLogo className="h-10 w-auto mx-auto opacity-80" />
          <h1 className="text-xl font-semibold text-foreground">Anmelden</h1>
          <p className="text-sm text-muted-foreground">
            Melde dich mit deiner E-Mail und deinem Passwort an.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                  Wird angemeldet...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Anmelden
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsResetMode(true)}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Passwort vergessen?
          </button>
        </div>

        {/* Optional: Sales OS fallback for internal users */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-2">
            Interner Mitarbeiter?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = 'https://salesos.lovable.app'}
            className="w-full text-xs"
          >
            Mit Sales OS anmelden
          </Button>
        </div>
      </div>
    </div>
  );
}
