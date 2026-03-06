import { useState } from 'react';
import { User, Mail, Phone, MapPin, LogOut, ChevronRight, Award, Edit2, X, Save, Target, Eye, Gift, Timer, Star, GraduationCap, CheckCircle2, BookOpen, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TechnicianProfile } from '@/types/technician';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { GalvanekLogo } from '@/components/GalvanekLogo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsTrainer } from '@/hooks/useIsTrainer';
import { TrainerProfileEditor } from '@/components/trainer/TrainerProfileEditor';
import { TrainerRideAlongs } from '@/components/trainer/TrainerRideAlongs';
import { useContractorBoni, useBoniSummary } from '@/hooks/useContractorBoni';
import { useContractorVerspaetungen, useVerspaetungStats } from '@/hooks/useContractorVerspaetungen';
import { useAkademieContent } from '@/hooks/useAkademieContent';
import { useAkademieFortschritt } from '@/hooks/useAkademieFortschritt';
import { useContractorActivityStats } from '@/features/contractors/hooks/useContractorActivityStats';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfileViewProps {
  profile: TechnicianProfile;
  profileId?: string | null;
  totalSubmittedOrders?: number;
  bewertungCount?: number;
  contractorOnboardingId?: string | null;
  onSave?: (updatedProfile: Partial<TechnicianProfile>) => void;
  onStartOnboardingPreview?: () => void;
}

