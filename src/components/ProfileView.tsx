import { useState } from 'react';
import { User, Mail, Phone, MapPin, Settings, LogOut, ChevronRight, Award, Edit2, X, Save, CheckCircle, Circle, Clock, Target, Eye } from 'lucide-react';
import { TechnicianProfile } from '@/types/technician';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface ProfileViewProps {
  profile: TechnicianProfile;
  onSave?: (updatedProfile: Partial<TechnicianProfile>) => void;
  onStartOnboarding?: () => void;
  onStartOnboardingPreview?: () => void;
}

export function ProfileView({ profile, onSave, onStartOnboarding, onStartOnboardingPreview }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile.name,
    phone: profile.phone,
    region: profile.region,
  });

  const menuItems = [
    { icon: User, label: 'Persönliche Daten', href: '#' },
    { icon: Settings, label: 'Einstellungen', href: '#' },
  ];

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

  const getStepIcon = (status: 'completed' | 'in_progress' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-primary" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const onboarding = profile.onboarding;
  const kontingent = profile.kontingent;
  const kontingentPercent = Math.min((kontingent.abgenommen / kontingent.minimum) * 100, 100);
  const kontingentRemaining = Math.max(kontingent.minimum - kontingent.abgenommen, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground safe-area-top">
        <div className="p-6 pt-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center overflow-hidden">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
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
                  <p className="text-primary-foreground/80 text-sm">
                    Techniker seit {profile.memberSince}
                  </p>
                </>
              )}
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={handleCancel}
                >
                  <X className="w-5 h-5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={handleSave}
                >
                  <Save className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-lg shadow-card p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{profile.stats.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Aufträge</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{profile.stats.acceptanceRate}%</p>
              <p className="text-xs text-muted-foreground">Annahmerate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{profile.stats.rating}</p>
              <p className="text-xs text-muted-foreground">Bewertung</p>
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
                <span className="text-sm font-medium text-foreground">Abgenommene Aufträge</span>
                <span className="text-sm font-bold text-foreground">
                  {kontingent.abgenommen} / {kontingent.minimum}
                </span>
              </div>
              <Progress value={kontingentPercent} className="h-2" />
            </div>
          </div>
          {kontingentRemaining > 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              Noch {kontingentRemaining} Aufträge bis Quartalsziel
            </p>
          ) : (
            <p className="text-sm text-green-600 text-center font-medium">
              ✓ Quartalsziel erreicht!
            </p>
          )}
        </div>
      </section>

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
              <Input
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="flex-1"
              />
            ) : (
              <span className="text-foreground">{profile.phone}</span>
            )}
          </div>
          <div className="flex items-center gap-3 p-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            {isEditing ? (
              <Input
                value={editData.region}
                onChange={(e) => setEditData({ ...editData, region: e.target.value })}
                className="flex-1"
              />
            ) : (
              <span className="text-foreground">{profile.region}</span>
            )}
          </div>
        </div>
      </section>

      {/* Onboarding Progress - only show if not completed */}
      {onboarding && !onboarding.isCompleted && (
        <section className="p-4 pt-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Onboarding</h2>
          <div className="bg-card rounded-lg shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Fortschritt</span>
              <span className="text-sm text-muted-foreground">{onboarding.progressPercent}%</span>
            </div>
            <Progress value={onboarding.progressPercent} className="h-2 mb-4" />
            
            <div className="space-y-3">
              {onboarding.steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <span className={`text-sm ${step.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {step.label}
                    </span>
                    {step.status === 'in_progress' && (
                      <span className="ml-2 text-xs text-primary">(Aktiv)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {onStartOnboarding && (
              <Button 
                className="w-full mt-4" 
                onClick={onStartOnboarding}
              >
                Onboarding fortsetzen
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Onboarding Completed Badge */}
      {onboarding?.isCompleted && (
        <section className="p-4 pt-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Onboarding</h2>
          <div className="bg-card rounded-lg shadow-card p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-foreground font-medium">Onboarding abgeschlossen</span>
          </div>
        </section>
      )}

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

      {/* Menu */}
      <section className="p-4 pt-0">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Einstellungen</h2>
        <div className="bg-card rounded-lg shadow-card divide-y divide-border">
          {/* Onboarding Preview Button */}
          {onStartOnboardingPreview && (
            <button
              onClick={onStartOnboardingPreview}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
            >
              <Eye className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-foreground text-left">Onboarding-Vorschau</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-foreground">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </a>
            );
          })}
        </div>
      </section>

      {/* Logout */}
      <section className="p-4 pt-0">
        <button className="w-full flex items-center justify-center gap-2 p-4 bg-card rounded-lg shadow-card text-destructive font-medium hover:bg-destructive/5 transition-colors">
          <LogOut className="w-5 h-5" />
          Abmelden
        </button>
      </section>
    </div>
  );
}
