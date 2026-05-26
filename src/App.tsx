import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import Admin from "./pages/Admin";
import AkademieModul from "./pages/AkademieModul";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";
const AufmassFormPage = lazy(() => import("@/features/aufmass/ui/AufmassFormPage"));
const AufstellortCheckPage = lazy(() => import("@/features/aufmass/ui/AufstellortCheckPage"));
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { SubscriptionBlockedOverlay } from "@/components/subscription/SubscriptionAccessGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ImpersonationBanner />
      <SubscriptionBlockedOverlay />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Login />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/akademie/modul/:modulId" element={<AkademieModul />} />
          <Route path="/thermocheck/aufmass/:auftragId" element={<Suspense fallback={<div className="p-4">Laden...</div>}><AufmassFormPage /></Suspense>} />
          <Route path="/thermocheck/aufstellort-check/:auftragId" element={<Suspense fallback={<div className="p-4">Laden...</div>}><AufstellortCheckPage /></Suspense>} />
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute>
                <Admin />
              </ProtectedAdminRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