export function ProfileView({ profile, profileId, totalSubmittedOrders = 0, bewertungCount = 0, contractorOnboardingId, onSave, onStartOnboardingPreview }: ProfileViewProps) {
  const navigate = useNavigate();
  const { data: isTrainer } = useIsTrainer(profileId || null);
  const { data: boni } = useContractorBoni();
  const boniSummary = useBoniSummary(boni);
  const { data: verspaetungen } = useContractorVerspaetungen();
  const punctuality = useVerspaetungStats(verspaetungen, totalSubmittedOrders);
  const { data: akademieModules } = useAkademieContent();
  const { data: completedLektionIds } = useAkademieFortschritt(contractorOnboardingId || null);
  const { data: activityStats } = useContractorActivityStats(contractorOnboardingId);
  const hasActivityData = activityStats && activityStats.some(d => d.checks > 0 || d.avgRating !== null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile.name,
    phone: profile.phone,
    region: profile.region,
  });

  const handleSave = () => {
    onSave?.(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: profile.name,
      phone: profile.phone,
      region: profile.region,
    });
    setIsEditing(false);
  };

  const kontingent = profile.kontingent;
  const kontingentPercent = kontingent.minimum > 0 ? Math.min((kontingent.angenommen / kontingent.minimum) * 100, 100) : 0;
  const kontingentRemaining = Math.max(kontingent.minimum - kontingent.angenommen, 0);
  const hasStats = profile.stats.totalOrders > 0 || profile.stats.rating > 0;

  // Akademie progress computation
  const akademieStats = (() => {
    if (!akademieModules || akademieModules.length === 0) return null;
    const completedSet = completedLektionIds || new Set<string>();
    
    let totalLektionen = 0;
    let completedCount = 0;
    
    const modulStats = akademieModules.map(modul => {
      let modulTotal = 0;
      let modulCompleted = 0;
      
      for (const up of modul.unterpunkte) {
        if (up.isGroup && up.children?.length) {
          for (const child of up.children) {
            modulTotal++;
            if (completedSet.has(child.id)) modulCompleted++;
          }
        } else {
          modulTotal++;
          if (completedSet.has(up.id)) modulCompleted++;
        }
      }
      
      totalLektionen += modulTotal;
      completedCount += modulCompleted;
      
      return {
        id: modul.id,
        titel: modul.titel,
        displayNummer: modul.displayNummer,
        total: modulTotal,
        completed: modulCompleted,
        unterpunkte: modul.unterpunkte,
      };
    });
    
    const percent = totalLektionen > 0 ? Math.round((completedCount / totalLektionen) * 100) : 0;
    return { totalLektionen, completedCount, percent, modules: modulStats };
  })();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground safe-area-top">
        <div className="p-6 pt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground text-xl font-bold"
                  />
                ) : (
                  <>
                    <h1 className="text-xl font-bold">{profile.name}</h1>
                    <p className="text-primary-foreground/80 text-sm">Techniker seit {profile.memberSince}</p>
                  </>
                )}
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={handleCancel}>
                    <X className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={handleSave}>
                    <Save className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          {/* Logo centered between name and stats */}
          <div className="flex justify-center py-1">
            <GalvanekLogo size="md" variant="white" className="opacity-90" />
          </div>
        </div>
      </header>

      {/* Stats: Aufträge | Bewertung (⭐ + count) | Pünktlichkeit (%) */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-lg shadow-card p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{hasStats ? profile.stats.totalOrders : '–'}</p>
              <p className="text-xs text-muted-foreground">Aufträge</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <p className="text-2xl font-bold text-foreground">
                  {hasStats && profile.stats.rating > 0 ? profile.stats.rating.toFixed(1) : '–'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {bewertungCount > 0 ? `${bewertungCount} Bewertungen` : 'Bewertung'}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totalSubmittedOrders > 0 ? `${punctuality.onTimePercent}%` : '–'}
              </p>
              <p className="text-xs text-muted-foreground">
                {punctuality.lateCount > 0 ? `${punctuality.lateCount} verspätet` : 'Pünktlichkeit'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quartals-Kontingent */}
      <section className="p-4 pt-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Kontingent {kontingent.quartal}</h2>
        <div className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">Angenommene Aufträge</span>
                <span className="text-sm font-bold text-foreground">{kontingent.angenommen} / {kontingent.minimum}</span>
              </div>
              <Progress value={kontingentPercent} className="h-2" />
            </div>
          </div>
          {kontingent.abgenommen > 0 && (
            <p className="text-xs text-muted-foreground text-center mb-1">Davon abgenommen: {kontingent.abgenommen}</p>
          )}
          {kontingentRemaining > 0 ? (
            <p className="text-sm text-muted-foreground text-center">Noch {kontingentRemaining} Aufträge bis Quartalsziel</p>
          ) : (
            <p className="text-sm text-green-600 text-center font-medium">✓ Quartalsziel erreicht!</p>
          )}
        </div>
      </section>

      {/* Boni-Übersicht */}
      {boniSummary.count > 0 && (
        <section className="p-4 pt-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Boni</h2>
          <div className="bg-card rounded-lg shadow-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">Bonus-Übersicht</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{boniSummary.ausstehend.toFixed(0)} €</p>
                <p className="text-xs text-muted-foreground">Ausstehend</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">{boniSummary.freigegeben.toFixed(0)} €</p>
                <p className="text-xs text-muted-foreground">Freigegeben</p>
              </div>
              <div>
                <p className="text-lg font-bold text-status-accepted">{boniSummary.ausgezahlt.toFixed(0)} €</p>
                <p className="text-xs text-muted-foreground">Ausgezahlt</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pünktlichkeit Detail */}
      {totalSubmittedOrders > 0 && (
        <section className="p-4 pt-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Pünktlichkeit</h2>
          <div className="bg-card rounded-lg shadow-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${punctuality.lateCount > 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                <Timer className={`w-5 h-5 ${punctuality.lateCount > 0 ? 'text-destructive' : 'text-green-600'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">Pünktliche Abgaben</span>
                  <span className={`text-sm font-bold ${punctuality.lateCount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {punctuality.onTimePercent}%
                  </span>
                </div>
                <Progress value={punctuality.onTimePercent} className="h-2" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{punctuality.onTimeCount}</p>
                <p className="text-xs text-muted-foreground">Pünktlich</p>
              </div>
              <div>
                <p className="text-lg font-bold text-destructive">{punctuality.lateCount}</p>
                <p className="text-xs text-muted-foreground">Verspätet</p>
              </div>
              <div>
                <p className="text-lg font-bold text-destructive">{punctuality.totalFee.toFixed(0)} €</p>
                <p className="text-xs text-muted-foreground">Late Fees</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {isTrainer && profileId && (
        <>
          <TrainerProfileEditor profileId={profileId} />
          <TrainerRideAlongs profileId={profileId} />
        </>
      )}

      {/* Akademie */}
      {akademieStats && akademieStats.totalLektionen > 0 && (
        <section className="p-4 pt-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Akademie</h2>
          <div className="bg-card rounded-lg shadow-card p-4">
            {/* Overall progress */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">Fortschritt</span>
                  <span className="text-sm font-bold text-foreground">
                    {akademieStats.completedCount}/{akademieStats.totalLektionen} ({akademieStats.percent}%)
                  </span>
                </div>
                <Progress value={akademieStats.percent} className="h-2" />
              </div>
            </div>

            {/* Module list */}
            <div className="space-y-2">
              {akademieStats.modules.map(modul => {
                const isComplete = modul.completed === modul.total && modul.total > 0;
                return (
                  <div key={modul.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground font-medium">
                        Modul {modul.displayNummer}: {modul.titel}
                      </span>
                      <span className={`text-xs font-medium ${isComplete ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {isComplete ? '✓' : `${modul.completed}/${modul.total}`}
                      </span>
                    </div>
                    {/* Lektion details (collapsed when complete) */}
                    {!isComplete && (
                      <div className="pl-4 space-y-0.5">
                        {modul.unterpunkte.map(up => {
                          if (up.isGroup && up.children?.length) {
                            return up.children.map(child => (
                              <button
                                key={child.id}
                                onClick={() => navigate(`/akademie/modul/${child.id}`)}
                                className="flex items-center gap-2 w-full text-left py-0.5 hover:bg-secondary/50 rounded px-1 transition-colors"
                              >
                                {completedLektionIds?.has(child.id) ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                ) : (
                                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                )}
                                <span className={`text-xs ${completedLektionIds?.has(child.id) ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                  {child.titel}
                                </span>
                              </button>
                            ));
                          }
                          return (
                            <button
                              key={up.id}
                              onClick={() => navigate(`/akademie/modul/${up.id}`)}
                              className="flex items-center gap-2 w-full text-left py-0.5 hover:bg-secondary/50 rounded px-1 transition-colors"
                            >
                              {completedLektionIds?.has(up.id) ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                              ) : (
                                <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                              <span className={`text-xs ${completedLektionIds?.has(up.id) ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {up.titel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact Info */}
      <section className="p-4 pt-0">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Kontaktdaten</h2>
        <div className="bg-card rounded-lg shadow-card divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">{profile.email}</span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone className="w-5 h-5 text-muted-foreground" />
            {isEditing ? (
              <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="flex-1" />
            ) : (
              <span className="text-foreground">{profile.phone}</span>
            )}
          </div>
          <div className="flex items-center gap-3 p-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            {isEditing ? (
              <Input value={editData.region} onChange={(e) => setEditData({ ...editData, region: e.target.value })} className="flex-1" />
            ) : (
              <span className="text-foreground">{profile.region}</span>
            )}
          </div>
        </div>
      </section>

      {/* Certificates */}
      {profile.certificates.length > 0 && (
        <section className="p-4 pt-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Zertifikate</h2>
          <div className="bg-card rounded-lg shadow-card divide-y divide-border">
            {profile.certificates.map((cert, index) => (
              <div key={index} className="flex items-center gap-3 p-4">
                <Award className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <span className="text-foreground">{cert.name}</span>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(cert.completedAt), 'd. MMMM yyyy', { locale: de })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu - only for trainers with onboarding preview */}
      {isTrainer && onStartOnboardingPreview && (
        <section className="p-4 pt-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Trainer</h2>
          <div className="bg-card rounded-lg shadow-card divide-y divide-border">
            <button
              onClick={onStartOnboardingPreview}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
            >
              <Eye className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-foreground text-left">Onboarding-Vorschau</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>
      )}

      {/* Logout */}
      <section className="p-4 pt-0">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.info('Abgemeldet');
            window.location.reload();
          }}
          className="w-full flex items-center gap-3 p-4 bg-card rounded-lg shadow-card text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Abmelden</span>
        </button>
      </section>
    </div>
  );
}
