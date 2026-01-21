import { User, Mail, Phone, MapPin, Settings, LogOut, ChevronRight, Shield, Award, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TechnicianProfile } from '@/types/technician';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface ProfileViewProps {
  profile: TechnicianProfile;
  onEdit?: () => void;
  showAdminLink?: boolean;
}

export function ProfileView({ profile, onEdit, showAdminLink = true }: ProfileViewProps) {
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: User, label: 'Persönliche Daten', href: '#' },
    { icon: Settings, label: 'Einstellungen', href: '#' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground safe-area-top">
        <div className="p-6 pt-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              <p className="text-primary-foreground/80 text-sm">
                Techniker seit {profile.memberSince}
              </p>
            </div>
            {onEdit && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={onEdit}
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
              <p className="text-2xl font-bold text-status-accepted">{profile.stats.acceptanceRate}%</p>
              <p className="text-xs text-muted-foreground">Annahmerate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{profile.stats.rating}</p>
              <p className="text-xs text-muted-foreground">Bewertung</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <section className="p-4 mt-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Kontaktdaten</h2>
        <div className="bg-card rounded-lg shadow-card divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">{profile.email}</span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">{profile.phone}</span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">{profile.region}</span>
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
                <Award className="w-5 h-5 text-status-accepted" />
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

      {/* Admin Link */}
      {showAdminLink && (
        <section className="p-4 pt-0">
          <button 
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-center gap-2 p-4 bg-primary rounded-lg shadow-card text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Shield className="w-5 h-5" />
            Admin-Bereich
          </button>
        </section>
      )}

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
